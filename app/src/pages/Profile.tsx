import { useState } from 'react';
import { Settings, ChevronRight, Bell, CreditCard, HelpCircle, LogOut, Shield, Moon, Sun, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { useFamily } from '../contexts/FamilyContext';
import { useTheme } from '../contexts/ThemeContext';

const menuItems = [
    { icon: Bell, label: 'Notifications', badge: 3 },
    { icon: CreditCard, label: 'Payment Methods' },
    { icon: Shield, label: 'Privacy & Security' },
    { icon: HelpCircle, label: 'Help & Support' },
];

export default function Profile() {
    const { user, signInWithEmail, signUpWithEmail, logout } = useAuth();
    const { trips } = useTrip();
    const { families } = useFamily();
    const { theme, toggleTheme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isSignUp) {
                await signUpWithEmail(email, password);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to authenticate');
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="w-16 h-16 bg-[var(--color-bg-card)] rounded-full flex items-center justify-center mb-4 text-brand-teal">
                    <LogIn size={32} />
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">{isSignUp ? 'Create Account' : 'Sign In'} to VacaVerse</h2>
                <p className="text-[var(--color-text-secondary)] mb-6 max-w-xs">Sign in to manage your trips, collaborate with family, and save your preferences.</p>

                <form onSubmit={handleEmailAuth} className="w-full max-w-xs flex flex-col gap-3 mb-4">
                    {error && <div className="bg-red-500/20 text-red-200 p-2 rounded text-sm">{error}</div>}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-3 rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:border-brand-teal"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:border-brand-teal"
                        required
                    />
                    <button
                        type="submit"
                        className="bg-brand-teal text-white py-3 rounded-full font-bold hover:bg-teal-600 transition-colors"
                    >
                        {isSignUp ? 'Sign Up' : 'Sign In'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-[var(--color-text-secondary)] text-sm hover:text-[var(--color-text-primary)]"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="pb-8">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-[var(--color-bg-primary)] sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Profile</h1>
                <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                    <Settings size={24} />
                </button>
            </div>

            {/* Profile Card */}
            <div className="px-4 mb-6">
                <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-border)] flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden border-4 border-brand-teal">
                        <img
                            src={user.photo_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{user.display_name || user.email?.split('@')[0] || "User"}</h2>
                        <p className="text-[var(--color-text-secondary)]">{user.email}</p>
                        <button className="text-brand-teal text-sm font-medium mt-2">Edit Profile</button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="px-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--color-bg-card)] rounded-xl p-4 text-center border border-[var(--color-border)]">
                        <div className="text-2xl font-bold text-brand-teal">{trips.length}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">Trips</div>
                    </div>
                    <div className="bg-[var(--color-bg-card)] rounded-xl p-4 text-center border border-[var(--color-border)]">
                        <div className="text-2xl font-bold text-brand-teal">{families.length}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">Families</div>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-4">
                <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
                    {/* Appearance toggle — rendered separately so it can be functional */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-primary)] transition-colors border-b border-[var(--color-border)]"
                    >
                        <div className="flex items-center gap-3">
                            {theme === 'dark' ? <Moon size={20} className="text-gray-400" /> : <Sun size={20} className="text-yellow-400" />}
                            <span style={{ color: 'var(--color-text-primary)' }}>
                                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                            </span>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-0.5 transition-colors ${theme === 'light' ? 'bg-brand-teal' : 'bg-gray-600'}`}>
                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${theme === 'light' ? 'translate-x-6' : ''}`} />
                        </div>
                    </button>

                    {menuItems.map((item, idx) => (
                        <button
                            key={item.label}
                            className={`w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-primary)] transition-colors ${idx !== menuItems.length - 1 ? 'border-b border-[var(--color-border)]' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={20} className="text-[var(--color-text-secondary)]" />
                                <span style={{ color: 'var(--color-text-primary)' }}>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.badge && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                                <ChevronRight size={20} className="text-[var(--color-text-secondary)]" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Logout */}
            <div className="px-4 mt-6">
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center justify-center gap-2 py-4 text-red-400 hover:text-red-300 transition-colors"
                >
                    <LogOut size={20} />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
}
