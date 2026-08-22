import { useState } from 'react';
import { Settings, ChevronRight, Bell, CreditCard, HelpCircle, LogOut, Shield, Moon, Sun, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { useFamily } from '../contexts/FamilyContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Panel } from '../components/ui/Concourse';

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
            <div className="flex flex-col items-center justify-center min-h-[85vh] p-4">
                {/* The sign-in ticket — a raked glass slide, like a boarding pass
                    lit on the board, rather than a generic centered form stack. */}
                <div className="w-full max-w-xs relative">
                    <Panel raked className="p-6 pt-8 relative overflow-visible">
                        <span className="cx-label absolute top-4 right-4 text-[10px] text-[var(--color-text-muted)]">Concourse</span>
                        <div className="w-14 h-14 bg-brand-teal/15 border border-brand-teal/30 rounded-full flex items-center justify-center mb-5 text-brand-teal">
                            <LogIn size={26} />
                        </div>
                        <h2 className="cx-h1 text-2xl text-[var(--color-text-primary)] mb-2">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
                        <p className="text-[var(--color-text-secondary)] mb-6 text-sm">Manage your trips, collaborate with family, and save your preferences.</p>

                        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                            {error && (
                                <div className="bg-[var(--color-vermilion)]/15 text-[var(--color-vermilion)] border border-[var(--color-vermilion)]/30 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="p-3 rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:border-brand-teal"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="p-3 rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:border-brand-teal"
                                required
                            />
                            <Button type="submit" variant="primary" size="lg">
                                {isSignUp ? 'Sign Up' : 'Sign In'}
                            </Button>
                        </form>
                    </Panel>
                    {/* The stub — torn-ticket companion tab holding the mode switch */}
                    <div className="cx-slide mt-2 py-3 text-center">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-[var(--color-text-secondary)] text-sm hover:text-brand-teal transition-colors"
                        >
                            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-8">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-[var(--color-bg-primary)] sticky top-0 z-10 border-b border-[var(--color-border)]">
                <h1 className="cx-h1 text-[var(--color-text-primary)]">Profile</h1>
                <Button variant="ghost" size="icon">
                    <Settings size={22} />
                </Button>
            </div>

            {/* Profile Card */}
            <div className="px-4 mb-6 pt-4">
                <Panel raked className="p-6 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden border-4 border-brand-teal shrink-0">
                        <img
                            src={user.photo_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="cx-h2 text-[var(--color-text-primary)]">{user.display_name || user.email?.split('@')[0] || "User"}</h2>
                        <p className="text-[var(--color-text-secondary)]">{user.email}</p>
                        <button className="text-brand-teal text-sm font-medium mt-2">Edit Profile</button>
                    </div>
                </Panel>
            </div>

            {/* Stats */}
            <div className="px-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                    <Panel className="p-4 text-center">
                        <div className="text-2xl font-bold text-brand-teal tabular-nums">{trips.length}</div>
                        <div className="cx-label text-xs text-[var(--color-text-secondary)]">Trips</div>
                    </Panel>
                    <Panel className="p-4 text-center">
                        <div className="text-2xl font-bold text-brand-teal tabular-nums">{families.length}</div>
                        <div className="cx-label text-xs text-[var(--color-text-secondary)]">Families</div>
                    </Panel>
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-4">
                <Panel className="overflow-hidden">
                    {/* Appearance toggle — rendered separately so it can be functional */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-secondary)] transition-colors border-b border-[var(--color-border)]"
                    >
                        <div className="flex items-center gap-3">
                            {theme === 'dark' ? <Moon size={20} className="text-brand-teal" /> : <Sun size={20} className="text-brand-teal" />}
                            <span className="text-[var(--color-text-primary)]">
                                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                            </span>
                        </div>
                        <div
                            className={`w-12 h-6 rounded-full p-0.5 border transition-colors ${theme === 'light' ? 'bg-brand-teal border-brand-teal cx-lit' : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
                                }`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-[var(--color-ivory)] shadow-sm transition-transform ${theme === 'light' ? 'translate-x-6' : ''}`} />
                        </div>
                    </button>

                    {menuItems.map((item, idx) => (
                        <button
                            key={item.label}
                            className={`w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-secondary)] transition-colors ${idx !== menuItems.length - 1 ? 'border-b border-[var(--color-border)]' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={20} className="text-[var(--color-text-secondary)]" />
                                <span className="text-[var(--color-text-primary)]">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.badge && (
                                    <span className="bg-[var(--color-vermilion)] text-white text-xs px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                                <ChevronRight size={20} className="text-[var(--color-text-secondary)]" />
                            </div>
                        </button>
                    ))}
                </Panel>
            </div>

            {/* Logout */}
            <div className="px-4 mt-6">
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center justify-center gap-2 py-4 text-[var(--color-vermilion)] hover:opacity-80 transition-opacity"
                >
                    <LogOut size={20} />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
}
