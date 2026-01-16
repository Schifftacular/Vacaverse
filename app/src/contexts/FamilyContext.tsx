import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import type { Family } from '../types';

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

    useEffect(() => {
        if (!user) {
            setFamilies([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'families'),
            where('members', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const familyData: Family[] = [];
            snapshot.forEach((doc) => {
                familyData.push({ id: doc.id, ...doc.data() } as Family);
            });
            setFamilies(familyData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const createFamily = async (name: string) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'families'), {
                name,
                members: [user.uid],
                admins: [user.uid],
                createdAt: Date.now()
            });
        } catch (error) {
            console.error("Error creating family:", error);
            throw error;
        }
    };

    const joinFamily = async (familyId: string) => {
        if (!user) return;
        try {
            const familyRef = doc(db, 'families', familyId);
            await updateDoc(familyRef, {
                members: arrayUnion(user.uid)
            });
        } catch (error) {
            console.error("Error joining family:", error);
            throw error;
        }
    };

    return (
        <FamilyContext.Provider value={{
            families,
            currentFamily,
            setCurrentFamily,
            createFamily,
            joinFamily,
            loading
        }}>
            {children}
        </FamilyContext.Provider>
    );
};

export const useFamily = () => {
    const context = useContext(FamilyContext);
    if (context === undefined) {
        throw new Error('useFamily must be used within a FamilyProvider');
    }
    return context;
};
