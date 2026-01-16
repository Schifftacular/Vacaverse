import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';
import type { Trip } from '../types';

interface TripContextType {
    trips: Trip[];
    currentTrip: Trip | null;
    setCurrentTrip: (trip: Trip | null) => void;
    createTrip: (tripData: Omit<Trip, 'id' | 'userId' | 'createdAt' | 'familyId'>) => Promise<void>;
    loading: boolean;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { currentFamily } = useFamily();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setTrips([]);
            setLoading(false);
            return;
        }

        // Logic: specific to hierarchy.
        // If a Family is selected, fetch trips for that family.
        // If NO Family is selected, fetch trips where user is creator OR user is in the family?
        // For simplicity: If Family selected -> fetch family trips.
        // If NO Family selected -> fetch ALL trips this user has access to (personal + family).

        let q;

        if (currentFamily) {
            q = query(
                collection(db, 'trips'),
                where('familyId', '==', currentFamily.id)
            );
        } else {
            // Fallback: Fetch trips created by user (MVP) or query all families user is in (Complex)
            // For Phase 1: Let's fetch trips created by user for now to maintain backward compatibility
            q = query(
                collection(db, 'trips'),
                where('userId', '==', user.uid)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tripData: Trip[] = [];
            snapshot.forEach((doc) => {
                tripData.push({ id: doc.id, ...doc.data() } as Trip);
            });
            setTrips(tripData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, currentFamily]);

    const createTrip = async (tripData: Omit<Trip, 'id' | 'userId' | 'createdAt' | 'familyId'>) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'trips'), {
                ...tripData,
                userId: user.uid,
                familyId: currentFamily?.id || null, // Optional for now
                createdAt: Date.now()
            });
        } catch (error) {
            console.error("Error creating trip:", error);
            throw error;
        }
    };

    return (
        <TripContext.Provider value={{
            trips,
            currentTrip,
            setCurrentTrip,
            createTrip,
            loading
        }}>
            {children}
        </TripContext.Provider>
    );
};

export const useTrip = () => {
    const context = useContext(TripContext);
    if (context === undefined) {
        throw new Error('useTrip must be used within a TripProvider');
    }
    return context;
};
