import { useState } from 'react';
import { Plus, ChevronRight, X, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInDays, format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useTrip } from '../contexts/TripContext';
import { createTrip, deleteTrip } from '../services/tripService';
import { storage } from '../lib/client';
import { resolveTripFamilyId } from '../lib/tripAccess';

import { useToast } from '../contexts/ToastContext';
import { GridSkeleton } from '../components/ui/Skeletons';
import { Panel } from '../components/ui/Concourse';
import type { Trip } from '../types';

// The hero slide: the one trip at the near edge of the rack, lit and full
// detail. Everything else in the rack is a receding strip (below).
function TripHeroSlide({ trip, onDelete }: { trip: Trip; onDelete: (id: string, e: React.MouseEvent) => void }) {
    const daysAway = differenceInDays(parseISO(trip.start_date), new Date());
    const daysLabel = daysAway > 0
        ? `${daysAway} days away`
        : daysAway === 0
            ? 'Today!'
            : 'Completed';

    return (
        <Link to={`/trips/${trip.id}`} className="block group">
            <Panel raked className="cx-lit overflow-hidden relative">
                {/* Delete Button — visible by default on touch, hover-revealed on desktop only */}
                <button
                    onClick={(e) => onDelete(trip.id, e)}
                    className="absolute top-3 right-3 z-10 w-11 h-11 flex items-center justify-center bg-black/50 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-[var(--color-vermilion)]/80"
                    title="Delete Trip"
                    aria-label="Delete trip"
                >
                    <Trash2 size={16} />
                </button>

                <div className="relative h-48">
                    <img src={trip.image} alt={trip.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--color-carbon)] via-[var(--color-carbon)]/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="cx-h1 text-2xl text-[var(--color-ivory)]" style={{ textShadow: '0 2px 10px rgb(0 0 0 / 0.4)' }}>{trip.title}</h3>
                        <p className="text-sm text-[var(--color-ivory)]/80 flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="tabular-nums">
                                {format(parseISO(trip.start_date), 'MMM d')} – {format(parseISO(trip.end_date), 'MMM d, yyyy')}
                            </span>
                            <span className="cx-label text-[11px] text-brand-teal">{daysLabel}</span>
                        </p>
                    </div>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3">
                            <div className="cx-label text-[11px] text-[var(--color-text-muted)]">Budget</div>
                            <div className="text-xl font-bold text-brand-teal tabular-nums">${trip.budget.toLocaleString()}</div>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3">
                            <div className="cx-label text-[11px] text-[var(--color-text-muted)]">Days Away</div>
                            <div className="text-xl font-bold text-brand-teal tabular-nums">
                                {daysAway > 0 ? daysAway : daysAway === 0 ? 'Today' : 'Done'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text-secondary)]">View itinerary</span>
                    <ChevronRight size={20} className="text-[var(--color-text-secondary)]" />
                </div>
            </Panel>
        </Link>
    );
}

