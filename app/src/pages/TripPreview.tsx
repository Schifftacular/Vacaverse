import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/client';
import { MapPin, Calendar, Users, LogIn } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Panel, EmptyState } from '../components/ui/Concourse';
import type { Trip, TripEvent } from '../types';

export default function TripPreview() {
    const { shareToken } = useParams<{ shareToken: string }>();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [events, setEvents] = useState<TripEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!shareToken) return;
        fetchTripByToken(shareToken);
    }, [shareToken]);

    const fetchTripByToken = async (token: string) => {
        try {
            const { data: tripData, error: tripError } = await db
                .from('trips')
                .select('*')
                .eq('share_token', token)
                .single();

            if (tripError || !tripData) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setTrip(tripData as Trip);

            // Fetch events
            const { data: eventsData, error: eventsError } = await db
                .from('trip_events')
                .select('*')
                .eq('trip_id', tripData.id)
                .order('date')
                .order('time');

            if (!eventsError && eventsData) {
                setEvents(eventsData as TripEvent[]);
            }
        } catch (error) {
            console.error('Error fetching trip preview:', error);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (notFound || !trip) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col items-center justify-center p-4 text-center">
                <h1 className="cx-h1 text-[var(--color-text-primary)] mb-2">Trip not found</h1>
                <p className="text-[var(--color-text-secondary)] mb-6">This link may have expired or been removed.</p>
                <Link to="/profile" className="px-6 py-3 bg-brand-teal text-[var(--color-carbon)] rounded-lg font-bold hover:brightness-110 transition-all">Sign In</Link>
            </div>
        );
    }

    const daysAway = differenceInDays(parseISO(trip.start_date), new Date());

    // Group events by date
    const eventsByDate = events.reduce((acc, event) => {
        if (!acc[event.date]) acc[event.date] = [];
        acc[event.date].push(event);
        return acc;
    }, {} as Record<string, TripEvent[]>);

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            {/* Hero */}
            <div className="relative h-56 cx-rake">
                {trip.image && (
                    <img src={trip.image} alt={trip.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-carbon)] via-[var(--color-carbon)]/40 to-[var(--color-carbon)]/10" />
                <div className="absolute bottom-6 left-4 right-4">
                    <h1 className="cx-h1 text-3xl text-[var(--color-ivory)]">{trip.title}</h1>
                    <div className="flex items-center gap-4 mt-2 text-[var(--color-ivory)]/70 text-sm">
                        <span className="flex items-center gap-1 tabular-nums">
                            <Calendar size={14} />
                            {format(parseISO(trip.start_date), 'MMM d')} - {format(parseISO(trip.end_date), 'MMM d, yyyy')}
                        </span>
                        {daysAway > 0 && <span className="cx-label text-[11px] text-brand-teal">{daysAway} days away</span>}
                    </div>
                </div>
            </div>

            {/* CTA Banner */}
            <div className="bg-brand-teal/10 border-b border-brand-teal/20 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-brand-teal" />
                    <span className="text-[var(--color-text-secondary)]">Sign in to RSVP and collaborate</span>
                </div>
                <Link to="/profile" className="cx-label text-brand-teal text-xs py-3 px-3 -my-3 -mr-3">Sign In</Link>
            </div>

            {/* Read-only Itinerary */}
            <div className="px-4 py-6">
                <h2 className="cx-h2 text-[var(--color-text-primary)] mb-4">Itinerary</h2>

                {events.length === 0 ? (
                    <EmptyState icon={<Calendar size={28} />} title="No events scheduled yet." />
                ) : (
                    Object.keys(eventsByDate).sort().map(dateKey => (
                        <div key={dateKey} className="mb-6">
                            <h3 className="cx-label text-xs text-brand-teal mb-3">
                                {format(parseISO(dateKey), 'EEEE, MMMM d')}
                            </h3>
                            <div className="space-y-2">
                                {eventsByDate[dateKey].map(event => (
                                    <Panel key={event.id} className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="cx-label text-xs text-brand-teal w-14 shrink-0 tabular-nums">{event.time}</div>
                                            <div>
                                                <div className="font-medium text-[var(--color-text-primary)]">{event.title}</div>
                                                {event.location && (
                                                    <div className="flex items-center text-sm text-[var(--color-text-muted)] mt-1">
                                                        <MapPin size={12} className="mr-1" />
                                                        {event.location}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Panel>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bottom CTA */}
            <div className="sticky bottom-0 bg-[var(--color-bg-primary)] border-t border-[var(--color-border)] p-4">
                <Link
                    to="/profile"
                    className="cx-lit flex items-center justify-center w-full bg-brand-teal text-[var(--color-carbon)] text-center font-bold py-4 rounded-xl hover:brightness-110 transition-all"
                >
                    <LogIn size={18} className="mr-2" />
                    Join the trip planning
                </Link>
            </div>
        </div>
    );
}
