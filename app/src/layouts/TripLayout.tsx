import { Outlet, NavLink, Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Share2, Copy, Check } from 'lucide-react';
import { useTrip } from '../contexts/TripContext';
import { useEffect, useMemo, useState } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { updateTrip } from '../services/tripService';
import { db } from '../lib/client';
import { useUserProfiles } from '../hooks/useUserProfiles';

const tabs = [
    { name: 'Itinerary', path: '' },
    { name: 'Budget', path: 'budget' },
    { name: 'Tasks', path: 'tasks' },
    { name: 'Feed', path: 'feed' },
    { name: 'Notes', path: 'notes' },
    { name: 'Search', path: 'search' },
    { name: 'Files', path: 'documents' },
    { name: 'Polls', path: 'polls' },
];

export default function TripLayout() {
    const { tripId } = useParams<{ tripId: string }>();
    const { trips, loading } = useTrip();
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [sharingLoading, setSharingLoading] = useState(false);

    const trip = useMemo(() => trips.find(t => t.id === tripId), [trips, tripId]);

    // Who else is in this trip's family, so a new joiner's first screen answers
    // "who else is here" rather than showing an empty-feeling shell. Queried
    // directly off trip.family_id (not FamilyContext.currentFamily) so it stays
    // correct even when currentFamily hasn't been set for this session yet.
    const [familyMemberIds, setFamilyMemberIds] = useState<string[]>([]);
    useEffect(() => {
        if (!trip?.family_id) { setFamilyMemberIds([]); return; }
        let cancelled = false;
        db.from('family_members')
            .select('user_id')
            .eq('family_id', trip.family_id)
            .then(({ data }: { data: { user_id: string }[] | null }) => {
                if (!cancelled) setFamilyMemberIds((data || []).map(m => m.user_id));
            });
        return () => { cancelled = true; };
    }, [trip?.family_id]);
    const { profiles } = useUserProfiles(familyMemberIds);

    const handleShare = async () => {
        if (!trip || !tripId) return;

        let token = trip.share_token;

        if (!token) {
            setSharingLoading(true);
            try {
                token = crypto.randomUUID().slice(0, 12);
                await updateTrip(tripId, { share_token: token });
                // Optimistically update local state via the token reference
            } catch (error) {
                console.error('Error generating share token:', error);
                setSharingLoading(false);
                return;
            }
            setSharingLoading(false);
        }

        const url = `${window.location.origin}/trip/preview/${token}`;
        setShareUrl(url);
        setShowSharePopup(true);
    };

    const handleCopy = async () => {
        if (!shareUrl) return;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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

    const daysAway = differenceInDays(parseISO(trip.start_date), new Date());

    return (
        <div className="pb-8 min-h-screen bg-[var(--color-bg-primary)]">
            {/* Header with Background */}
            <div className="relative h-48 bg-gradient-to-b from-gray-800 to-[var(--color-bg-primary)]">
                <Link to="/trips" className="absolute top-4 left-4 p-2 bg-black/30 rounded-full z-20">
                    <ArrowLeft size={24} className="text-white" />
                </Link>
                <button
                    onClick={handleShare}
                    disabled={sharingLoading}
                    className="absolute top-4 right-4 p-2 bg-black/30 rounded-full z-20 disabled:opacity-50"
                    aria-label="Share trip"
                >
                    {sharingLoading
                        ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Share2 size={24} className="text-white" />
                    }
                </button>
                {trip.image && (
                    <img src={trip.image} alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />
                )}
                <div className="absolute bottom-6 left-4 right-4 z-10">
                    <h1 className="text-2xl font-bold text-white">{trip.title}</h1>
                    <p className="text-gray-300 text-sm flex items-center gap-2 mt-1">
                        <Calendar size={16} />
                        {format(parseISO(trip.start_date), 'MMM d')} - {format(parseISO(trip.end_date), 'MMM d, yyyy')} •{' '}
                        {daysAway > 0 ? `${daysAway} days to go` : 'In progress'}
                    </p>
                </div>
            </div>

            {/* Family Roster — answers "who else is here" on the very first screen */}
            {familyMemberIds.length > 0 && (
                <div className="px-4 pt-4">
                    <div className="bg-[var(--color-bg-card)] rounded-xl p-3 border border-[var(--color-border)] flex items-center gap-3">
                        <div className="flex -space-x-2 shrink-0">
                            {familyMemberIds.slice(0, 5).map(uid => {
                                const profile = profiles.get(uid);
                                return (
                                    <div
                                        key={uid}
                                        title={profile?.display_name}
                                        className="w-8 h-8 rounded-full bg-gray-700 border-2 border-[var(--color-bg-card)] flex items-center justify-center overflow-hidden"
                                    >
                                        {profile?.photo_url ? (
                                            <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-xs font-bold">
                                                {(profile?.display_name || '?').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                            {familyMemberIds.length > 5 && (
                                <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-[var(--color-bg-card)] flex items-center justify-center">
                                    <span className="text-white text-[10px] font-bold">+{familyMemberIds.length - 5}</span>
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)] truncate">
                            {familyMemberIds.length === 1 ? (
                                "Just you so far — share an invite to bring the family in"
                            ) : (
                                <>
                                    {familyMemberIds
                                        .slice(0, 3)
                                        .map(uid => profiles.get(uid)?.display_name?.split(' ')[0] || 'Someone')
                                        .join(', ')}
                                    {familyMemberIds.length > 3 ? ` +${familyMemberIds.length - 3} more` : ''} in this trip
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Share Popup */}
            {showSharePopup && shareUrl && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50" onClick={() => setShowSharePopup(false)}>
                    <div
                        className="bg-[var(--color-bg-card)] rounded-2xl p-6 w-full max-w-md border border-[var(--color-border)]"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Share Trip</h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                            Anyone with this link can view the itinerary without signing in.
                        </p>
                        <div className="flex items-center gap-2 bg-[var(--color-bg-primary)] rounded-xl p-3 border border-[var(--color-border)]">
                            <span className="text-xs text-[var(--color-text-secondary)] flex-1 truncate">{shareUrl}</span>
                            <button
                                onClick={handleCopy}
                                className="shrink-0 p-2 rounded-lg bg-brand-teal text-white"
                                aria-label="Copy link"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        {copied && (
                            <p className="text-xs text-brand-teal mt-2 text-center">Link copied!</p>
                        )}
                        <button
                            onClick={() => setShowSharePopup(false)}
                            className="mt-4 w-full py-2 text-sm text-[var(--color-text-secondary)]"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

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
