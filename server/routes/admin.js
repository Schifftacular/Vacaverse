import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/index.js';
import { requireAuth, requireAdmin } from '../auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

function logAction(adminId, action, targetType, targetId, detail) {
    db.prepare(
        'INSERT INTO admin_audit_log (id, admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(nanoid(), adminId, action, targetType, targetId ?? null, detail ? JSON.stringify(detail) : null);
}

router.get('/stats', (req, res) => {
    const users = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
    const suspendedUsers = db.prepare('SELECT COUNT(*) AS n FROM users WHERE is_suspended = 1').get().n;
    const trips = db.prepare('SELECT COUNT(*) AS n FROM trips').get().n;
    const families = db.prepare('SELECT COUNT(*) AS n FROM families').get().n;
    const newFeedback = db.prepare("SELECT COUNT(*) AS n FROM feedback WHERE status = 'new'").get().n;
    const storageBytes = db.prepare('SELECT COALESCE(SUM(size), 0) AS n FROM documents').get().n;
    res.json({
        data: { users, suspendedUsers, trips, families, newFeedback, storageBytes },
        error: null,
    });
});

router.get('/users', (req, res) => {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const rows = q
        ? db
              .prepare(
                  `SELECT id, email, display_name, photo_url, created_at, is_admin, is_suspended
                   FROM users WHERE email LIKE ? OR display_name LIKE ?
                   ORDER BY created_at DESC LIMIT ?`
              )
              .all(`%${q}%`, `%${q}%`, limit)
        : db
              .prepare(
                  `SELECT id, email, display_name, photo_url, created_at, is_admin, is_suspended
                   FROM users ORDER BY created_at DESC LIMIT ?`
              )
              .all(limit);
    const data = rows.map(r => ({ ...r, is_admin: !!r.is_admin, is_suspended: !!r.is_suspended }));
    res.json({ data, error: null });
});

router.get('/users/:id', (req, res) => {
    const user = db
        .prepare(
            'SELECT id, email, display_name, photo_url, created_at, is_admin, is_suspended FROM users WHERE id = ?'
        )
        .get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const tripCount = db.prepare('SELECT COUNT(*) AS n FROM trips WHERE user_id = ?').get(user.id).n;
    const familyCount = db.prepare('SELECT COUNT(*) AS n FROM family_members WHERE user_id = ?').get(user.id).n;
    const storageBytes = db
        .prepare('SELECT COALESCE(SUM(size), 0) AS n FROM documents WHERE uploaded_by = ?')
        .get(user.id).n;
    res.json({
        data: { ...user, is_admin: !!user.is_admin, is_suspended: !!user.is_suspended, tripCount, familyCount, storageBytes },
        error: null,
    });
});

router.post('/users/:id/suspend', (req, res) => {
    if (req.params.id === req.user.id) {
        return res.status(400).json({ error: "You can't suspend your own account" });
    }
    const result = db.prepare('UPDATE users SET is_suspended = 1 WHERE id = ?').run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'User not found' });
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.params.id);
    logAction(req.user.id, 'suspend_user', 'user', req.params.id);
    res.json({ data: { ok: true }, error: null });
});

router.post('/users/:id/reinstate', (req, res) => {
    const result = db.prepare('UPDATE users SET is_suspended = 0 WHERE id = ?').run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'User not found' });
    logAction(req.user.id, 'reinstate_user', 'user', req.params.id);
    res.json({ data: { ok: true }, error: null });
});

router.post('/users/:id/logout', (req, res) => {
    const result = db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.params.id);
    logAction(req.user.id, 'force_logout', 'user', req.params.id, { sessionsRevoked: result.changes });
    res.json({ data: { ok: true, sessionsRevoked: result.changes }, error: null });
});

router.post('/users/:id/make-admin', (req, res) => {
    const result = db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'User not found' });
    logAction(req.user.id, 'grant_admin', 'user', req.params.id);
    res.json({ data: { ok: true }, error: null });
});

router.post('/users/:id/revoke-admin', (req, res) => {
    if (req.params.id === req.user.id) {
        return res.status(400).json({ error: "You can't revoke your own admin access" });
    }
    const result = db.prepare('UPDATE users SET is_admin = 0 WHERE id = ?').run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'User not found' });
    logAction(req.user.id, 'revoke_admin', 'user', req.params.id);
    res.json({ data: { ok: true }, error: null });
});

router.get('/trips', (req, res) => {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const base = `
        SELECT trips.id, trips.title, trips.start_date, trips.end_date, trips.created_at,
               trips.user_id AS owner_id, users.email AS owner_email, users.display_name AS owner_name,
               families.name AS family_name,
               (SELECT COUNT(*) FROM trip_members WHERE trip_members.trip_id = trips.id) AS member_count,
               (SELECT COALESCE(SUM(size), 0) FROM documents WHERE documents.trip_id = trips.id) AS storage_bytes
        FROM trips
        LEFT JOIN users ON users.id = trips.user_id
        LEFT JOIN families ON families.id = trips.family_id
    `;
    const rows = q
        ? db.prepare(`${base} WHERE trips.title LIKE ? ORDER BY trips.created_at DESC LIMIT ?`).all(`%${q}%`, limit)
        : db.prepare(`${base} ORDER BY trips.created_at DESC LIMIT ?`).all(limit);
    res.json({ data: rows, error: null });
});

router.get('/feedback', (req, res) => {
    const status = String(req.query.status || '').trim();
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = status
        ? db
              .prepare('SELECT * FROM feedback WHERE status = ? ORDER BY created_at DESC LIMIT ?')
              .all(status, limit)
        : db.prepare('SELECT * FROM feedback ORDER BY created_at DESC LIMIT ?').all(limit);
    res.json({ data: rows, error: null });
});

router.patch('/feedback/:id', (req, res) => {
    const status = String(req.body?.status || '').trim();
    if (!['new', 'triaged', 'resolved'].includes(status)) {
        return res.status(400).json({ error: "status must be one of: new, triaged, resolved" });
    }
    const result = db.prepare('UPDATE feedback SET status = ? WHERE id = ?').run(status, req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'Feedback not found' });
    logAction(req.user.id, 'update_feedback_status', 'feedback', req.params.id, { status });
    res.json({ data: { ok: true }, error: null });
});

router.get('/audit-log', (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = db
        .prepare(
            `SELECT admin_audit_log.*, users.email AS admin_email, users.display_name AS admin_name
             FROM admin_audit_log
             LEFT JOIN users ON users.id = admin_audit_log.admin_id
             ORDER BY admin_audit_log.created_at DESC LIMIT ?`
        )
        .all(limit);
    res.json({ data: rows, error: null });
});

export default router;
