import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { useFamily } from '../contexts/FamilyContext';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Users } from 'lucide-react';
import { Panel } from '../components/ui/Concourse';
import { isNewAccount } from '../lib/account';

export default function Home() {
    const { user } = useAuth();
    const { trips, loading } = useTrip();
    const { families, loading: familiesLoading } = useFamily();

    const upcomingTrip = trips
        .filter(t => differenceInDays(parseISO(t.start_date), new Date()) > 0)
        .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime())[0];

    const displayName = user?.display_name || user?.email?.split('@')[0] || 'Traveler';
    const greeting = user && isNewAccount(user.created_at, new Date())
        ? `Welcome, ${displayName}`
        : `Welcome back, ${displayName}`;

    return (
        <div className="pb-8">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-[var(--color-bg-primary)] sticky top-0 z-10">
                <div>
                    <h1 className="cx-h1 text-[var(--color-text-primary)]">{greeting}</h1>
                    <p className="cx-label text-[11px] text-brand-teal mt-0.5">VacaVerse</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden border-2 border-brand-teal shrink-0">
                    {user?.photo_url ? (
                        <img src={user.photo_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[var(--color-text-primary)] font-bold">{displayName.charAt(0).toUpperCase()}</span>
                    )}
                </div>
            </div>

            {/* Either order (trip-first or family-first) is fine — this is the
                bridge between them, not a gate: a nudge, not a block. */}
            {!familiesLoading && families.length === 0 && (
                <div className="px-4 pt-4">
                    <Link to="/family">
                        <Panel className="p-3 flex items-center gap-3 hover:border-brand-teal/50 transition-colors">
                            <div className="w-9 h-9 rounded-full bg-brand-teal/15 text-brand-teal flex items-center justify-center shrink-0">
                                <Users size={18} />
                            </div>
                            <div className="text-sm text-[var(--color-text-secondary)]">
                                Bring your family in — create or join a family to plan trips together.
                            </div>
                        </Panel>
                    </Link>
                </div>
            )}

            <div className="px-4 mt-4">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-48 bg-[var(--color-bg-secondary)] rounded-2xl" />
                        <div className="h-4 bg-[var(--color-bg-secondary)] rounded w-3/4" />
                    </div>
                ) : upcomingTrip ? (
                    <div>
                        <h2 className="cx-label text-xs text-[var(--color-text-muted)] mb-3">Next Trip</h2>
                        <Link to={`/trips/${upcomingTrip.id}`}>
                            <Panel raked className="overflow-hidden">
                                <div className="relative h-48">
                                    <img src={upcomingTrip.image} alt={upcomingTrip.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-carbon)] via-[var(--color-carbon)]/10 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="cx-h2 text-[var(--color-ivory)]">{upcomingTrip.title}</h3>
                                        <p className="text-sm text-[var(--color-ivory)]/70">
                                            {format(parseISO(upcomingTrip.start_date), 'MMM d')} – {format(parseISO(upcomingTrip.end_date), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-brand-teal tabular-nums">
                                            {differenceInDays(parseISO(upcomingTrip.start_date), new Date())}
                                        </div>
                                        <div className="cx-label text-[11px] text-[var(--color-text-muted)]">days to go</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
                                            ${upcomingTrip.budget?.toLocaleString() || '0'}
                                        </div>
                                        <div className="cx-label text-[11px] text-[var(--color-text-muted)]">budget</div>
                                    </div>
                                </div>
                            </Panel>
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Briefcase size={48} className="text-[var(--color-text-muted)] mb-4" />
                        <h2 className="cx-h2 text-[var(--color-text-primary)] mb-2">No upcoming trips</h2>
                        <p className="text-[var(--color-text-secondary)] mb-6">Start planning your next family adventure!</p>
                    </div>
                )}
            </div>

            {/* FAB — the sole "plan a trip" action; avoid duplicating it inline */}
            <Link
                to="/trips"
                className="fixed bottom-20 right-4 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-[var(--color-carbon)] hover:brightness-110 transition-all cx-lit"
                aria-label="Plan a trip"
            >
                <Plus size={32} />
            </Link>
        </div>
    );
}
