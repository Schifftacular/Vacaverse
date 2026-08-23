import { useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { createFamilyInvite } from '../services/inviteService';
import { useUserProfiles } from '../hooks/useUserProfiles';
import { db } from '../lib/client';
import { wouldCreateCycle } from '../lib/familyTree';
import { useToast } from '../contexts/ToastContext';
import { Users, Plus, X, Check, Copy, Link2, Loader2, List, GitBranch } from 'lucide-react';
import { Button, Panel, EmptyState } from '../components/ui/Concourse';
import { FamilyTree } from '../components/FamilyTree';

export default function Family() {
    const { families, currentFamily, setCurrentFamily, createFamily, loading, refetch } = useFamily();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    // Coexists with the member list rather than replacing it (see issue #11)
    // — defaults to the list so nothing about the existing, working flow changes.
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
    const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
    const [editParentId, setEditParentId] = useState('');
    const [editPartnerId, setEditPartnerId] = useState('');
    const [savingRelations, setSavingRelations] = useState(false);

    // The live family record (with up-to-date memberRelations), not the
    // possibly-stale copy in currentFamily — see Join.tsx, which sets
    // currentFamily directly without the relations FamilyContext fetches.
    const liveFamily = families.find(f => f.id === currentFamily?.id) ?? currentFamily;
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
            const code = await createFamilyInvite(currentFamily.id, user.id);
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

    const handleCopyLink = () => {
        if (!inviteCode) return;
        navigator.clipboard.writeText(`${window.location.origin}/join?code=${inviteCode}`);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const openEditRelations = (userId: string) => {
        const relation = liveFamily?.memberRelations.find(m => m.user_id === userId);
        setEditParentId(relation?.parent_id ?? '');
        setEditPartnerId(relation?.partner_id ?? '');
        setEditingPersonId(userId);
    };

    const handleSaveRelations = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentFamily || !editingPersonId) return;

        if (editParentId && liveFamily && wouldCreateCycle(liveFamily.memberRelations, editingPersonId, editParentId)) {
            showToast("That would make someone their own ancestor — pick a different parent.", 'error');
            return;
        }
        if (editPartnerId && editPartnerId === editingPersonId) {
            showToast("Someone can't be their own partner.", 'error');
            return;
        }

        setSavingRelations(true);
        try {
            const { error } = await db
                .from('family_members')
                .eq('family_id', currentFamily.id)
                .eq('user_id', editingPersonId)
                .update({ parent_id: editParentId || null, partner_id: editPartnerId || null });
            if (error) throw error;
            await refetch();
            setEditingPersonId(null);
        } catch (error) {
            console.error('Failed to save family relationships:', error);
            showToast('Failed to save. Please try again.', 'error');
        } finally {
            setSavingRelations(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 pb-24 min-h-screen bg-[var(--color-bg-primary)]">
                <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-[var(--color-bg-secondary)] rounded w-1/2" />
                    <div className="h-24 bg-[var(--color-bg-secondary)] rounded-xl" />
                    <div className="h-24 bg-[var(--color-bg-secondary)] rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 min-h-screen bg-[var(--color-bg-primary)]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="cx-h1 text-[var(--color-text-primary)]">My Families</h1>
                    <p className="text-[var(--color-text-secondary)] text-sm">Manage your family groups</p>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-full text-brand-teal"
                >
                    <Plus size={20} />
                </Button>
            </div>

            {families.length === 0 ? (
                <EmptyState
                    icon={<Users size={48} />}
                    title="No family groups yet"
                    hint="Create a family group to start planning together."
                    action={
                        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                            Create Family Group
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-3">
                    {families.map(family => (
                        <button
                            key={family.id}
                            onClick={() => {
                                setCurrentFamily(currentFamily?.id === family.id ? null : family);
                                setInviteCode(null);
                            }}
                            className={`w-full cx-slide p-4 transition-colors text-left ${
                                currentFamily?.id === family.id
                                    ? 'border-brand-teal'
                                    : 'hover:border-brand-teal/50'
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
                    <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
                        <h2 className="cx-label text-sm text-[var(--color-text-muted)]">Members</h2>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-[var(--color-bg-secondary)] rounded-lg p-0.5">
                                <button
                                    onClick={() => setViewMode('list')}
                                    aria-pressed={viewMode === 'list'}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-brand-teal text-[var(--color-carbon)]' : 'text-[var(--color-text-secondary)]'}`}
                                >
                                    <List size={14} /> List
                                </button>
                                <button
                                    onClick={() => setViewMode('tree')}
                                    aria-pressed={viewMode === 'tree'}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${viewMode === 'tree' ? 'bg-brand-teal text-[var(--color-carbon)]' : 'text-[var(--color-text-secondary)]'}`}
                                >
                                    <GitBranch size={14} /> Tree
                                </button>
                            </div>
                            <button
                                onClick={handleGenerateInvite}
                                disabled={inviteLoading}
                                className="text-sm text-brand-teal flex items-center gap-1 disabled:opacity-50"
                            >
                                {inviteLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                                Get Invite Code
                            </button>
                        </div>
                    </div>

                    {/* Invite code display */}
                    {inviteCode && (
                        <Panel raked className="cx-lit p-5 border-brand-teal mb-4 text-center">
                            <p className="text-[var(--color-text-secondary)] text-sm mb-2">Share this code with your family</p>
                            <div className="text-4xl font-mono font-bold text-[var(--color-text-primary)] tracking-widest mb-3 tabular-nums">
                                {inviteCode}
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mb-4">Expires in 7 days · anyone with the code or link can join</p>
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={handleCopyCode}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-teal/20 text-brand-teal rounded-lg text-sm font-medium hover:bg-brand-teal/30 transition-colors"
                                >
                                    <Copy size={14} />
                                    {copied ? 'Copied!' : 'Copy Code'}
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-teal/20 text-brand-teal rounded-lg text-sm font-medium hover:bg-brand-teal/30 transition-colors"
                                >
                                    <Link2 size={14} />
                                    {linkCopied ? 'Copied!' : 'Copy Link'}
                                </button>
                            </div>
                        </Panel>
                    )}

                    {/* Member list */}
                    {viewMode === 'list' && currentFamily.members.map(uid => {
                        const profile = profiles.get(uid);
                        return (
                            <div key={uid} className="flex items-center gap-3 cx-slide p-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden border-2 border-brand-teal flex-shrink-0">
                                    {profile?.photo_url ? (
                                        <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[var(--color-text-primary)] text-sm font-bold">
                                            {(profile?.display_name || '?').charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-[var(--color-text-primary)] font-medium">{profile?.display_name || 'Loading...'}</div>
                                    <div className="text-xs text-[var(--color-text-secondary)]">{profile?.email || ''}</div>
                                </div>
                            </div>
                        );
                    })}

                    {viewMode === 'tree' && liveFamily && (
                        liveFamily.members.length > 0 ? (
                            <Panel className="p-2">
                                <FamilyTree
                                    memberRelations={liveFamily.memberRelations}
                                    profiles={profiles}
                                    onEditPerson={openEditRelations}
                                />
                                <p className="text-xs text-[var(--color-text-secondary)] text-center px-4 pb-2">
                                    Tap anyone to set their parent or partner.
                                </p>
                            </Panel>
                        ) : (
                            <p className="text-sm text-[var(--color-text-secondary)] text-center py-6">No members yet.</p>
                        )
                    )}
                </div>
            )}

            {/* Create Family Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="cx-slide w-full max-w-md p-6 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                            <X size={24} />
                        </button>
                        <h2 className="cx-h2 text-[var(--color-text-primary)] mb-6">Create Family Group</h2>
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
                            <Button type="submit" variant="primary" size="lg" disabled={createLoading}>
                                {createLoading ? 'Creating...' : 'Create Family'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit relationships modal */}
            {editingPersonId && currentFamily && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setEditingPersonId(null)}>
                    <div className="cx-slide w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditingPersonId(null)} className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                            <X size={24} />
                        </button>
                        <h2 className="cx-h2 text-[var(--color-text-primary)] mb-1">
                            {profiles.get(editingPersonId)?.display_name || 'This person'}
                        </h2>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-6">How are they related to the family?</p>
                        <form onSubmit={handleSaveRelations} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Parent</label>
                                <select
                                    value={editParentId}
                                    onChange={(e) => setEditParentId(e.target.value)}
                                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                >
                                    <option value="">None</option>
                                    {(liveFamily ?? currentFamily).members
                                        .filter(uid => uid !== editingPersonId)
                                        .map(uid => (
                                            <option key={uid} value={uid}>{profiles.get(uid)?.display_name || uid}</option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Partner</label>
                                <select
                                    value={editPartnerId}
                                    onChange={(e) => setEditPartnerId(e.target.value)}
                                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                >
                                    <option value="">None</option>
                                    {(liveFamily ?? currentFamily).members
                                        .filter(uid => uid !== editingPersonId)
                                        .map(uid => (
                                            <option key={uid} value={uid}>{profiles.get(uid)?.display_name || uid}</option>
                                        ))}
                                </select>
                            </div>
                            <Button type="submit" variant="primary" size="lg" disabled={savingRelations}>
                                {savingRelations ? 'Saving...' : 'Save'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
