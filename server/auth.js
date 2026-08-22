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
    return row;
}

export function getUserById(id) {
    return db.prepare('SELECT id, email, display_name, photo_url, created_at FROM users WHERE id = ?').get(id);
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
    return getUserById(session.user_id);
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

export { SESSION_COOKIE };
