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
    const { families, loading: familiesLoading } = useFamily();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrips = async () => {
        if (!user) { setTrips([]); setLoading(false); return; }
        // Wait for FamilyContext's own fetch to finish before querying — otherwise
        // this runs once with families still [] (own trips only), briefly showing
        // "Trip not found" for a joined member before the families-triggered
        // refetch below corrects it.
        if (familiesLoading) return;

        // Trips a member sees are the union of trips they created directly and
        // trips that belong to any family they're a member of. currentFamily is
        // a UI selection toggle (Family.tsx) that stays null until a user
        // explicitly picks it, so it can't gate this query — on a fresh page
        // load / hard refresh that null was silently excluding trips a joined
        // (non-owning) family member should still see. families, in contrast,
        // is populated from the user's actual memberships as soon as they load.
        const familyIds = families.map(f => f.id);
        const { data: ownTrips } = await db.from('trips').select('*').eq('user_id', user.id);
        const familyTrips = familyIds.length
            ? (await db.from('trips').select('*').in('family_id', familyIds)).data
            : [];

        const byId = new Map<string, Trip>();
        for (const t of [...(ownTrips || []), ...(familyTrips || [])]) byId.set(t.id, t);
        const merged = Array.from(byId.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));

        setTrips(merged);
        setLoading(false);
    };

    useEffect(() => {
        fetchTrips();
    }, [user, families, familiesLoading]);

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
