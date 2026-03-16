import { Outlet, NavLink, Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useTrip } from '../contexts/TripContext';
import { useMemo } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';

const tabs = [
    { name: 'Itinerary', path: '' },
    { name: 'Budget', path: 'budget' },
    { name: 'Tasks', path: 'tasks' },
    { name: 'Feed', path: 'feed' },
    { name: 'Docs', path: 'documents' },
];

export default function TripLayout() {
    const { tripId } = useParams<{ tripId: string }>();
    const { trips, loading } = useTrip();

    const trip = useMemo(() => trips.find(t => t.id === tripId), [trips, tripId]);

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-400 mt-4">Loading trip...</p>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-400">Trip not found</p>
                <Link to="/trips" className="text-brand-teal mt-4 inline-block">Back to Trips</Link>
            </div>
        );
    }

    const daysAway = differenceInDays(parseISO(trip.startDate), new Date());

    return (
        <div className="pb-8 min-h-screen bg-[var(--color-bg-primary)]">
            {/* Header with Background */}
            <div className="relative h-48 bg-gradient-to-b from-gray-800 to-[var(--color-bg-primary)]">
                <Link to="/trips" className="absolute top-4 left-4 p-2 bg-black/30 rounded-full z-20">
                    <ArrowLeft size={24} className="text-white" />
                </Link>
                {trip.image && (
                    <img src={trip.image} alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />
                )}
                <div className="absolute bottom-6 left-4 right-4 z-10">
                    <h1 className="text-2xl font-bold text-white">{trip.title}</h1>
                    <p className="text-gray-300 text-sm flex items-center gap-2 mt-1">
                        <Calendar size={16} />
                        {format(parseISO(trip.startDate), 'MMM d')} - {format(parseISO(trip.endDate), 'MMM d, yyyy')} •{' '}
                        {daysAway > 0 ? `${daysAway} days to go` : 'In progress'}
                    </p>
                </div>
            </div>

            {/* Stats Summary Row */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="bg-[var(--color-bg-card)] rounded-xl p-3 text-center border border-[var(--color-border)]">
                    <div className="text-xs text-[var(--color-text-secondary)] mb-1">Budget</div>
                    <div className="text-xl font-bold text-[var(--color-text-primary)]">${trip.budget?.toLocaleString() || '0'}</div>
                </div>
                <div className="bg-[var(--color-bg-card)] rounded-xl p-3 text-center border border-[var(--color-border)]">
                    <div className="text-xs text-[var(--color-text-secondary)] mb-1">Days Away</div>
                    <div className="text-xl font-bold text-[var(--color-text-primary)]">
                        {daysAway > 0 ? daysAway : 'In progress'}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-border)] px-4 sticky top-0 bg-[var(--color-bg-primary)] z-30 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.name}
                        to={tab.path}
                        end={tab.path === ''}
                        className={({ isActive }) => `px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                                ? 'text-brand-teal border-brand-teal'
                                : 'text-gray-400 border-transparent hover:text-gray-300'
                            }`}
                    >
                        {tab.name}
                    </NavLink>
                ))}
            </div>

            {/* Content Area */}
            <div className="pt-4">
                <Outlet context={{ trip }} />
            </div>
        </div>
    );
}
