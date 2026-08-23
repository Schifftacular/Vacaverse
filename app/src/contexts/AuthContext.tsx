import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, type AppUser } from '../lib/client';
import { updateCachedProfile } from '../hooks/useUserProfiles';

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        auth.me().then(u => {
            setUser(u);
            setLoading(false);
        });
    }, []);

    const signInWithEmail = async (email: string, password: string) => {
        const { data, error } = await auth.signIn(email, password);
        if (error) throw error;
        setUser(data.user);
    };

    const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
        const { data, error } = await auth.signUp(email, password, displayName);
        if (error) throw error;
        setUser(data.user);
    };

    const logout = async () => {
        const { error } = await auth.signOut();
        if (error) throw error;
        setUser(null);
    };

    const updateProfile = async (displayName: string) => {
        const { data, error } = await auth.updateProfile(displayName);
        if (error) throw error;
        setUser(data.user);
        // useUserProfiles caches profiles module-wide by id — without this,
        // every other mounted view of this user's name (family roster,
        // member list, family tree) stays stale until a full reload.
        updateCachedProfile(data.user.id, { display_name: data.user.display_name });
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, logout, updateProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
