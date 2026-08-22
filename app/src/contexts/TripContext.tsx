import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/client';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';

interface Trip {
    id: string;
    user_id: string;
    family_id: string | null;
    title: string;
    start_date: string;
    end_date: string;
    image: string;
    budget: number;
    share_token?: string;
    created_at: string;
}

interface TripContextType {
    trips: Trip[];
    loading: boolean;
    refetch: () => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { currentFamily } = useFamily();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrips = async () => {
        if (!user) { setTrips([]); setLoading(false); return; }

        let query = db.from('trips').select('*');
        query = currentFamily ? query.eq('family_id', currentFamily.id) : query.eq('user_id', user.id);

        const { data } = await query.order('created_at', { ascending: false });
        setTrips(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchTrips();
    }, [user, currentFamily]);

    return (
        <TripContext.Provider value={{ trips, loading, refetch: fetchTrips }}>
            {children}
        </TripContext.Provider>
    );
};

export const useTrip = () => {
    const context = useContext(TripContext);
    if (context === undefined) throw new Error('useTrip must be used within a TripProvider');
    return context;
};
