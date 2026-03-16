import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';
import type { Trip } from '../types';

interface TripContextType {
    trips: Trip[];
    loading: boolean;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { currentFamily } = useFamily();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setTrips([]);
            setLoading(false);
            return;
        }

        let q;
        if (currentFamily) {
            q = query(collection(db, 'trips'), where('familyId', '==', currentFamily.id));
        } else {
            q = query(collection(db, 'trips'), where('userId', '==', user.uid));
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

    return (
        <TripContext.Provider value={{ trips, loading }}>
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
