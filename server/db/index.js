import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'vacaverse.sqlite');

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

// Backfill trips created before this app required a family_id (see issue #3).
// Only touches the unambiguous case — a creator who belongs to exactly one
// family — since guessing among several would be wrong as often as right;
// those stay null for the in-app "attach to family" prompt to fix instead.
// Runs on every boot; a no-op once nothing matches, so safe to leave in.
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
