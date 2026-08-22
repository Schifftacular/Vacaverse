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

    const onUpdated = (comment: any) => {
        if (comment.trip_id !== tripId) return;
        comments = comments.map(c => (c.id === comment.id ? comment : c));
        callback(comments);
    };
    socket.on('comment:updated', onUpdated);

    const onDeleted = (payload: { id: string; trip_id: string }) => {
        if (payload.trip_id !== tripId) return;
        comments = comments.filter(c => c.id !== payload.id);
        callback(comments);
    };
    socket.on('comment:deleted', onDeleted);

    return () => {
        socket.off('comment:new', onNew);
        socket.off('comment:updated', onUpdated);
        socket.off('comment:deleted', onDeleted);
    };
};

export const addComment = async (tripId: string, _userId: string, text: string, parentCommentId?: string | null) => {
    return new Promise<any>((resolve, reject) => {
        getSocket().emit(
            'comment:new',
            { trip_id: tripId, text, parent_comment_id: parentCommentId ?? null },
            (ack: { data?: any; error?: string }) => {
                if (ack?.error) reject(new Error(ack.error));
                else resolve(ack.data);
            }
        );
    });
};

export const editComment = async (tripId: string, commentId: string, text: string) => {
    return new Promise<any>((resolve, reject) => {
        getSocket().emit('comment:edit', { trip_id: tripId, id: commentId, text }, (ack: { data?: any; error?: string }) => {
            if (ack?.error) reject(new Error(ack.error));
            else resolve(ack.data);
        });
    });
};

export const deleteComment = async (tripId: string, commentId: string) => {
    return new Promise<void>((resolve, reject) => {
        getSocket().emit('comment:delete', { trip_id: tripId, id: commentId }, (ack: { error?: string }) => {
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

    return () => {
        socket.off('presence:update', onUpdate);
        // Without this, leaving the trip page (while the app's socket stays
        // connected) would leave the user showing as "online now" here forever.
        socket.emit('trip:leave', tripId);
    };
};

export interface TypingUser {
    id: string;
    display_name: string;
    photo_url: string | null;
}

export const emitTypingStart = (tripId: string) => {
    getSocket().emit('typing:start', tripId);
};

export const emitTypingStop = (tripId: string) => {
    getSocket().emit('typing:stop', tripId);
};

// tripId isn't used to filter here: the server only broadcasts typing:update
// to sockets already joined to that trip's room (via trip:join), so every
// event this listener receives already belongs to the current trip.
export const subscribeToTyping = (
    _tripId: string,
    callback: (users: TypingUser[]) => void
) => {
    const socket = getSocket();
    let typing: TypingUser[] = [];

    const onUpdate = (payload: { user: TypingUser; typing: boolean }) => {
        typing = payload.typing
            ? [...typing.filter(u => u.id !== payload.user.id), payload.user]
            : typing.filter(u => u.id !== payload.user.id);
        callback(typing);
    };
    socket.on('typing:update', onUpdate);

    return () => { socket.off('typing:update', onUpdate); };
};
