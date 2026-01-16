import {
    collection,
    doc,
    updateDoc,
    deleteDoc,
    addDoc,
    getDocs,
    serverTimestamp,
    query
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TRIPS_COLLECTION } from './firestore';

// -- Trip Core --

export const updateTrip = async (tripId: string, data: any) => {
    try {
        const tripRef = doc(db, TRIPS_COLLECTION, tripId);
        await updateDoc(tripRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating trip:", error);
        throw error;
    }
};

export const deleteTrip = async (tripId: string) => {
    try {
        // Note: Subcollections inside the trip document are NOT automatically deleted by Firestore.
        // For a production app, you'd use a Cloud Function to recursive delete.
        // For this MVP, we'll accept that orphan subcollections might exist.
        await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
    } catch (error) {
        console.error("Error deleting trip:", error);
        throw error;
    }
};

// -- Sub-Collections (Generic) --
// Used for: 'expenses', 'tasks', 'events'

export const addSubCollectionItem = async (tripId: string, collectionName: string, data: any) => {
    try {
        const subColRef = collection(db, TRIPS_COLLECTION, tripId, collectionName);
        const docRef = await addDoc(subColRef, {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error(`Error adding to ${collectionName}:`, error);
        throw error;
    }
};

export const updateSubCollectionItem = async (tripId: string, collectionName: string, itemId: string, data: any) => {
    try {
        const itemRef = doc(db, TRIPS_COLLECTION, tripId, collectionName, itemId);
        await updateDoc(itemRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error(`Error updating in ${collectionName}:`, error);
        throw error;
    }
};

export const deleteSubCollectionItem = async (tripId: string, collectionName: string, itemId: string) => {
    try {
        const itemRef = doc(db, TRIPS_COLLECTION, tripId, collectionName, itemId);
        await deleteDoc(itemRef);
    } catch (error) {
        console.error(`Error deleting from ${collectionName}:`, error);
        throw error;
    }
};

export const getSubCollection = async (tripId: string, collectionName: string) => {
    try {
        const subColRef = collection(db, TRIPS_COLLECTION, tripId, collectionName);
        // Default sort by createdAt if possible, else just get all
        const q = query(subColRef);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`Error getting ${collectionName}:`, error);
        throw error;
    }
};
