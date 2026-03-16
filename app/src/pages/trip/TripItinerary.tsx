import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { addSubCollectionItem, getSubCollection, updateSubCollectionItem } from '../../services/tripService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { Plus, MapPin, X, Loader2, Check, HelpCircle, XCircle } from 'lucide-react';
import { GridSkeleton } from '../../components/ui/Skeletons';
import type { Trip, TripEvent } from '../../types';

type RsvpStatus = 'going' | 'maybe' | 'not_going';

export default function TripItinerary() {
    const { trip: currentTrip } = useOutletContext<{ trip: Trip }>();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [events, setEvents] = useState<TripEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Form
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');

    // Collect all user IDs from RSVP maps to resolve profiles
    const rsvpUserIds = useMemo(() => {
        const ids = new Set<string>();
        for (const event of events) {
            if (event.rsvp) {
                Object.keys(event.rsvp).forEach(uid => ids.add(uid));
            }
        }
        return Array.from(ids);
    }, [events]);

    const { profiles } = useUserProfiles(rsvpUserIds);

    useEffect(() => {
        if (currentTrip?.id) {
            fetchEvents();
        }
    }, [currentTrip?.id]);

    const fetchEvents = async () => {
        if (!currentTrip?.id) return;
        try {
            const data = await getSubCollection(currentTrip.id, 'events');
            // Sort by date then time
            const sorted = (data as TripEvent[]).sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });
            setEvents(sorted);
        } catch (error) {
            console.error(error);
            showToast('Failed to load itinerary', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTrip?.id) return;

        setSubmitLoading(true);
        try {
            const newEvent = {
                title,
                date,
                time,
                location,
                description: ''
            };
            await addSubCollectionItem(currentTrip.id, 'events', newEvent);
            showToast('Event added', 'success');
            setIsModalOpen(false);

            // Reset
            setTitle('');
            setDate('');
            setTime('');
            setLocation('');

            fetchEvents();
        } catch (error) {
            console.error(error);
            showToast('Failed to add event', 'error');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleRsvp = async (event: TripEvent, status: RsvpStatus) => {
        if (!currentTrip?.id || !user) return;

        const updatedRsvp = { ...(event.rsvp || {}), [user.uid]: status };

        // Optimistic update
        setEvents(prev =>
            prev.map(e => e.id === event.id ? { ...e, rsvp: updatedRsvp } : e)
        );

        try {
            await updateSubCollectionItem(currentTrip.id, 'events', event.id, { rsvp: updatedRsvp });
        } catch (error) {
            console.error(error);
            showToast('Failed to update RSVP', 'error');
            fetchEvents();
        }
    };

    // Group events by date
    const eventsByDate = events.reduce((acc, event) => {
        const dateKey = event.date;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
    }, {} as Record<string, TripEvent[]>);

    const sortedDates = Object.keys(eventsByDate).sort();

    if (loading) return <div className="p-4"><GridSkeleton /></div>;

    return (
        <div className="px-4 pb-24">
            {events.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <p className="mb-4">No events scheduled yet.</p>
                    <button onClick={() => setIsModalOpen(true)} className="text-brand-teal font-bold hover:underline">
                        Add your first event
                    </button>
                </div>
            ) : (
                sortedDates.map((dateKey) => (
                    <div key={dateKey} className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-lg font-bold text-white">
                                {new Date(dateKey).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h2>
                            <div className="h-[1px] bg-gray-800 flex-1" />
                        </div>
                        <div className="space-y-4 relative pl-4 border-l-2 border-gray-800/50">
                            {eventsByDate[dateKey].map((event) => {
                                const myRsvp = user ? event.rsvp?.[user.uid] : undefined;
                                const goingUids = Object.entries(event.rsvp || {})
                                    .filter(([, s]) => s === 'going')
                                    .map(([uid]) => uid);

                                return (
                                    <div key={event.id} className="flex items-start bg-[#1e293b] rounded-xl p-4 border border-gray-800 ml-4 relative">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[25px] top-6 w-4 h-4 rounded-full bg-brand-teal border-4 border-[#0f172a]" />

                                        <div className="w-20 pt-1 shrink-0">
                                            <div className="text-sm font-bold text-white">{event.time}</div>
                                        </div>
                                        <div className="flex-1 border-l border-gray-700 pl-4 ml-2 min-w-0">
                                            <h3 className="font-medium text-white text-lg">{event.title}</h3>
                                            {event.location && (
                                                <div className="flex items-center text-sm text-gray-400 mt-1">
                                                    <MapPin size={14} className="mr-1 shrink-0" />
                                                    {event.location}
                                                </div>
                                            )}

                                            {/* RSVP Row */}
                                            {user && (
                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => handleRsvp(event, 'going')}
                                                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${myRsvp === 'going'
                                                            ? 'bg-brand-teal border-brand-teal text-white'
                                                            : 'border-gray-700 text-gray-400 hover:border-brand-teal hover:text-brand-teal'
                                                            }`}
                                                    >
                                                        <Check size={12} />
                                                        Going
                                                    </button>
                                                    <button
                                                        onClick={() => handleRsvp(event, 'maybe')}
                                                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${myRsvp === 'maybe'
                                                            ? 'bg-yellow-500 border-yellow-500 text-white'
                                                            : 'border-gray-700 text-gray-400 hover:border-yellow-500 hover:text-yellow-500'
                                                            }`}
                                                    >
                                                        <HelpCircle size={12} />
                                                        Maybe
                                                    </button>
                                                    <button
                                                        onClick={() => handleRsvp(event, 'not_going')}
                                                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${myRsvp === 'not_going'
                                                            ? 'bg-red-500 border-red-500 text-white'
                                                            : 'border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-500'
                                                            }`}
                                                    >
                                                        <XCircle size={12} />
                                                        Can't go
                                                    </button>

                                                    {/* Tiny avatars of people going */}
                                                    {goingUids.length > 0 && (
                                                        <div className="flex items-center gap-1 ml-1">
                                                            <div className="flex -space-x-1">
                                                                {goingUids.slice(0, 5).map((uid) => {
                                                                    const profile = profiles.get(uid);
                                                                    return profile?.photoURL ? (
                                                                        <img
                                                                            key={uid}
                                                                            src={profile.photoURL}
                                                                            alt={profile.displayName}
                                                                            title={profile.displayName}
                                                                            className="w-5 h-5 rounded-full border border-[#1e293b] object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            key={uid}
                                                                            title={profile?.displayName ?? uid}
                                                                            className="w-5 h-5 rounded-full border border-[#1e293b] bg-brand-teal flex items-center justify-center text-[8px] text-white font-bold"
                                                                        >
                                                                            {(profile?.displayName?.[0] ?? '?').toUpperCase()}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            {goingUids.length > 5 && (
                                                                <span className="text-xs text-gray-400">+{goingUids.length - 5}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}

            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-white hover:bg-teal-600 transition-colors z-30"
            >
                <Plus size={24} />
            </button>

            {/* Add Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-[#1e293b] w-full max-w-md rounded-2xl p-6 relative animate-in slide-in-from-bottom-10 fade-in border border-gray-800">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Add Event</h2>

                        <form onSubmit={handleAddEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Dinner at Mario's"
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g., 123 Main St"
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="w-full bg-brand-teal text-white font-bold py-4 rounded-xl mt-4 hover:bg-teal-600 transition-colors disabled:opacity-50"
                            >
                                {submitLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Add Event'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
