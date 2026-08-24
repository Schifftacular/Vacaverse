import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/index.js';
import { requireAuth } from '../auth.js';
import { sendInviteEmail } from '../lib/listmonk.js';

const router = Router();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const EMAIL_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

router.post('/', requireAuth, (req, res) => {
    const { family_id } = req.body || {};
    if (!family_id) return res.status(400).json({ error: 'family_id is required' });
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    const id = nanoid();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO invites (id, code, family_id, created_by, expires_at) VALUES (?, ?, ?, ?, ?)')
        .run(id, code, family_id, req.user.id, expiresAt);
    res.status(201).json({ data: { code }, error: null });
});

// Note: invites are intentionally multi-use until they expire — a family invite
// is meant to be shared with several relatives, not consumed by the first person
// who clicks it.
router.get('/lookup/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const invite = db
        .prepare(`
            SELECT invites.id as invite_id, invites.family_id, invites.expires_at, families.name as family_name
            FROM invites JOIN families ON families.id = invites.family_id
            WHERE invites.code = ?
        `)
        .get(code);

    if (!invite || new Date(invite.expires_at) < new Date()) {
        return res.json({ data: null, error: null });
    }

    res.json({
        data: { familyId: invite.family_id, familyName: invite.family_name, inviteId: invite.invite_id },
        error: null,
    });
});

// POST /api/invites/email — create + send a single-use, email-targeted
// invite for a trip or a family. Unlike the code-invite route above, this
// mutates state and sends mail, so the sender's access is checked here
// server-side rather than relying on the client's own access classification.
router.post('/email', requireAuth, async (req, res) => {
    const { target_type, trip_id, family_id, email } = req.body || {};
    if (target_type !== 'trip' && target_type !== 'family') {
        return res.status(400).json({ error: 'target_type must be "trip" or "family"' });
    }
    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'email is required' });
    }

    let targetName;
    if (target_type === 'trip') {
        if (!trip_id) return res.status(400).json({ error: 'trip_id is required' });
        const trip = db.prepare('SELECT id, title, user_id, family_id FROM trips WHERE id = ?').get(trip_id);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        const isOwner = trip.user_id === req.user.id;
        const isTripMember = !!db
            .prepare('SELECT 1 FROM trip_members WHERE trip_id = ? AND user_id = ?')
            .get(trip_id, req.user.id);
        const isFamilyMember = !!(
            trip.family_id &&
            db.prepare('SELECT 1 FROM family_members WHERE family_id = ? AND user_id = ?').get(trip.family_id, req.user.id)
        );
        if (!isOwner && !isTripMember && !isFamilyMember) {
            return res.status(403).json({ error: 'You do not have access to invite people to this trip' });
        }
        targetName = trip.title;
    } else {
        if (!family_id) return res.status(400).json({ error: 'family_id is required' });
        const family = db.prepare('SELECT id, name FROM families WHERE id = ?').get(family_id);
        if (!family) return res.status(404).json({ error: 'Family not found' });

        const isMember = !!db
            .prepare('SELECT 1 FROM family_members WHERE family_id = ? AND user_id = ?')
            .get(family_id, req.user.id);
        if (!isMember) return res.status(403).json({ error: 'You do not have access to invite people to this family' });
        targetName = family.name;
    }

    const id = nanoid();
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + EMAIL_INVITE_TTL_MS).toISOString();
    db.prepare(
        `INSERT INTO email_invites (id, token, target_type, trip_id, family_id, email, invited_by, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
        id,
        token,
        target_type,
        target_type === 'trip' ? trip_id : null,
        target_type === 'family' ? family_id : null,
        email,
        req.user.id,
        expiresAt
    );

    const joinUrl = `${CLIENT_ORIGIN}/join?token=${token}`;
    try {
        await sendInviteEmail({ email, targetType: target_type, targetName, joinUrl });
    } catch (err) {
        // A row that failed to send is just dead data a lookup could still
        // (uselessly) resolve — don't leave it behind.
        db.prepare('DELETE FROM email_invites WHERE id = ?').run(id);
        return res.status(err.status || 502).json({ error: err.message || 'Failed to send invite email' });
    }

    res.status(201).json({ data: { id, token }, error: null });
});

// GET /api/invites/email/lookup/:token — no auth, mirrors the code lookup
// above. Single-use: an already-accepted or expired token resolves to null.
router.get('/email/lookup/:token', (req, res) => {
    const { token } = req.params;
    const invite = db
        .prepare(
            `SELECT ei.*, trips.title as trip_title, families.name as family_name
             FROM email_invites ei
             LEFT JOIN trips ON trips.id = ei.trip_id
             LEFT JOIN families ON families.id = ei.family_id
             WHERE ei.token = ?`
        )
        .get(token);

    if (!invite || invite.status === 'accepted' || new Date(invite.expires_at) < new Date()) {
        return res.json({ data: null, error: null });
    }

    res.json({
        data: {
            targetType: invite.target_type,
            tripId: invite.trip_id,
            familyId: invite.family_id,
            name: invite.target_type === 'trip' ? invite.trip_title : invite.family_name,
            email: invite.email,
        },
        error: null,
    });
});

// POST /api/invites/email/accept — atomic token exchange: validates the
// token, writes the membership row, and marks the invite accepted inside one
// transaction so a double-click or concurrent request can't join twice.
// Deliberately does NOT require the accepting account's email to match the
// invited address — mirrors the existing forwardable family-code UX, with
// the single-use token as the abuse bound.
router.post('/email/accept', requireAuth, (req, res) => {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token is required' });

    const accept = db.transaction((token, userId) => {
        const invite = db.prepare('SELECT * FROM email_invites WHERE token = ?').get(token);
        if (!invite) throw Object.assign(new Error('Invalid invite'), { status: 404 });
        if (invite.status === 'accepted') throw Object.assign(new Error('Invite already used'), { status: 410 });
        if (new Date(invite.expires_at) < new Date()) throw Object.assign(new Error('Invite expired'), { status: 410 });

        if (invite.target_type === 'trip') {
            db.prepare('INSERT OR IGNORE INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(invite.trip_id, userId);
        } else {
            db.prepare('INSERT OR IGNORE INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)').run(
                invite.family_id,
                userId,
                'member'
            );
        }
        db.prepare(`UPDATE email_invites SET status = 'accepted', accepted_by = ?, accepted_at = ? WHERE id = ?`).run(
            userId,
            new Date().toISOString(),
            invite.id
        );

        return invite;
    });

    let invite;
    try {
        invite = accept(token, req.user.id);
    } catch (err) {
        return res.status(err.status || 500).json({ error: err.message || 'Failed to accept invite' });
    }

    res.json({ data: { targetType: invite.target_type, tripId: invite.trip_id, familyId: invite.family_id }, error: null });
});

export default router;
