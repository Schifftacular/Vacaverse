// Allowlist of tables the generic /api/db/:table layer may touch, plus which
// columns hold JSON payloads that need (de)serializing, and each table's
// conflict target for upsert (composite-key tables have no single `id`).
export const TABLES = {
    families: { pk: 'id', json: [] },
    family_members: { pk: null, conflict: ['family_id', 'user_id'], json: [] },
    invites: { pk: 'id', json: [] },
    trips: { pk: 'id', json: [] },
    trip_members: { pk: null, conflict: ['trip_id', 'user_id'], json: [] },
    trip_events: { pk: 'id', json: [] },
    event_rsvps: { pk: null, conflict: ['event_id', 'user_id'], json: [] },
    expenses: { pk: 'id', json: [] },
    tasks: { pk: 'id', json: [] },
    activity: { pk: 'id', json: [] },
    comments: { pk: 'id', json: [] },
    polls: { pk: 'id', json: ['options'] },
    poll_votes: { pk: null, conflict: ['poll_id', 'user_id'], json: [] },
    documents: { pk: 'id', json: [] },
    feedback: { pk: 'id', json: [] },
};

export function isAllowedTable(name) {
    return Object.prototype.hasOwnProperty.call(TABLES, name);
}
