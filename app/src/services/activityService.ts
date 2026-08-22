import { db, getSocket } from '../lib/client';

export const logActivity = async (tripId: string, _userId: string, action: string, detail: string) => {
    getSocket().emit('activity:new', { trip_id: tripId, action, detail });
};

export const subscribeToActivity = (
    tripId: string,
    callback: (entries: any[]) => void,
    maxEntries = 20
) => {
    const socket = getSocket();
    let entries: any[] = [];

    db.from('activity')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
        .limit(maxEntries)
        .then(({ data }: { data: any[] }) => {
            entries = data || [];
            callback(entries);
        });

    socket.emit('trip:join', tripId);

    const onNew = (entry: any) => {
        if (entry.trip_id !== tripId) return;
        entries = [entry, ...entries].slice(0, maxEntries);
        callback(entries);
    };
    socket.on('activity:new', onNew);

    return () => { socket.off('activity:new', onNew); };
};

export const subscribeToComments = (
    tripId: string,
    callback: (comments: any[]) => void
) => {
    const socket = getSocket();
    let comments: any[] = [];

    db.from('comments')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
        .then(({ data }: { data: any[] }) => {
            comments = data || [];
            callback(comments);
        });

    socket.emit('trip:join', tripId);

    const onNew = (comment: any) => {
        if (comment.trip_id !== tripId) return;
        comments = [...comments, comment];
        callback(comments);
    };
    socket.on('comment:new', onNew);

    return () => { socket.off('comment:new', onNew); };
};

export const addComment = async (tripId: string, _userId: string, text: string) => {
    return new Promise<void>((resolve, reject) => {
        getSocket().emit('comment:new', { trip_id: tripId, text }, (ack: { error?: string }) => {
            if (ack?.error) reject(new Error(ack.error));
            else resolve();
        });
    });
};

export interface PresenceUser {
    id: string;
    display_name: string;
    photo_url: string | null;
}

export const subscribeToPresence = (
    tripId: string,
    callback: (users: PresenceUser[]) => void
) => {
    const socket = getSocket();
    socket.emit('trip:join', tripId);

    const onUpdate = (users: PresenceUser[]) => callback(users);
    socket.on('presence:update', onUpdate);

    return () => { socket.off('presence:update', onUpdate); };
};
