import { useState, useEffect } from 'react';
import { Plus, ChevronRight, X, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTrips, createTrip } from '../services/firestore';
import { deleteTrip } from '../services/tripService'; // New generic service
import { uploadImage } from '../services/storage';
import { useToast } from '../contexts/ToastContext';
import { GridSkeleton } from '../components/ui/Skeletons';
import type { Trip } from '../types';

function TripListCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string, e: React.MouseEvent) => void }) {
    return (
        <Link to={`/trips/${trip.id}`} className="block group">
            <div className="bg-[#1e293b] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors relative">

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
                        <p className="text-sm text-gray-300">{trip.dates} • {trip.daysAway} days to go</p>
                    </div>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-[#0f172a] rounded-lg p-3">
                            <div className="text-sm text-gray-400">Budget Used</div>
                            <div className="text-xl font-bold text-brand-teal">{trip.progress.budget}%</div>
                        </div>
                        <div className="bg-[#0f172a] rounded-lg p-3">
                            <div className="text-sm text-gray-400">Tasks Complete</div>
                            <div className="text-xl font-bold text-brand-teal">{trip.progress.tasks}%</div>
                        </div>
                        <div className="bg-[#0f172a] rounded-lg p-3">
                            <div className="text-sm text-gray-400">Bookings</div>
                            <div className="text-xl font-bold text-brand-teal text-nowrap">
                                {trip.progress.bookings.done}/{trip.progress.bookings.total}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                    <span className="text-sm text-gray-400">View itinerary</span>
                    <ChevronRight size={20} className="text-gray-400" />
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
    const [newTripDates, setNewTripDates] = useState('');
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
            const data = await getTrips(user.uid);
            setTrips(data);
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
        if (!user || !newTripTitle || !newTripDates) return;

        setCreateLoading(true);
        try {
            let imageUrl = `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800`; // Default

            if (selectedImage) {
                const path = `trips/${user.uid}/${Date.now()}_${selectedImage.name}`;
                imageUrl = await uploadImage(selectedImage, path);
            }

            await createTrip(user.uid, {
                title: newTripTitle,
                dates: newTripDates,
                daysAway: Math.floor(Math.random() * 100) + 30, // Mock days away for now
                image: imageUrl,
                progress: {
                    budget: 0,
                    tasks: 0,
                    bookings: { done: 0, total: 5 }
                }
            });
            await fetchTrips();
            showToast('Trip created successfully!', 'success');

            // Reset form
            setIsModalOpen(false);
            setNewTripTitle('');
            setNewTripDates('');
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
            <div className="flex justify-between items-center p-4 bg-[#0f172a] sticky top-0 z-10 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-white">My Trips</h1>
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
                    className="w-full bg-[#1e293b] border-2 border-dashed border-gray-600 rounded-2xl p-8 flex flex-col items-center justify-center hover:border-gray-500 transition-colors"
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
                    <div className="bg-[#1e293b] w-full max-w-md rounded-2xl p-6 relative animate-in slide-in-from-bottom-10 fade-in border border-gray-800">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Plan a New Trip</h2>

                        <form onSubmit={handleCreateTrip} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Trip Title</label>
                                <input
                                    type="text"
                                    value={newTripTitle}
                                    onChange={(e) => setNewTripTitle(e.target.value)}
                                    placeholder="e.g., Summer in Italy"
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Dates</label>
                                <input
                                    type="text"
                                    value={newTripDates}
                                    onChange={(e) => setNewTripDates(e.target.value)}
                                    placeholder="e.g., July 10-20, 2026"
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Cover Image</label>
                                <div className="border border-gray-700 rounded-xl p-3 bg-[#0f172a] flex items-center space-x-4">
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
