import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DB_DIR lets deploys point the sqlite file at a volume mount separate from
// this code directory — see docker-compose.yml. Defaults to this file's own
// directory so local dev (no Docker, no DB_DIR set) is unaffected.
const dataDir = process.env.DB_DIR || __dirname;
const dbPath = path.join(dataDir, 'vacaverse.sqlite');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Lightweight migration: CREATE TABLE IF NOT EXISTS above won't add columns to
// a table that already exists, so patch older databases here.
const commentColumns = db.prepare('PRAGMA table_info(comments)').all().map(c => c.name);
if (!commentColumns.includes('edited_at')) {
    db.exec('ALTER TABLE comments ADD COLUMN edited_at TEXT');
}

const familyMemberColumns = db.prepare('PRAGMA table_info(family_members)').all().map(c => c.name);
if (!familyMemberColumns.includes('parent_id')) {
    db.exec('ALTER TABLE family_members ADD COLUMN parent_id TEXT REFERENCES users(id) ON DELETE SET NULL');
}
if (!familyMemberColumns.includes('partner_id')) {
    db.exec('ALTER TABLE family_members ADD COLUMN partner_id TEXT REFERENCES users(id) ON DELETE SET NULL');
}

// Admin panel: site-wide role/status flags on users, and a triage status on
// feedback. Both default to the pre-admin-panel behavior (regular user,
// active, untriaged) so existing rows need no backfill beyond the ALTER.
const userColumns = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
if (!userColumns.includes('is_admin')) {
    db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0');
}
if (!userColumns.includes('is_suspended')) {
    db.exec('ALTER TABLE users ADD COLUMN is_suspended INTEGER NOT NULL DEFAULT 0');
}

const feedbackColumns = db.prepare('PRAGMA table_info(feedback)').all().map(c => c.name);
if (!feedbackColumns.includes('status')) {
    db.exec("ALTER TABLE feedback ADD COLUMN status TEXT NOT NULL DEFAULT 'new'");
}

// Bootstrap the first admin(s) from an env var, since there's no UI path to
// grant admin before an admin account exists. Runs on every boot — cheap,
// and idempotent (only flips the flag on, never off), so it's safe to leave
// ADMIN_EMAILS set permanently rather than treating it as a one-shot script.
const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
if (adminEmails.length) {
    const placeholders = adminEmails.map(() => '?').join(',');
    db.prepare(`UPDATE users SET is_admin = 1 WHERE lower(email) IN (${placeholders})`).run(...adminEmails);
}

// Backfill trips created before this app required a family_id (see issue #3).
// Only touches the unambiguous case — a creator who belongs to exactly one
// family — since guessing among several would be wrong as often as right;
// those stay null for the in-app "attach to family" prompt to fix instead.
// Runs on every boot; cheap even so (a handful of rows at most in this
// app's scale) — but a trip stuck in the ambiguous case is re-scanned and
// re-checked forever, it never truly converges to a no-op.
const orphanedTrips = db.prepare('SELECT id, user_id FROM trips WHERE family_id IS NULL').all();
if (orphanedTrips.length) {
    const familiesOf = db.prepare('SELECT family_id FROM family_members WHERE user_id = ?');
    const attachFamily = db.prepare('UPDATE trips SET family_id = ? WHERE id = ?');
    for (const trip of orphanedTrips) {
        const memberships = familiesOf.all(trip.user_id);
        if (memberships.length === 1) {
            attachFamily.run(memberships[0].family_id, trip.id);
        }
    }
}

export default db;
