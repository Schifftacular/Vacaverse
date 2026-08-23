-- VacaVerse self-hosted schema (SQLite)

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    photo_url TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS family_members (
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    -- Family tree relationships (see issue #11) — both optional, both point
    -- at another user_id within the same family. parent_id gives the tree
    -- its generations; partner_id pairs two members at the same generation.
    parent_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    partner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (family_id, user_id)
);

CREATE TABLE IF NOT EXISTS invites (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL REFERENCES users(id),
    used INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    family_id TEXT REFERENCES families(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    image TEXT,
    budget REAL NOT NULL DEFAULT 0,
    share_token TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS trip_members (
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (trip_id, user_id)
);

CREATE TABLE IF NOT EXISTS trip_events (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    location TEXT,
    description TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS event_rsvps (
    event_id TEXT NOT NULL REFERENCES trip_events(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'maybe',
    PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    date TEXT,
    paid_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo',
    assigned_to TEXT REFERENCES users(id),
    created_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS activity (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    edited_at TEXT
);

CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON array
    created_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS poll_votes (
    poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    PRIMARY KEY (poll_id, user_id)
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    type TEXT,
    storage_path TEXT,
    storage_url TEXT,
    content_json TEXT, -- structured block-doc content (Notion-style), nullable for plain file uploads
    uploaded_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_json TEXT, -- TipTap JSON document
    created_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    email TEXT,
    type TEXT NOT NULL DEFAULT 'general',
    text TEXT NOT NULL,
    url TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Full-text search over comments, tasks, and notes (trip Search tab).
-- Standalone FTS5 table (not "external content") because our source PKs are
-- TEXT, not rowids, so it duplicates the searchable text and is kept in sync
-- by the triggers below. Notes' content_json is a TipTap JSON doc, not plain
-- text, so it's flattened with json_tree() to pull out just the text-node
-- leaves (see the extraction expression reused across the notes triggers).
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
    trip_id UNINDEXED,
    item_type UNINDEXED,
    item_id UNINDEXED,
    title,
    body,
    tokenize = 'porter unicode61'
);

-- One-time backfill for rows that predate the index (safe to re-run: only
-- inserts ids not already present, so it's a no-op on every later startup).
INSERT INTO search_index (trip_id, item_type, item_id, title, body)
SELECT trip_id, 'comment', id, '', text FROM comments
WHERE id NOT IN (SELECT item_id FROM search_index WHERE item_type = 'comment');

INSERT INTO search_index (trip_id, item_type, item_id, title, body)
SELECT trip_id, 'task', id, title, '' FROM tasks
WHERE id NOT IN (SELECT item_id FROM search_index WHERE item_type = 'task');

INSERT INTO search_index (trip_id, item_type, item_id, title, body)
SELECT trip_id, 'note', id, title,
    CASE WHEN content_json IS NOT NULL AND json_valid(content_json)
        THEN COALESCE((SELECT group_concat(value, ' ') FROM json_tree(notes.content_json) WHERE key = 'text' AND type = 'text'), '')
        ELSE ''
    END
FROM notes
WHERE id NOT IN (SELECT item_id FROM search_index WHERE item_type = 'note');

CREATE TRIGGER IF NOT EXISTS trg_search_comments_ai AFTER INSERT ON comments BEGIN
    INSERT INTO search_index (trip_id, item_type, item_id, title, body)
    VALUES (NEW.trip_id, 'comment', NEW.id, '', NEW.text);
END;

CREATE TRIGGER IF NOT EXISTS trg_search_comments_au AFTER UPDATE OF text ON comments BEGIN
    DELETE FROM search_index WHERE item_type = 'comment' AND item_id = OLD.id;
    INSERT INTO search_index (trip_id, item_type, item_id, title, body)
    VALUES (NEW.trip_id, 'comment', NEW.id, '', NEW.text);
END;

CREATE TRIGGER IF NOT EXISTS trg_search_comments_ad AFTER DELETE ON comments BEGIN
    DELETE FROM search_index WHERE item_type = 'comment' AND item_id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_search_tasks_ai AFTER INSERT ON tasks BEGIN
    INSERT INTO search_index (trip_id, item_type, item_id, title, body)
    VALUES (NEW.trip_id, 'task', NEW.id, NEW.title, '');
END;

CREATE TRIGGER IF NOT EXISTS trg_search_tasks_au AFTER UPDATE OF title ON tasks BEGIN
    DELETE FROM search_index WHERE item_type = 'task' AND item_id = OLD.id;
    INSERT INTO search_index (trip_id, item_type, item_id, title, body)
    VALUES (NEW.trip_id, 'task', NEW.id, NEW.title, '');
END;

CREATE TRIGGER IF NOT EXISTS trg_search_tasks_ad AFTER DELETE ON tasks BEGIN
    DELETE FROM search_index WHERE item_type = 'task' AND item_id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_search_notes_ai AFTER INSERT ON notes BEGIN
    INSERT INTO search_index (trip_id, item_type, item_id, title, body)
    VALUES (NEW.trip_id, 'note', NEW.id, NEW.title,
        CASE WHEN NEW.content_json IS NOT NULL AND json_valid(NEW.content_json)
            THEN COALESCE((SELECT group_concat(value, ' ') FROM json_tree(NEW.content_json) WHERE key = 'text' AND type = 'text'), '')
            ELSE ''
        END);
END;

CREATE TRIGGER IF NOT EXISTS trg_search_notes_au AFTER UPDATE OF title, content_json ON notes BEGIN
    DELETE FROM search_index WHERE item_type = 'note' AND item_id = OLD.id;
    INSERT INTO search_index (trip_id, item_type, item_id, title, body)
    VALUES (NEW.trip_id, 'note', NEW.id, NEW.title,
        CASE WHEN NEW.content_json IS NOT NULL AND json_valid(NEW.content_json)
            THEN COALESCE((SELECT group_concat(value, ' ') FROM json_tree(NEW.content_json) WHERE key = 'text' AND type = 'text'), '')
            ELSE ''
        END);
END;

CREATE TRIGGER IF NOT EXISTS trg_search_notes_ad AFTER DELETE ON notes BEGIN
    DELETE FROM search_index WHERE item_type = 'note' AND item_id = OLD.id;
END;

CREATE INDEX IF NOT EXISTS idx_trips_family ON trips(family_id);
CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_trip ON comments(trip_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_activity_trip ON activity(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_events_trip ON trip_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_tasks_trip ON tasks(trip_id);
CREATE INDEX IF NOT EXISTS idx_polls_trip ON polls(trip_id);
CREATE INDEX IF NOT EXISTS idx_documents_trip ON documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_notes_trip ON notes(trip_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