// A receding rack strip — every trip behind the hero slide. Each one sits
// further from the rail than the last (real indent, real width loss, real
// dimming), so the list reads as a rack seen at an angle, not a stack of
// identical cards with a coat of paint.
function TripRackStrip({ trip, onDelete, depth }: { trip: Trip; onDelete: (id: string, e: React.MouseEvent) => void; depth: number }) {
    const daysAway = differenceInDays(parseISO(trip.start_date), new Date());
    const daysLabel = daysAway > 0 ? `${daysAway}d` : daysAway === 0 ? 'Today' : 'Done';
    const indent = Math.min(depth, 5) * 14;
    const dim = Math.max(1 - Math.min(depth, 5) * 0.09, 0.6);

    return (
        <div className="relative flex items-stretch" style={{ paddingLeft: `${indent + 20}px` }}>
            <div className="absolute left-[9px] top-0 bottom-0 w-px bg-[var(--color-border)]" aria-hidden="true" />
            <div
                className="absolute rounded-full bg-brand-teal"
                style={{ left: '5px', top: '50%', width: 9, height: 9, transform: 'translateY(-50%)', opacity: dim }}
                aria-hidden="true"
            />
            <Link to={`/trips/${trip.id}`} className="group flex-1 min-w-0">
                <div
                    className="cx-slide cx-rake flex items-center gap-3 pl-3 pr-2 py-2.5 hover:border-brand-teal/50 transition-colors"
                    style={{ opacity: dim }}
                >
                    <div className="w-12 h-12 rounded-md overflow-hidden shrink-0">
                        <img src={trip.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-[var(--color-text-primary)] truncate">{trip.title}</h4>
                        <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
                            {format(parseISO(trip.start_date), 'MMM d')} – {format(parseISO(trip.end_date), 'MMM d, yyyy')}
                        </p>
                    </div>
                    <span className="cx-label text-[10px] text-brand-teal shrink-0">{daysLabel}</span>
                    <button
                        onClick={(e) => { e.preventDefault(); onDelete(trip.id, e); }}
                        className="shrink-0 w-11 h-11 flex items-center justify-center text-[var(--color-text-muted)] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:text-[var(--color-vermilion)]"
                        title="Delete Trip"
                        aria-label="Delete trip"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </Link>
        </div>
    );
}

export default function Trips() {
    const { user } = useAuth();
    const { families } = useFamily();
    const { showToast } = useToast();
    const { trips, loading, refetch } = useTrip();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [newTripTitle, setNewTripTitle] = useState('');
    const [newTripStartDate, setNewTripStartDate] = useState('');
    const [newTripEndDate, setNewTripEndDate] = useState('');
    const [newTripBudget, setNewTripBudget] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [createLoading, setCreateLoading] = useState(false);
    // Only asked when the user belongs to more than one family — with zero
    // or one, resolveTripFamilyId decides it without a prompt.
    const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDeleteTrip = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) return;

        try {
            await deleteTrip(id);
            await refetch();
            showToast('Trip deleted successfully', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to delete trip', 'error');
        }
    };

    const handleCreateTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTripTitle || !newTripStartDate || !newTripEndDate) return;
        if (families.length > 1 && !selectedFamilyId) {
            showToast('Choose which family this trip belongs to', 'error');
            return;
        }

        setCreateLoading(true);
        try {
            let imageUrl = `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800`; // Default

            if (selectedImage) {
                const path = `trip-covers/${user.id}/${Date.now()}_${selectedImage.name}`;
                const { error: uploadError } = await storage.from('trip-documents').upload(path, selectedImage);
                if (!uploadError) {
                    const { data: urlData } = storage.from('trip-documents').getPublicUrl(path);
                    imageUrl = urlData.publicUrl;
                }
            }

            await createTrip(user.id, {
                title: newTripTitle,
                start_date: newTripStartDate,
                end_date: newTripEndDate,
                image: imageUrl,
                budget: parseFloat(newTripBudget) || 0,
                family_id: resolveTripFamilyId(families, selectedFamilyId),
            });
            await refetch();
            showToast('Trip created successfully!', 'success');

            // Reset form
            setIsModalOpen(false);
            setNewTripTitle('');
            setNewTripStartDate('');
            setNewTripEndDate('');
            setNewTripBudget('');
            setSelectedImage(null);
            setImagePreview(null);
            setSelectedFamilyId(null);
        } catch (error) {
            console.error('Failed to create trip', error);
            showToast('Failed to create trip. Please try again.', 'error');
        } finally {
            setCreateLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 pt-20">
                <GridSkeleton />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <h2 className="cx-h2 text-[var(--color-text-primary)] mb-2">Sign in to view your trips</h2>
                <p className="text-[var(--color-text-secondary)] mb-6">You need an account to plan and save your trips.</p>
                <Link to="/profile" className="px-6 py-3 bg-brand-teal text-[var(--color-carbon)] rounded-lg font-bold">
                    Go to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-[var(--color-bg-primary)] sticky top-0 z-10 border-b border-[var(--color-border)]">
                <h1 className="cx-h1 text-[var(--color-text-primary)]">My Trips</h1>
                <button className="cx-label text-brand-teal text-xs">Past Trips</button>
            </div>

            <div className="px-4 pt-4">
                {trips.length === 0 ? (
                    <div className="text-center py-10 text-[var(--color-text-muted)]">
                        No trips found. Start planning one!
                    </div>
                ) : (
                    <div className="space-y-4">
                        <TripHeroSlide trip={trips[0]} onDelete={handleDeleteTrip} />
                        {trips.length > 1 && (
                            <div className="space-y-2 pt-1">
                                {trips.slice(1).map((trip, i) => (
                                    <TripRackStrip key={trip.id} trip={trip} onDelete={handleDeleteTrip} depth={i} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* FAB — the sole "plan a trip" action; avoid duplicating it inline */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-24 right-4 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-[var(--color-carbon)] hover:brightness-110 transition-all z-20 cx-lit"
                aria-label="Plan a new trip"
            >
                <Plus size={32} />
            </button>

            {/* Create Trip Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="cx-slide w-full max-w-md p-6 relative animate-in slide-in-from-bottom-10 fade-in">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="cx-h2 text-[var(--color-text-primary)] mb-6">Plan a New Trip</h2>

                        <form onSubmit={handleCreateTrip} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Trip Title</label>
                                <input
                                    type="text"
                                    value={newTripTitle}
                                    onChange={(e) => setNewTripTitle(e.target.value)}
                                    placeholder="e.g., Summer in Italy"
                                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={newTripStartDate}
                                        onChange={(e) => setNewTripStartDate(e.target.value)}
                                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={newTripEndDate}
                                        onChange={(e) => setNewTripEndDate(e.target.value)}
                                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Trip Budget ($)</label>
                                <input
                                    type="number"
                                    value={newTripBudget}
                                    onChange={(e) => setNewTripBudget(e.target.value)}
                                    placeholder="5000"
                                    min="0"
                                    step="1"
                                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                />
                            </div>

                            {families.length > 1 && (
                                <div>
                                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Family</label>
                                    <select
                                        value={selectedFamilyId ?? ''}
                                        onChange={(e) => setSelectedFamilyId(e.target.value || null)}
                                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                        required
                                    >
                                        <option value="" disabled>Which family is this trip for?</option>
                                        {families.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Cover Image</label>
                                <div className="border border-[var(--color-border)] rounded-xl p-3 bg-[var(--color-bg-primary)] flex items-center space-x-4">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center text-[var(--color-text-muted)]">
                                            <ImageIcon size={24} />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="text-sm text-[var(--color-text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-teal file:text-[var(--color-carbon)] hover:file:brightness-90"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={createLoading}
                                className="w-full bg-brand-teal text-[var(--color-carbon)] font-bold py-4 rounded-xl mt-4 hover:brightness-110 transition-all disabled:opacity-50"
                            >
                                {createLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Create Trip'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
