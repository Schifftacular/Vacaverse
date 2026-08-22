import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
    const ids = String(req.query.ids || '').split(',').filter(Boolean);
    if (!ids.length) return res.json({ data: [], error: null });
    const placeholders = ids.map(() => '?').join(',');
    const rows = db
        .prepare(`SELECT id, email, display_name, photo_url FROM users WHERE id IN (${placeholders})`)
        .all(...ids);
    res.json({ data: rows, error: null });
});

export default router;
