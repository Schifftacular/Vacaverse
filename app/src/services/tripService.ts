import {
    collection, doc, updateDoc, deleteDoc, addDoc,
    getDocs, serverTimestamp, query
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TRIPS_COLLECTION } from './firestore';
import type { Trip } from '../types';

export const createTrip = async (
    userId: string,
    tripData: Omit<Trip, 'id' | 'userId' | 'createdAt' | 'familyId'>
): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, TRIPS_COLLECTION), {
            userId,
            familyId: null,
            ...tripData,
            createdAt: Date.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating trip:', error);
        throw error;
    }
};

export const updateTrip = async (tripId: string, data: Partial<Trip>) => {
    try {
        const tripRef = doc(db, TRIPS_COLLECTION, tripId);
        await updateDoc(tripRef, { ...data, updatedAt: serverTimestamp() });
    } catch (error) {
        console.error('Error updating trip:', error);
        throw error;
    }
};

export const deleteTrip = async (tripId: string) => {
    try {
        await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
    } catch (error) {
        console.error('Error deleting trip:', error);
        throw error;
    }
};

export const addSubCollectionItem = async <T extends Record<string, unknown>>(
    tripId: string, collectionName: string, data: T
): Promise<string> => {
    try {
        const subColRef = collection(db, TRIPS_COLLECTION, tripId, collectionName);
        const docRef = await addDoc(subColRef, { ...data, createdAt: serverTimestamp() });
        return docRef.id;
    } catch (error) {
        console.error(`Error adding to ${collectionName}:`, error);
        throw error;
    }
};

export const updateSubCollectionItem = async <T extends Record<string, unknown>>(
    tripId: string, collectionName: string, itemId: string, data: T
) => {
    try {
        const itemRef = doc(db, TRIPS_COLLECTION, tripId, collectionName, itemId);
        await updateDoc(itemRef, { ...data, updatedAt: serverTimestamp() });
    } catch (error) {
        console.error(`Error updating in ${collectionName}:`, error);
        throw error;
    }
};

export const deleteSubCollectionItem = async (
    tripId: string, collectionName: string, itemId: string
) => {
    try {
        await deleteDoc(doc(db, TRIPS_COLLECTION, tripId, collectionName, itemId));
    } catch (error) {
        console.error(`Error deleting from ${collectionName}:`, error);
        throw error;
    }
};

export const getSubCollection = async <T>(
    tripId: string, collectionName: string
): Promise<(T & { id: string })[]> => {
    try {
        const subColRef = collection(db, TRIPS_COLLECTION, tripId, collectionName);
        const snapshot = await getDocs(query(subColRef));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as (T & { id: string })[];
    } catch (error) {
        console.error(`Error getting ${collectionName}:`, error);
        throw error;
    }
};
