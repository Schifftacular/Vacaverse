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

export default db;
