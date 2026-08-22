import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../auth.js';

const router = Router();

const MAX_TOKENS = 8;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

// Turns free-typed user input into a safe FTS5 MATCH expression: every token
// is quoted (so operators/punctuation in the input can't be interpreted as
// FTS5 query syntax), and the last token gets a trailing * for prefix
// matching so results start appearing as the user is still typing.
function toFtsQuery(q) {
    const tokens = q
        .trim()
        .split(/\s+/)
        .filter(t => /[\p{L}\p{N}]/u.test(t)) // drop tokens with no letters/digits (e.g. bare punctuation)
        .slice(0, MAX_TOKENS);
    if (!tokens.length) return null;
    return tokens
        .map((t, i) => `"${t.replace(/"/g, '""')}"${i === tokens.length - 1 ? '*' : ''}`)
        .join(' ');
}

router.get('/:tripId', requireAuth, (req, res) => {
    const { tripId } = req.params;
    const q = String(req.query.q || '');
    const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);

    const ftsQuery = toFtsQuery(q);
    if (!ftsQuery) return res.json({ data: [], error: null });

    let rows;
    try {
        // snippet() wraps each match with char(1)/char(2) control-char markers
        // (chosen over HTML tags so the frontend never has to dangerouslySet
        // innerHTML on user-authored text — it splits on the markers instead).
        rows = db.prepare(`
            SELECT item_type, item_id,
                snippet(search_index, -1, char(1), char(2), '…', 12) AS snippet,
                bm25(search_index) AS rank
            FROM search_index
            WHERE search_index MATCH ? AND trip_id = ?
            ORDER BY rank
            LIMIT ?
        `).all(ftsQuery, tripId, limit);
    } catch (err) {
        // Malformed FTS5 query syntax (shouldn't happen given toFtsQuery's
        // quoting, but fail soft rather than 500 if something slips through).
        console.error('Search query failed:', err);
        return res.json({ data: [], error: null });
    }

    const idsOf = (type) => rows.filter(r => r.item_type === type).map(r => r.item_id);

    const byId = (table, ids) => {
        const map = new Map();
        if (!ids.length) return map;
        const placeholders = ids.map(() => '?').join(',');
        for (const row of db.prepare(`SELECT * FROM "${table}" WHERE id IN (${placeholders})`).all(...ids)) {
            map.set(row.id, row);
        }
        return map;
    };

    const commentsById = byId('comments', idsOf('comment'));
    const tasksById = byId('tasks', idsOf('task'));
    const notesById = byId('notes', idsOf('note'));

    const toResult = (r) => {
        if (r.item_type === 'comment') {
            const c = commentsById.get(r.item_id);
            if (!c) return null;
            return {
                type: 'comment',
                id: c.id,
                trip_id: c.trip_id,
                text: c.text,
                user_id: c.user_id,
                created_at: c.created_at,
                parent_comment_id: c.parent_comment_id,
                snippet: r.snippet,
            };
        }
        if (r.item_type === 'task') {
            const t = tasksById.get(r.item_id);
            if (!t) return null;
            return {
                type: 'task',
                id: t.id,
                trip_id: t.trip_id,
                title: t.title,
                status: t.status,
                assigned_to: t.assigned_to,
                created_at: t.created_at,
                snippet: r.snippet,
            };
        }
        if (r.item_type === 'note') {
            const n = notesById.get(r.item_id);
            if (!n) return null;
            return {
                type: 'note',
                id: n.id,
                trip_id: n.trip_id,
                title: n.title,
                created_by: n.created_by,
                updated_at: n.updated_at,
                snippet: r.snippet,
            };
        }
        return null;
    };

    res.json({ data: rows.map(toResult).filter(Boolean), error: null });
});

export default router;
