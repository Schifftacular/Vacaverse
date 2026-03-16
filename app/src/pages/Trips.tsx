import { useState, useEffect } from 'react';
import { Plus, ChevronRight, X, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInDays, format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { createTrip, deleteTrip } from '../services/tripService';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../services/storage';
import { useToast } from '../contexts/ToastContext';
import { GridSkeleton } from '../components/ui/Skeletons';
import type { Trip } from '../types';

function TripListCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string, e: React.MouseEvent) => void }) {
    const daysAway = differenceInDays(parseISO(trip.start_date), new Date());
    const daysLabel = daysAway > 0
        ? `${daysAway} days away`
        : daysAway === 0
            ? 'Today!'
            : 'Completed';

    return (
        <Link to={`/trips/${trip.id}`} className="block group">
            <div className="bg-[var(--color-bg-card)] rounded-2xl overflow-hidden border border-[var(--color-border)] hover:border-gray-700 transition-colors relative">

                {/* Delete Button (visible on hover) */}
                <button
                    onClick={(e) => onDelete(trip.id, e)}
                    className="absolute top-3 right-3 z-10 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                    title="Delete Trip"
                >
                    <Trash2 size={16} />
                </button>

                <div className="relative h-40">
                    <img src={trip.image} alt={trip.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white">{trip.title}</h3>
                        <p className="text-sm text-gray-300">
                            {format(parseISO(trip.start_date), 'MMM d')} - {format(parseISO(trip.end_date), 'MMM d, yyyy')} • {daysLabel}
                        </p>
                    </div>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-[var(--color-bg-primary)] rounded-lg p-3">
                            <div className="text-sm text-[var(--color-text-secondary)]">Budget</div>
                            <div className="text-xl font-bold text-brand-teal">${trip.budget.toLocaleString()}</div>
                        </div>
                        <div className="bg-[var(--color-bg-primary)] rounded-lg p-3">
                            <div className="text-sm text-[var(--color-text-secondary)]">Days Away</div>
                            <div className="text-xl font-bold text-brand-teal">
                                {daysAway > 0 ? daysAway : daysAway === 0 ? 'Today' : 'Done'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text-secondary)]">View itinerary</span>
                    <ChevronRight size={20} className="text-[var(--color-text-secondary)]" />
                </div>
            </div>
        </Link>
    );
}

export default function Trips() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [newTripTitle, setNewTripTitle] = useState('');
    const [newTripStartDate, setNewTripStartDate] = useState('');
    const [newTripEndDate, setNewTripEndDate] = useState('');
    const [newTripBudget, setNewTripBudget] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [createLoading, setCreateLoading] = useState(false);

    const fetchTrips = async () => {
        if (!user) {
            setTrips([]);
            setLoading(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setTrips(data || []);
        } catch (error) {
            console.error('Failed to fetch trips', error);
            showToast('Failed to load trips', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, [user]);

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
            setTrips(prev => prev.filter(t => t.id !== id));
            showToast('Trip deleted successfully', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to delete trip', 'error');
        }
    };

    const handleCreateTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTripTitle || !newTripStartDate || !newTripEndDate) return;

        setCreateLoading(true);
        try {
            let imageUrl = `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800`; // Default

            if (selectedImage) {
                const path = `trips/${user.id}/${Date.now()}_${selectedImage.name}`;
                imageUrl = await uploadImage(selectedImage, path);
            }

            await createTrip(user.id, {
                title: newTripTitle,
                start_date: newTripStartDate,
                end_date: newTripEndDate,
                image: imageUrl,
                budget: parseFloat(newTripBudget) || 0,
            });
            await fetchTrips();
            showToast('Trip created successfully!', 'success');

            // Reset form
            setIsModalOpen(false);
            setNewTripTitle('');
            setNewTripStartDate('');
            setNewTripEndDate('');
            setNewTripBudget('');
            setSelectedImage(null);
            setImagePreview(null);
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
                <h2 className="text-2xl font-bold text-white mb-2">Sign in to view your trips</h2>
                <p className="text-gray-400 mb-6">You need an account to plan and save your trips.</p>
                <Link to="/profile" className="px-6 py-3 bg-brand-teal text-white rounded-lg font-bold">
                    Go to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-[var(--color-bg-primary)] sticky top-0 z-10 border-b border-[var(--color-border)]">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Trips</h1>
                <button className="text-brand-teal font-medium text-sm">Past Trips</button>
            </div>

            <div className="px-4 space-y-4 pt-4">
                {trips.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No trips found. Start planning one!
                    </div>
                ) : (
                    trips.map((trip) => (
                        <TripListCard key={trip.id} trip={trip} onDelete={handleDeleteTrip} />
                    ))
                )}

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-[var(--color-bg-card)] border-2 border-dashed border-[var(--color-border)] rounded-2xl p-8 flex flex-col items-center justify-center hover:border-gray-500 transition-colors"
                >
                    <Plus size={32} className="text-gray-400 mb-2" />
                    <span className="text-gray-400">Plan a New Trip</span>
                </button>
            </div>

            {/* FAB */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-24 right-4 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-white hover:bg-teal-600 transition-colors z-20"
            >
                <Plus size={32} />
            </button>

            {/* Create Trip Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-[var(--color-bg-card)] w-full max-w-md rounded-2xl p-6 relative animate-in slide-in-from-bottom-10 fade-in border border-[var(--color-border)]">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Plan a New Trip</h2>

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

                            <div>
                                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Cover Image</label>
                                <div className="border border-[var(--color-border)] rounded-xl p-3 bg-[var(--color-bg-primary)] flex items-center space-x-4">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500">
                                            <ImageIcon size={24} />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-teal file:text-white hover:file:bg-teal-600"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={createLoading}
                                className="w-full bg-brand-teal text-white font-bold py-4 rounded-xl mt-4 hover:bg-teal-600 transition-colors disabled:opacity-50"
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
