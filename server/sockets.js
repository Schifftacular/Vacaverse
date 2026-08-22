import { nanoid } from 'nanoid';
import db from './db/index.js';
import { getSessionUser, SESSION_COOKIE } from './auth.js';

function parseCookie(header, name) {
    if (!header) return null;
    const match = header.split(';').map(s => s.trim()).find(s => s.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

// trip room -> Map<socketId, {id, display_name, photo_url}>
const presenceByTrip = new Map();

function presenceList(tripId) {
    const room = presenceByTrip.get(tripId);
    if (!room) return [];
    const seen = new Map();
    for (const user of room.values()) seen.set(user.id, user);
    return Array.from(seen.values());
}

export function attachSockets(io) {
    io.use((socket, next) => {
        const sessionId = parseCookie(socket.handshake.headers.cookie, SESSION_COOKIE);
        const user = getSessionUser(sessionId);
        if (!user) return next(new Error('Not authenticated'));
        socket.user = user;
        next();
    });

    io.on('connection', socket => {
        const joinedTrips = new Set();

        socket.on('trip:join', tripId => {
            if (!tripId) return;
            joinedTrips.add(tripId);
            const room = `trip:${tripId}`;
            socket.join(room);

            if (!presenceByTrip.has(tripId)) presenceByTrip.set(tripId, new Map());
            presenceByTrip.get(tripId).set(socket.id, socket.user);

            io.to(room).emit('presence:update', presenceList(tripId));
        });

        socket.on('trip:leave', tripId => {
            if (!tripId) return;
            const room = `trip:${tripId}`;
            socket.leave(room);
            presenceByTrip.get(tripId)?.delete(socket.id);
            io.to(room).emit('presence:update', presenceList(tripId));
        });

        socket.on('typing:start', tripId => {
            if (!tripId) return;
            socket.to(`trip:${tripId}`).emit('typing:update', { user: socket.user, typing: true });
        });

        socket.on('typing:stop', tripId => {
            if (!tripId) return;
            socket.to(`trip:${tripId}`).emit('typing:update', { user: socket.user, typing: false });
        });

        socket.on('comment:new', (payload, ack) => {
            const { trip_id, text, parent_comment_id } = payload || {};
            if (!trip_id || !text || !text.trim()) return ack?.({ error: 'text is required' });
            const id = nanoid();
            db.prepare(
                'INSERT INTO comments (id, trip_id, user_id, text, parent_comment_id) VALUES (?, ?, ?, ?, ?)'
            ).run(id, trip_id, socket.user.id, text.trim(), parent_comment_id || null);
            const row = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
            io.to(`trip:${trip_id}`).emit('comment:new', row);
            ack?.({ data: row });
        });

        socket.on('activity:new', payload => {
            const { trip_id, action, detail } = payload || {};
            if (!trip_id || !action) return;
            const id = nanoid();
            db.prepare(
                'INSERT INTO activity (id, trip_id, user_id, action, detail) VALUES (?, ?, ?, ?, ?)'
            ).run(id, trip_id, socket.user.id, action, detail || null);
            const row = db.prepare('SELECT * FROM activity WHERE id = ?').get(id);
            io.to(`trip:${trip_id}`).emit('activity:new', row);
        });

        socket.on('disconnect', () => {
            for (const tripId of joinedTrips) {
                presenceByTrip.get(tripId)?.delete(socket.id);
                io.to(`trip:${tripId}`).emit('presence:update', presenceList(tripId));
            }
        });
    });
}
