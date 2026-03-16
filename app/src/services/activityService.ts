import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const TRIPS_COLLECTION = 'trips';

export const logActivity = async (
    tripId: string,
    userId: string,
    action: string,
    detail: string
) => {
    try {
        await addDoc(
            collection(db, TRIPS_COLLECTION, tripId, 'activity'),
            { tripId, userId, action, detail, createdAt: serverTimestamp() }
        );
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};

export const subscribeToActivity = (
    tripId: string,
    callback: (entries: any[]) => void,
    maxEntries = 20
) => {
    const q = query(
        collection(db, TRIPS_COLLECTION, tripId, 'activity'),
        orderBy('createdAt', 'desc'),
        limit(maxEntries)
    );
    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(entries);
    });
};

export const subscribeToComments = (
    tripId: string,
    callback: (comments: any[]) => void
) => {
    const q = query(
        collection(db, TRIPS_COLLECTION, tripId, 'comments'),
        orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(comments);
    });
};

export const addComment = async (tripId: string, userId: string, text: string) => {
    await addDoc(
        collection(db, TRIPS_COLLECTION, tripId, 'comments'),
        { userId, text, createdAt: serverTimestamp() }
    );
};
