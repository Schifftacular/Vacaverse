import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/index.js';
import { TABLES, isAllowedTable } from '../tables.js';
import { attachUser, requireAuth } from '../auth.js';

const router = Router();

const columnCache = new Map();
function columnsOf(table) {
    if (!columnCache.has(table)) {
        const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
        columnCache.set(table, cols);
    }
    return columnCache.get(table);
}

function assertColumn(table, col) {
    if (!columnsOf(table).includes(col)) {
        const err = new Error(`Unknown column "${col}" on "${table}"`);
        err.status = 400;
        throw err;
    }
}

function deserializeRow(table, row) {
    if (!row) return row;
    const { json } = TABLES[table];
    if (!json.length) return row;
    const out = { ...row };
    for (const col of json) {
        if (typeof out[col] === 'string') {
            try { out[col] = JSON.parse(out[col]); } catch { /* leave as-is */ }
        }
    }
    return out;
}

function serializeBody(table, body) {
    const { json } = TABLES[table];
    if (!json.length) return body;
    const out = { ...body };
    for (const col of json) {
        if (col in out && typeof out[col] !== 'string') {
            out[col] = JSON.stringify(out[col]);
        }
    }
    return out;
}

// Parses eq.<field>=<value> and in.<field>=v1,v2 style query params into a WHERE clause.
function buildWhere(table, query) {
    const clauses = [];
    const params = [];
    for (const [key, value] of Object.entries(query)) {
        if (key.startsWith('eq.')) {
            const col = key.slice(3);
            assertColumn(table, col);
            clauses.push(`"${col}" = ?`);
            params.push(value);
        } else if (key.startsWith('in.')) {
            const col = key.slice(3);
            assertColumn(table, col);
            const values = String(value).split(',').filter(Boolean);
            if (values.length === 0) {
                clauses.push('0');
            } else {
                clauses.push(`"${col}" IN (${values.map(() => '?').join(',')})`);
                params.push(...values);
            }
        }
    }
    return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

function buildOrder(table, query) {
    const orders = [].concat(query.order || []);
    if (!orders.length) return '';
    const parts = orders.map(spec => {
        const [col, dir] = String(spec).split('.');
        assertColumn(table, col);
        const direction = dir === 'desc' ? 'DESC' : 'ASC';
        return `"${col}" ${direction}`;
    });
    return `ORDER BY ${parts.join(', ')}`;
}

router.use(attachUser);

router.param('table', (req, res, next, table) => {
    if (!isAllowedTable(table)) {
        return res.status(404).json({ error: `Unknown table "${table}"` });
    }
    next();
});

router.get('/:table', (req, res) => {
    const { table } = req.params;
    const { where, params } = buildWhere(table, req.query);
    const order = buildOrder(table, req.query);
    const limit = req.query.limit ? `LIMIT ${Math.min(parseInt(req.query.limit, 10) || 50, 500)}` : '';
    const sql = `SELECT * FROM "${table}" ${where} ${order} ${limit}`.trim();
    const rows = db.prepare(sql).all(...params).map(r => deserializeRow(table, r));
    res.json({ data: rows, error: null });
});

router.post('/:table', requireAuth, (req, res) => {
    const { table } = req.params;
    const { conflict, pk } = TABLES[table];
    const body = serializeBody(table, req.body || {});
    if (pk && !body[pk]) body[pk] = nanoid();

    const cols = Object.keys(body).filter(c => columnsOf(table).includes(c));
    if (!cols.length) return res.status(400).json({ error: 'No valid columns in body' });

    const isUpsert = req.query.upsert === 'true' && conflict;
    const placeholders = cols.map(() => '?').join(',');
    let sql = `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(',')}) VALUES (${placeholders})`;
    if (isUpsert) {
        const updateSet = cols
            .filter(c => !conflict.includes(c))
            .map(c => `"${c}" = excluded."${c}"`)
            .join(', ');
        sql += ` ON CONFLICT (${conflict.map(c => `"${c}"`).join(',')}) DO UPDATE SET ${updateSet || `"${conflict[0]}" = "${conflict[0]}"`}`;
    }

    try {
        db.prepare(sql).run(...cols.map(c => body[c]));
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }

    let row;
    if (pk) {
        row = deserializeRow(table, db.prepare(`SELECT * FROM "${table}" WHERE "${pk}" = ?`).get(body[pk]));
    } else {
        const { where, params } = buildWhere(table, Object.fromEntries(conflict.map(c => [`eq.${c}`, body[c]])));
        row = deserializeRow(table, db.prepare(`SELECT * FROM "${table}" ${where}`).get(...params));
    }
    res.status(201).json({ data: row, error: null });
});

router.patch('/:table/:id', requireAuth, (req, res) => {
    const { table, id } = req.params;
    const { pk } = TABLES[table];
    if (!pk) return res.status(400).json({ error: `"${table}" has no single-id update route; use ?eq. filters via PATCH /:table` });
    const body = serializeBody(table, req.body || {});
    const cols = Object.keys(body).filter(c => columnsOf(table).includes(c) && c !== pk);
    if (!cols.length) return res.status(400).json({ error: 'No valid columns in body' });
    const setClause = cols.map(c => `"${c}" = ?`).join(', ');
    db.prepare(`UPDATE "${table}" SET ${setClause} WHERE "${pk}" = ?`).run(...cols.map(c => body[c]), id);
    const row = deserializeRow(table, db.prepare(`SELECT * FROM "${table}" WHERE "${pk}" = ?`).get(id));
    res.json({ data: row, error: null });
});

// Composite-key update, e.g. PATCH /api/db/poll_votes?eq.poll_id=x&eq.user_id=y
router.patch('/:table', requireAuth, (req, res) => {
    const { table } = req.params;
    const body = serializeBody(table, req.body || {});
    const cols = Object.keys(body).filter(c => columnsOf(table).includes(c));
    if (!cols.length) return res.status(400).json({ error: 'No valid columns in body' });
    const { where, params } = buildWhere(table, req.query);
    if (!where) return res.status(400).json({ error: 'PATCH requires at least one eq. filter' });
    const setClause = cols.map(c => `"${c}" = ?`).join(', ');
    db.prepare(`UPDATE "${table}" SET ${setClause} ${where}`).run(...cols.map(c => body[c]), ...params);
    res.json({ data: null, error: null });
});

router.delete('/:table/:id', requireAuth, (req, res) => {
    const { table, id } = req.params;
    const { pk } = TABLES[table];
    if (!pk) return res.status(400).json({ error: `"${table}" has no single-id delete route; use ?eq. filters via DELETE /:table` });
    db.prepare(`DELETE FROM "${table}" WHERE "${pk}" = ?`).run(id);
    res.json({ data: null, error: null });
});

router.delete('/:table', requireAuth, (req, res) => {
    const { table } = req.params;
    const { where, params } = buildWhere(table, req.query);
    if (!where) return res.status(400).json({ error: 'DELETE requires at least one eq. filter' });
    db.prepare(`DELETE FROM "${table}" ${where}`).run(...params);
    res.json({ data: null, error: null });
});

export default router;
