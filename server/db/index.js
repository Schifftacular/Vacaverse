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
