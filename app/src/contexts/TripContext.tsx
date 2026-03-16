import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { currentFamily } = useFamily();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { setTrips([]); setLoading(false); return; }

        const fetchTrips = async () => {
            let query = supabase.from('trips').select('*');

            if (currentFamily) {
                query = query.eq('family_id', currentFamily.id);
            } else {
                query = query.eq('user_id', user.id);
            }

            const { data } = await query.order('created_at', { ascending: false });
            setTrips(data || []);
            setLoading(false);
        };

        fetchTrips();

        // Realtime subscription
        const channel = supabase
            .channel('trips-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
                fetchTrips();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, currentFamily]);

    return (
        <TripContext.Provider value={{ trips, loading }}>
            {children}
        </TripContext.Provider>
    );
};

export const useTrip = () => {
    const context = useContext(TripContext);
    if (context === undefined) throw new Error('useTrip must be used within a TripProvider');
    return context;
};
