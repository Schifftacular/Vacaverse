import { Router } from 'express';
import {
    createUser,
    verifyPassword,
    createSession,
    destroySession,
    setSessionCookie,
    clearSessionCookie,
    updateDisplayName,
    SESSION_COOKIE,
    attachUser,
    requireAuth,
} from '../auth.js';

const router = Router();
router.use(attachUser);

router.post('/signup', (req, res) => {
    const { email, password, display_name } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const user = createUser({ email, password, display_name });
        const session = createSession(user.id);
        setSessionCookie(res, session);
        res.status(201).json({ data: { user }, error: null });
    } catch (err) {
        res.status(err.status || 400).json({ error: err.message });
    }
});

router.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    const user = verifyPassword(email || '', password || '');
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const session = createSession(user.id);
    setSessionCookie(res, session);
    const { password_hash, ...safeUser } = user;
    res.json({ data: { user: safeUser }, error: null });
});

router.post('/logout', (req, res) => {
    const sessionId = req.cookies[SESSION_COOKIE];
    if (sessionId) destroySession(sessionId);
    clearSessionCookie(res);
    res.json({ data: null, error: null });
});

router.get('/me', (req, res) => {
    res.json({ data: { user: req.user }, error: null });
});

router.patch('/me', requireAuth, (req, res) => {
    const displayName = String(req.body?.display_name || '').trim();
    if (!displayName) {
        return res.status(400).json({ error: 'display_name is required' });
    }
    const user = updateDisplayName(req.user.id, displayName);
    res.json({ data: { user }, error: null });
});

export default router;
