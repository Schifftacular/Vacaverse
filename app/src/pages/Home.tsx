import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Briefcase, Plus } from 'lucide-react';

export default function Home() {
    const { user } = useAuth();
    const { trips, loading } = useTrip();

    const upcomingTrip = trips
        .filter(t => differenceInDays(parseISO(t.start_date), new Date()) > 0)
        .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime())[0];

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';

    return (
        <div className="pb-8">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-[var(--color-bg-primary)] sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">VacaVerse</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">Welcome back, {displayName}!</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-brand-teal">
                    {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-white font-bold">{displayName.charAt(0).toUpperCase()}</span>
                    )}
                </div>
            </div>

            <div className="px-4 mt-4">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-48 bg-gray-800/50 rounded-2xl" />
                        <div className="h-4 bg-gray-800/50 rounded w-3/4" />
                    </div>
                ) : upcomingTrip ? (
                    <div>
                        <h2 className="text-lg font-semibold text-brand-teal mb-3">Next Trip</h2>
                        <Link to={`/trips/${upcomingTrip.id}`}>
                            <div className="bg-[var(--color-bg-card)] rounded-2xl overflow-hidden border border-[var(--color-border)]">
                                <div className="relative h-48">
                                    <img src={upcomingTrip.image} alt={upcomingTrip.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-xl font-bold text-white">{upcomingTrip.title}</h3>
                                        <p className="text-sm text-gray-300">
                                            {format(parseISO(upcomingTrip.start_date), 'MMM d')} - {format(parseISO(upcomingTrip.end_date), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-brand-teal">
                                            {differenceInDays(parseISO(upcomingTrip.start_date), new Date())}
                                        </div>
                                        <div className="text-xs text-[var(--color-text-secondary)]">days to go</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                                            ${upcomingTrip.budget?.toLocaleString() || '0'}
                                        </div>
                                        <div className="text-xs text-[var(--color-text-secondary)]">budget</div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Briefcase size={48} className="text-gray-600 mb-4" />
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No upcoming trips</h2>
                        <p className="text-[var(--color-text-secondary)] mb-6">Start planning your next family adventure!</p>
                        <Link to="/trips" className="px-6 py-3 bg-brand-teal text-white rounded-lg font-bold">
                            Plan a Trip
                        </Link>
                    </div>
                )}
            </div>

            {/* FAB */}
            <Link to="/trips" className="fixed bottom-20 right-4 w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg text-black hover:bg-yellow-500 transition-colors">
                <Plus size={32} />
            </Link>
        </div>
    );
}
