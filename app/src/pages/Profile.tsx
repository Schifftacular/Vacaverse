import { useState } from 'react';
import { ChevronRight, HelpCircle, LogOut, Moon, Sun, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { useFamily } from '../contexts/FamilyContext';
import { useTheme } from '../contexts/ThemeContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { Button, Panel } from '../components/ui/Concourse';

export default function Profile() {
    // Route is protected — `user` is always set here; the signed-out sign-in
    // form now lives at the dedicated /login route instead.
    const { user, logout, updateProfile } = useAuth();
    const { trips } = useTrip();
    const { families } = useFamily();
    const { theme, toggleTheme } = useTheme();
    const { open: openFeedback } = useFeedback();

    const [isEditing, setIsEditing] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [saving, setSaving] = useState(false);

    if (!user) return null;

    const startEditing = () => {
        setNameInput(user.display_name || '');
        setIsEditing(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nameInput.trim()) return;
        setSaving(true);
        try {
            await updateProfile(nameInput.trim());
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="pb-8">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-[var(--color-bg-primary)] sticky top-0 z-10 border-b border-[var(--color-border)]">
                <h1 className="cx-h1 text-[var(--color-text-primary)]">Profile</h1>
            </div>

            {/* Profile Card */}
            <div className="px-4 mb-6 pt-4">
                <Panel raked className="p-6 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden border-4 border-brand-teal shrink-0 flex items-center justify-center">
                        {user.photo_url ? (
                            <img src={user.photo_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[var(--color-text-primary)] text-2xl font-bold">
                                {(user.display_name || user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="cx-h2 text-[var(--color-text-primary)]">{user.display_name || user.email?.split('@')[0] || "User"}</h2>
                        <p className="text-[var(--color-text-secondary)]">{user.email}</p>
                        <button onClick={startEditing} className="text-brand-teal text-sm font-medium mt-2">Edit Profile</button>
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

                    {/* Notifications/Payment Methods/Privacy & Security rows removed —
                        none had (or currently need) any real functionality behind them
                        (see issue #8). Help & Support opens the existing feedback panel
                        instead of duplicating it with a second, separate mechanism. */}
                    <button
                        onClick={openFeedback}
                        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <HelpCircle size={20} className="text-[var(--color-text-secondary)]" />
                            <span className="text-[var(--color-text-primary)]">Help & Support</span>
                        </div>
                        <ChevronRight size={20} className="text-[var(--color-text-secondary)]" />
                    </button>
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

            {/* Edit Profile modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={() => setIsEditing(false)}>
                    <div className="cx-slide w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="cx-h2 text-[var(--color-text-primary)]">Edit Profile</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} aria-label="Close">
                                <X size={20} />
                            </Button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Name</label>
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                    required
                                />
                            </div>
                            <Button type="submit" variant="primary" size="lg" disabled={saving}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
