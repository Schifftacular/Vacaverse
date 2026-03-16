import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Family {
    id: string;
    name: string;
    created_by: string;
    created_at: string;
    members: string[];
}

interface FamilyContextType {
    families: Family[];
    currentFamily: Family | null;
    setCurrentFamily: (family: Family | null) => void;
    createFamily: (name: string) => Promise<void>;
    joinFamily: (familyId: string) => Promise<void>;
    loading: boolean;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [families, setFamilies] = useState<Family[]>([]);
    const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchFamilies = async () => {
        if (!user) { setFamilies([]); setLoading(false); return; }

        const { data: memberships } = await supabase
            .from('family_members')
            .select('family_id')
            .eq('user_id', user.id);

        if (!memberships?.length) { setFamilies([]); setLoading(false); return; }

        const familyIds = memberships.map(m => m.family_id);
        const { data: familyRows } = await supabase
            .from('families')
            .select('*')
            .in('id', familyIds);

        // Get members for each family
        const { data: allMembers } = await supabase
            .from('family_members')
            .select('family_id, user_id')
            .in('family_id', familyIds);

        const familiesWithMembers: Family[] = (familyRows || []).map(f => ({
            ...f,
            members: (allMembers || []).filter(m => m.family_id === f.id).map(m => m.user_id),
        }));

        setFamilies(familiesWithMembers);
        setLoading(false);
    };

    useEffect(() => { fetchFamilies(); }, [user]);

    const createFamily = async (name: string) => {
        if (!user) return;
        const { data, error } = await supabase
            .from('families')
            .insert({ name, created_by: user.id })
            .select()
            .single();
        if (error) throw error;

        await supabase.from('family_members').insert({
            family_id: data.id,
            user_id: user.id,
            role: 'admin',
        });

        await fetchFamilies();
    };

    const joinFamily = async (familyId: string) => {
        if (!user) return;
        const { error } = await supabase.from('family_members').insert({
            family_id: familyId,
            user_id: user.id,
            role: 'member',
        });
        if (error) throw error;
        await fetchFamilies();
    };

    return (
        <FamilyContext.Provider value={{ families, currentFamily, setCurrentFamily, createFamily, joinFamily, loading }}>
            {children}
        </FamilyContext.Provider>
    );
};

export const useFamily = () => {
    const context = useContext(FamilyContext);
    if (context === undefined) throw new Error('useFamily must be used within a FamilyProvider');
    return context;
};
