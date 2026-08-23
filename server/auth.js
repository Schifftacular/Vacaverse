import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from './db/index.js';

const SESSION_COOKIE = 'vv_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createUser({ email, password, display_name }) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
        const err = new Error('An account with this email already exists');
        err.status = 409;
        throw err;
    }
    const id = nanoid();
    const password_hash = bcrypt.hashSync(password, 10);
    db.prepare(
        'INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)'
    ).run(id, email, password_hash, display_name || email.split('@')[0]);
    return getUserById(id);
}

export function verifyPassword(email, password) {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row) return null;
    if (!bcrypt.compareSync(password, row.password_hash)) return null;
    return getUserById(row.id);
}

export function getUserById(id) {
    const row = db
        .prepare('SELECT id, email, display_name, photo_url, created_at, is_admin, is_suspended FROM users WHERE id = ?')
        .get(id);
    if (!row) return row;
    return { ...row, is_admin: !!row.is_admin, is_suspended: !!row.is_suspended };
}

export function updateDisplayName(id, display_name) {
    db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(display_name, id);
    return getUserById(id);
}

export function createSession(userId) {
    const id = nanoid(32);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, expiresAt);
    return { id, expiresAt };
}

export function destroySession(sessionId) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function getSessionUser(sessionId) {
    if (!sessionId) return null;
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    if (!session) return null;
    if (new Date(session.expires_at) < new Date()) {
        destroySession(sessionId);
        return null;
    }
    const user = getUserById(session.user_id);
    // A suspended user's sessions are dead on arrival — this is the actual
    // enforcement point for the admin "suspend" action. Without this check,
    // is_suspended would be exactly the kind of unread flag the family_members
    // .role column already is elsewhere in this app: data with no effect.
    if (user?.is_suspended) {
        destroySession(sessionId);
        return null;
    }
    return user;
}

export function setSessionCookie(res, session) {
    res.cookie(SESSION_COOKIE, session.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(session.expiresAt),
        path: '/',
    });
}

export function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export function requireAuth(req, res, next) {
    const sessionId = req.cookies[SESSION_COOKIE];
    const user = getSessionUser(sessionId);
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    req.user = user;
    next();
}

export function attachUser(req, _res, next) {
    const sessionId = req.cookies[SESSION_COOKIE];
    req.user = getSessionUser(sessionId) || null;
    next();
}

// Deny-by-default: must follow requireAuth on the route so req.user exists.
// Re-checks against req.user (derived server-side from the session on this
// request) rather than any client-supplied value, per standard admin-panel
// authorization practice.
export function requireAdmin(req, res, next) {
    if (!req.user?.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

export { SESSION_COOKIE };
