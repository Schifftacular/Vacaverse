import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, type AppUser } from '../lib/client';

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
    logout: () => Promise<void>;
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

    return (
        <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
