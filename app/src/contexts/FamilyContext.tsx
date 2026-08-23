import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/client';
import { useAuth } from './AuthContext';
import type { MemberRelation } from '../lib/familyTree';

interface Family {
    id: string;
    name: string;
    created_by: string;
    created_at: string;
    members: string[];
    // parent_id/partner_id per member, for the family tree view (see #11).
    memberRelations: MemberRelation[];
}

interface FamilyContextType {
    families: Family[];
    currentFamily: Family | null;
    setCurrentFamily: (family: Family | null) => void;
    createFamily: (name: string) => Promise<void>;
    joinFamily: (familyId: string) => Promise<void>;
    loading: boolean;
    refetch: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [families, setFamilies] = useState<Family[]>([]);
    const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchFamilies = async () => {
        if (!user) { setFamilies([]); setLoading(false); return; }

        const { data: memberships } = await db
            .from('family_members')
            .select('family_id')
            .eq('user_id', user.id);

        if (!memberships?.length) { setFamilies([]); setLoading(false); return; }

        const familyIds = memberships.map((m: { family_id: string }) => m.family_id);
        const { data: familyRows } = await db
            .from('families')
            .select('*')
            .in('id', familyIds);

        // Get members (plus tree relations) for each family
        const { data: allMembers } = await db
            .from('family_members')
            .select('family_id, user_id, parent_id, partner_id')
            .in('family_id', familyIds);

        type MemberRow = { family_id: string; user_id: string; parent_id: string | null; partner_id: string | null };
        const familiesWithMembers: Family[] = (familyRows || []).map((f: Omit<Family, 'members' | 'memberRelations'>) => {
            const rows = (allMembers || []).filter((m: MemberRow) => m.family_id === f.id);
            return {
                ...f,
                members: rows.map((m: MemberRow) => m.user_id),
                memberRelations: rows.map((m: MemberRow) => ({
                    user_id: m.user_id,
                    parent_id: m.parent_id,
                    partner_id: m.partner_id,
                })),
            };
        });

        setFamilies(familiesWithMembers);
        setLoading(false);
    };

    useEffect(() => { fetchFamilies(); }, [user]);

    const createFamily = async (name: string) => {
        if (!user) return;
        const { data, error } = await db
            .from('families')
            .insert({ name, created_by: user.id })
            .select()
            .single();
        if (error) throw error;

        await db.from('family_members').insert({
            family_id: data.id,
            user_id: user.id,
            role: 'admin',
        });

        await fetchFamilies();
    };

    const joinFamily = async (familyId: string) => {
        if (!user) return;
        const { error } = await db.from('family_members').insert({
            family_id: familyId,
            user_id: user.id,
            role: 'member',
        });
        if (error) throw error;
        await fetchFamilies();
    };

    return (
        <FamilyContext.Provider value={{ families, currentFamily, setCurrentFamily, createFamily, joinFamily, loading, refetch: fetchFamilies }}>
            {children}
        </FamilyContext.Provider>
    );
};

export const useFamily = () => {
    const context = useContext(FamilyContext);
    if (context === undefined) throw new Error('useFamily must be used within a FamilyProvider');
    return context;
};
