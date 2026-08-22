import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/index.js';
import { requireAuth } from '../auth.js';

const router = Router();

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

router.get('/lookup/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const invite = db
        .prepare(`
            SELECT invites.id as invite_id, invites.family_id, invites.expires_at, invites.used, families.name as family_name
            FROM invites JOIN families ON families.id = invites.family_id
            WHERE invites.code = ?
        `)
        .get(code);

    if (!invite || invite.used || new Date(invite.expires_at) < new Date()) {
        return res.json({ data: null, error: null });
    }

    res.json({
        data: { familyId: invite.family_id, familyName: invite.family_name, inviteId: invite.invite_id },
        error: null,
    });
});

router.post('/:id/use', requireAuth, (req, res) => {
    db.prepare('UPDATE invites SET used = 1 WHERE id = ?').run(req.params.id);
    res.json({ data: null, error: null });
});

export default router;
