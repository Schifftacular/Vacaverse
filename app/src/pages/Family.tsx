import { useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { createFamilyInvite } from '../services/inviteService';
import { useUserProfiles } from '../hooks/useUserProfiles';
import { Users, Plus, X, Check, Copy, Loader2 } from 'lucide-react';

export default function Family() {
    const { families, currentFamily, setCurrentFamily, createFamily, loading } = useFamily();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const memberIds = currentFamily?.members ?? [];
    const { profiles } = useUserProfiles(memberIds);

    const handleCreateFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFamilyName.trim()) return;
        setCreateLoading(true);
        try {
            await createFamily(newFamilyName.trim());
            setNewFamilyName('');
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to create family:', error);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleGenerateInvite = async () => {
        if (!currentFamily || !user) return;
        setInviteLoading(true);
        try {
            const code = await createFamilyInvite(currentFamily.id, user.uid);
            setInviteCode(code);
        } catch (error) {
            console.error('Failed to generate invite:', error);
        } finally {
            setInviteLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (!inviteCode) return;
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="p-4 pb-24 min-h-screen bg-[var(--color-bg-primary)]">
                <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-gray-800/50 rounded w-1/2" />
                    <div className="h-24 bg-gray-800/50 rounded-xl" />
                    <div className="h-24 bg-gray-800/50 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 min-h-screen bg-[#0f172a]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Families</h1>
                    <p className="text-[var(--color-text-secondary)] text-sm">Manage your family groups</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-10 h-10 bg-[var(--color-bg-card)] rounded-full flex items-center justify-center text-brand-teal border border-[var(--color-border)]"
                >
                    <Plus size={20} />
                </button>
            </div>

            {families.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Users size={48} className="text-gray-600 mb-4" />
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No family groups yet</h2>
                    <p className="text-[var(--color-text-secondary)] mb-6">Create a family group to start planning together.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-brand-teal text-white rounded-lg font-bold"
                    >
                        Create Family Group
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {families.map(family => (
                        <button
                            key={family.id}
                            onClick={() => {
                                setCurrentFamily(currentFamily?.id === family.id ? null : family);
                                setInviteCode(null);
                            }}
                            className={`w-full bg-[var(--color-bg-card)] p-4 rounded-xl border transition-colors text-left ${
                                currentFamily?.id === family.id
                                    ? 'border-brand-teal'
                                    : 'border-[var(--color-border)] hover:border-gray-700'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[var(--color-text-primary)] font-medium">{family.name}</div>
                                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                                        {family.members.length} member{family.members.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                {currentFamily?.id === family.id && (
                                    <Check size={20} className="text-brand-teal" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Members section for selected family */}
            {currentFamily && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Members</h2>
                        <button
                            onClick={handleGenerateInvite}
                            disabled={inviteLoading}
                            className="text-sm text-brand-teal flex items-center gap-1 disabled:opacity-50"
                        >
                            {inviteLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                            Get Invite Code
                        </button>
                    </div>

                    {/* Invite code display */}
                    {inviteCode && (
                        <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-brand-teal mb-4 text-center">
                            <p className="text-[var(--color-text-secondary)] text-sm mb-2">Share this code with your family</p>
                            <div className="text-4xl font-mono font-bold text-[var(--color-text-primary)] tracking-widest mb-3">
                                {inviteCode}
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Expires in 7 days</p>
                            <button
                                onClick={handleCopyCode}
                                className="flex items-center gap-2 mx-auto px-4 py-2 bg-brand-teal/20 text-brand-teal rounded-lg text-sm font-medium hover:bg-brand-teal/30 transition-colors"
                            >
                                <Copy size={14} />
                                {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>
                    )}

                    {/* Member list */}
                    {currentFamily.members.map(uid => {
                        const profile = profiles.get(uid);
                        return (
                            <div key={uid} className="flex items-center gap-3 bg-[var(--color-bg-card)] p-3 rounded-xl border border-[var(--color-border)] mb-2">
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {profile?.photoURL ? (
                                        <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white text-sm font-bold">
                                            {(profile?.displayName || '?').charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-[var(--color-text-primary)] font-medium">{profile?.displayName || 'Loading...'}</div>
                                    <div className="text-xs text-[var(--color-text-secondary)]">{profile?.email || ''}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Family Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-[var(--color-bg-card)] w-full max-w-md rounded-2xl p-6 relative border border-[var(--color-border)]">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Create Family Group</h2>
                        <form onSubmit={handleCreateFamily} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Family Name</label>
                                <input
                                    type="text"
                                    value={newFamilyName}
                                    onChange={(e) => setNewFamilyName(e.target.value)}
                                    placeholder="e.g., The Smiths"
                                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={createLoading}
                                className="w-full bg-brand-teal text-white font-bold py-4 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
                            >
                                {createLoading ? 'Creating...' : 'Create Family'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
