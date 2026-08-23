import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';
type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    effectiveTheme: EffectiveTheme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): EffectiveTheme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('vacaverse-theme');
        return (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : 'system';
    });
    const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(getSystemTheme);

    const effectiveTheme: EffectiveTheme = theme === 'system' ? systemTheme : theme;

    useEffect(() => {
        localStorage.setItem('vacaverse-theme', theme);
    }, [theme]);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => setSystemTheme(getSystemTheme());
        mq.addEventListener('change', handleChange);
        return () => mq.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', effectiveTheme);
    }, [effectiveTheme]);

    const toggleTheme = () => setTheme(prev => (prev === 'dark' || (prev === 'system' && effectiveTheme === 'dark')) ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
