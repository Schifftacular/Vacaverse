import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { addTripItem, getTripItems } from '../../services/tripService';
import { db } from '../../lib/client';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { Plus, MapPin, X, Loader2, Check, HelpCircle, XCircle } from 'lucide-react';
import { GridSkeleton } from '../../components/ui/Skeletons';
import { Button, EmptyState, Tag } from '../../components/ui/Concourse';
import type { Trip, TripEvent, EventRsvp } from '../../types';

type RsvpStatus = 'going' | 'maybe' | 'not_going';

export default function TripItinerary() {
    const { trip: currentTrip } = useOutletContext<{ trip: Trip }>();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [events, setEvents] = useState<TripEvent[]>([]);
    const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Form
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');

    // Collect all user IDs from RSVPs to resolve profiles
    const rsvpUserIds = useMemo(() => {
        const ids = new Set<string>();
        rsvps.forEach(r => ids.add(r.user_id));
        return Array.from(ids);
    }, [rsvps]);

    const { profiles } = useUserProfiles(rsvpUserIds);

    useEffect(() => {
        if (currentTrip?.id) {
            fetchEvents();
        }
    }, [currentTrip?.id]);

    const fetchEvents = async () => {
        if (!currentTrip?.id) return;
        try {
            const data = await getTripItems<TripEvent>('trip_events', currentTrip.id);
            // Sort by date then time
            const sorted = data.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });
            setEvents(sorted);

            // Fetch RSVPs for all events
            if (sorted.length > 0) {
                const eventIds = sorted.map(e => e.id);
                const { data: rsvpData, error } = await db
                    .from('event_rsvps')
                    .select('*')
                    .in('event_id', eventIds);
                if (!error) {
                    setRsvps(rsvpData || []);
                }
            }
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
                trip_id: currentTrip.id,
                title,
                date,
                time,
                location,
                description: '',
            };
            await addTripItem('trip_events', newEvent as Record<string, unknown>);
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

        // Optimistic update
        setRsvps(prev => {
            const filtered = prev.filter(r => !(r.event_id === event.id && r.user_id === user.id));
            return [...filtered, { event_id: event.id, user_id: user.id, status }];
        });

        try {
            const { error } = await db
                .from('event_rsvps')
                .upsert({ event_id: event.id, user_id: user.id, status });
            if (error) throw error;
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
    const todayKey = new Date().toLocaleDateString('en-CA');

    if (loading) return <div className="p-4"><GridSkeleton /></div>;

    return (
        <div className="px-4 pb-24">
            {events.length === 0 ? (
                <EmptyState
                    title="No events scheduled yet"
                    hint="Add the first stop on the itinerary."
                    action={<Button onClick={() => setIsModalOpen(true)}>Add your first event</Button>}
                />
            ) : (
                sortedDates.map((dateKey) => {
                    const isToday = dateKey === todayKey;
                    const formattedDate = new Date(dateKey).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
                    return (
                    <div key={dateKey} className="mb-8">
                        {isToday ? (
                            <div className="cx-lit inline-flex rounded-[14px] mb-4">
                                <div className="cx-slide cx-rake flex items-center gap-2 px-4 py-2">
                                    <Tag tone="gold">Today</Tag>
                                    <h2 className="cx-label text-sm text-[var(--color-text-primary)]">{formattedDate}</h2>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 mb-4">
                                <h2 className="cx-label text-sm text-[var(--color-text-secondary)]">
                                    {formattedDate}
                                </h2>
                                <div className="h-[1px] bg-[var(--color-border)] flex-1" />
                            </div>
                        )}
                        <div className="space-y-4 relative pl-4 border-l-2 border-[var(--color-border)]">
                            {eventsByDate[dateKey].map((event) => {
                                const myRsvp = user
                                    ? rsvps.find(r => r.event_id === event.id && r.user_id === user.id)?.status
                                    : undefined;
                                const goingUserIds = rsvps
                                    .filter(r => r.event_id === event.id && r.status === 'going')
                                    .map(r => r.user_id);

                                return (
                                    <div key={event.id} className="cx-slide flex items-start p-4 ml-4 relative">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[25px] top-6 w-4 h-4 rounded-full bg-brand-teal border-4 border-[var(--color-bg-primary)]" />

                                        <div className="w-20 pt-1 shrink-0">
                                            <div className="cx-label text-sm tabular-nums text-[var(--color-text-primary)]">{event.time}</div>
                                        </div>
                                        <div className="flex-1 border-l border-[var(--color-border)] pl-4 ml-2 min-w-0">
                                            <h3 className="font-medium text-[var(--color-text-primary)] text-lg">{event.title}</h3>
                                            {event.location && (
                                                <div className="flex items-center text-sm text-[var(--color-text-secondary)] mt-1">
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
                                                            ? 'bg-[var(--color-bottle-green)] border-[var(--color-bottle-green)] text-white'
                                                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-bottle-green)] hover:text-[var(--color-bottle-green)]'
                                                            }`}
                                                    >
                                                        <Check size={12} />
                                                        Going
                                                    </button>
                                                    <button
                                                        onClick={() => handleRsvp(event, 'maybe')}
                                                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${myRsvp === 'maybe'
                                                            ? 'bg-brand-teal border-brand-teal text-[var(--color-carbon)]'
                                                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-brand-teal hover:text-brand-teal'
                                                            }`}
                                                    >
                                                        <HelpCircle size={12} />
                                                        Maybe
                                                    </button>
                                                    <button
                                                        onClick={() => handleRsvp(event, 'not_going')}
                                                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${myRsvp === 'not_going'
                                                            ? 'bg-[var(--color-vermilion)] border-[var(--color-vermilion)] text-white'
                                                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-vermilion)] hover:text-[var(--color-vermilion)]'
                                                            }`}
                                                    >
                                                        <XCircle size={12} />
                                                        Can't go
                                                    </button>

                                                    {/* Tiny avatars of people going */}
                                                    {goingUserIds.length > 0 && (
                                                        <div className="flex items-center gap-1 ml-1">
                                                            <div className="flex -space-x-1">
                                                                {goingUserIds.slice(0, 5).map((uid) => {
                                                                    const profile = profiles.get(uid);
                                                                    return profile?.photo_url ? (
                                                                        <img
                                                                            key={uid}
                                                                            src={profile.photo_url}
                                                                            alt={profile.display_name}
                                                                            title={profile.display_name}
                                                                            className="w-5 h-5 rounded-full border border-[var(--color-bg-card)] object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            key={uid}
                                                                            title={profile?.display_name ?? uid}
                                                                            className="w-5 h-5 rounded-full border border-[var(--color-bg-card)] bg-brand-teal flex items-center justify-center text-[8px] text-[var(--color-carbon)] font-bold"
                                                                        >
                                                                            {(profile?.display_name?.[0] ?? '?').toUpperCase()}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            {goingUserIds.length > 5 && (
                                                                <span className="text-xs text-[var(--color-text-secondary)]">+{goingUserIds.length - 5}</span>
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
                    );
                })
            )}

            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-[var(--color-carbon)] hover:brightness-110 transition-colors z-30"
            >
                <Plus size={24} />
            </button>

            {/* Add Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="cx-slide w-full max-w-md rounded-2xl p-6 relative animate-in slide-in-from-bottom-10 fade-in max-h-[85vh] overflow-y-auto">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="cx-h2 text-[var(--color-text-primary)] mb-6">Add Event</h2>

                        <form onSubmit={handleAddEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Dinner at Mario's"
                                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g., 123 Main St"
                                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={submitLoading}
                                size="lg"
                                className="mt-4"
                            >
                                {submitLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Add Event'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
