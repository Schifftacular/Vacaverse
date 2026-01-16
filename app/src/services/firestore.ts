import {
    collection,
    addDoc,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Trip } from '../types';

export const TRIPS_COLLECTION = 'trips';

export const getTrips = async (userId: string): Promise<Trip[]> => {
    try {
        const q = query(
            collection(db, TRIPS_COLLECTION),
            where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const trips = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Trip));

        // Sort client-side to avoid needing a composite index immediately
        return trips.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Error getting trips:', error);
        throw error;
    }
};

export const createTrip = async (userId: string, tripData: Omit<Trip, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, TRIPS_COLLECTION), {
            userId,
            ...tripData,
            createdAt: Date.now() // Use server timestamp or client timestamp
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating trip:', error);
        throw error;
    }
};
