import { Outlet, Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Share2, Copy, Check } from 'lucide-react';
import { useTrip } from '../contexts/TripContext';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useEffect, useMemo, useState } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { updateTrip } from '../services/tripService';
import { db } from '../lib/client';
import { classifyTripAccess, type TripAccessResult } from '../lib/tripAccess';
import { useUserProfiles } from '../hooks/useUserProfiles';
import { Panel } from '../components/ui/Concourse';
import { Sheet } from '../components/ui/Sheet';
import { TripTabs } from '../components/TripTabs';

// BottomNav is always the app-wide 4 (Home/Family/Trips/Profile), even
// inside a trip — TripTabs below is the in-trip navigation instead,
// icon-only so all 8 destinations fit one row on a 390px viewport.

export default function TripLayout() {
    const { tripId } = useParams<{ tripId: string }>();
    const { trips, loading, refetch } = useTrip();
    const { user } = useAuth();
    const { families } = useFamily();
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [sharingLoading, setSharingLoading] = useState(false);

    const trip = useMemo(() => trips.find(t => t.id === tripId), [trips, tripId]);

    // The trip list this user can see is refetched whenever `families`
    // changes, but that refetch is async — a trip can legitimately belong to
    // this user (fresh join, fresh creation) while `trips` is still catching
    // up. Resolve that ambiguity with a direct-by-id check instead of
    // showing a bare "not found" for what's really a loading state.
    const [accessCheck, setAccessCheck] = useState<TripAccessResult | 'checking' | null>(null);
    useEffect(() => {
        if (loading || trip || !tripId || !user) { setAccessCheck(null); return; }
        let cancelled = false;
        let retried = false;
        setAccessCheck('checking');

        const check = async () => {
            const { data: rows } = await db.from('trips').eq('id', tripId).select('*');
            if (cancelled) return;
            const row = rows?.[0] ?? null;
            const result = classifyTripAccess(row, user.id, families.map(f => f.id));
            if (result === 'has-access' && !retried) {
                // Membership/ownership is real but the shared trip list hasn't
                // caught up yet — trigger a refetch and give it one more pass
                // before falling back to treating it as resolved.
                retried = true;
                await refetch();
                if (!cancelled) check();
                return;
            }
            setAccessCheck(result === 'has-access' ? 'checking' : result);
        };
        check();

        return () => { cancelled = true; };
        // families.length (not the full families array — its reference
        // changes on every FamilyContext fetch, which would re-run this on
        // every render) so a denied verdict can recover if the user is
        // added to the owning family while this page stays mounted.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, trip, tripId, user, families.length]);

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

    // Trips created before a family existed (or before this ticket) have no
    // family_id, and there was previously no way to fix that after the
    // fact — see issue #3. Owner-only: attaching a trip to a family grants
    // every member of that family access to it.
    const [attachingFamilyId, setAttachingFamilyId] = useState<string | null>(null);
    const handleAttachFamily = async (familyId: string) => {
        if (!tripId) return;
        setAttachingFamilyId(familyId);
        try {
            await updateTrip(tripId, { family_id: familyId });
            await refetch();
        } catch (error) {
            console.error('Failed to attach trip to family:', error);
        } finally {
            setAttachingFamilyId(null);
        }
    };

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

    if (loading || accessCheck === 'checking' || (accessCheck === null && !trip && !!tripId && !!user)) {
        return (
            <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[var(--color-text-secondary)] mt-4">Loading trip...</p>
            </div>
        );
    }

    if (!trip) {
        const denied = accessCheck === 'denied';
        return (
            <div className="p-8 text-center">
                <p className="text-[var(--color-text-secondary)]">
                    {denied ? "You don't have access to this trip" : 'Trip not found'}
                </p>
                {denied && (
                    <p className="text-[var(--color-text-muted)] text-sm mt-2">
                        Ask whoever created it to add you to the trip's family.
                    </p>
                )}
                <Link to="/trips" className="text-brand-teal mt-4 inline-block font-semibold">Back to Trips</Link>
            </div>
        );
    }

    const daysAway = differenceInDays(parseISO(trip.start_date), new Date());

    return (
        <div className="pb-8 min-h-screen bg-[var(--color-bg-primary)]">
            {/* Hero — the trip's own lit slide, raked at the bottom edge */}
            <div className="relative h-52 bg-[var(--color-carbon)] cx-rake-b overflow-hidden">
                <div className="absolute inset-0 bg-[image:linear-gradient(160deg,_var(--color-carbon),_#2a1f10_70%)]" />
                <Link to="/trips" className="absolute top-4 left-4 p-2 bg-black/40 rounded-full z-20 backdrop-blur-sm">
                    <ArrowLeft size={22} className="text-[var(--color-ivory)]" />
                </Link>
                <button
                    onClick={handleShare}
                    disabled={sharingLoading}
                    className="absolute top-4 right-4 p-2 bg-black/40 rounded-full z-20 disabled:opacity-50 backdrop-blur-sm"
                    aria-label="Share trip"
                >
                    {sharingLoading
                        ? <div className="w-5 h-5 border-2 border-[var(--color-ivory)] border-t-transparent rounded-full animate-spin" />
                        : <Share2 size={22} className="text-[var(--color-ivory)]" />
                    }
                </button>
                {trip.image && (
                    <img src={trip.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity" />
                )}
                {/* Scrim dedicated to the title band, independent of the hero's base
                    gradient — guarantees contrast even when a bright photo region
                    (sky, snow) sits directly behind the title on tall trip names. */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--color-carbon)] via-[var(--color-carbon)]/75 to-transparent" />
                <div className="absolute bottom-8 left-4 right-4 z-10">
                    <h1 className="cx-h1 text-[2rem] text-[var(--color-ivory)] leading-tight" style={{ textShadow: '0 2px 12px rgb(0 0 0 / 0.45)' }}>{trip.title}</h1>
                    <p className="text-[var(--color-ivory)]/80 text-sm flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1.5 tabular-nums">
                            <Calendar size={15} />
                            {format(parseISO(trip.start_date), 'MMM d')} – {format(parseISO(trip.end_date), 'MMM d, yyyy')}
                        </span>
                        <span className="cx-label text-[11px] text-brand-teal">
                            {daysAway > 0 ? `${daysAway} days to departure` : 'Trip in progress'}
                        </span>
                    </p>
                </div>
            </div>

            {/* Family Roster — answers "who else is here" on the very first screen */}
            {familyMemberIds.length > 0 && (
                <div className="px-4 -mt-3 relative z-10">
                    <Panel className="p-3 flex items-center gap-3">
                        <div className="flex -space-x-2 shrink-0">
                            {familyMemberIds.slice(0, 5).map(uid => {
                                const profile = profiles.get(uid);
                                return (
                                    <div
                                        key={uid}
                                        title={profile?.display_name}
                                        className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] border-2 border-[var(--color-bg-card)] flex items-center justify-center overflow-hidden"
                                    >
                                        {profile?.photo_url ? (
                                            <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[var(--color-text-primary)] text-xs font-bold">
                                                {(profile?.display_name || '?').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                            {familyMemberIds.length > 5 && (
                                <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] border-2 border-[var(--color-bg-card)] flex items-center justify-center">
                                    <span className="text-[var(--color-text-primary)] text-[10px] font-bold">+{familyMemberIds.length - 5}</span>
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
                    </Panel>
                </div>
            )}

            {/* Attach-to-family prompt — trips can go without one (e.g. before any
                family existed); this is the "fix it after the fact" path from #3. */}
            {!trip.family_id && user?.id === trip.user_id && families.length > 0 && (
                <div className="px-4 -mt-3 relative z-10">
                    <Panel className="p-3 flex items-center gap-3 flex-wrap">
                        <div className="text-sm text-[var(--color-text-secondary)] flex-1 min-w-[180px]">
                            This trip isn't attached to a family yet — the rest of the family can't see it.
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {families.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => handleAttachFamily(f.id)}
                                    disabled={attachingFamilyId !== null}
                                    className="cx-label text-xs px-3 py-2 rounded-lg bg-brand-teal text-[var(--color-carbon)] disabled:opacity-50"
                                >
                                    {attachingFamilyId === f.id ? 'Attaching…' : `Attach to ${f.name}`}
                                </button>
                            ))}
                        </div>
                    </Panel>
                </div>
            )}

            {/* Share Popup */}
            <Sheet open={showSharePopup && !!shareUrl} onOpenChange={setShowSharePopup} variant="bottom" title="Share Trip">
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    Anyone with this link can view the itinerary without signing in.
                </p>
                <div className="flex items-center gap-2 bg-[var(--color-bg-primary)] rounded-xl p-3 border border-[var(--color-border)]">
                    <span className="text-xs text-[var(--color-text-secondary)] flex-1 truncate">{shareUrl}</span>
                    <button
                        onClick={handleCopy}
                        className="shrink-0 p-2 rounded-lg bg-brand-teal text-[var(--color-carbon)]"
                        aria-label="Copy link"
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
                {copied && (
                    <p className="text-xs text-brand-teal mt-2 text-center font-semibold">Link copied!</p>
                )}
            </Sheet>

            {/* Stats Summary Row */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <Panel className="p-3 text-center">
                    <div className="cx-label text-[11px] text-[var(--color-text-muted)] mb-1">Budget</div>
                    <div className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">${trip.budget?.toLocaleString() || '0'}</div>
                </Panel>
                <Panel className="p-3 text-center">
                    <div className="cx-label text-[11px] text-[var(--color-text-muted)] mb-1">Days Away</div>
                    <div className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
                        {daysAway > 0 ? daysAway : 'In progress'}
                    </div>
                </Panel>
            </div>

            {/* Trip Tabs — icon-only in-trip navigation (mobile only; Sidebar covers desktop) */}
            <div className="px-4 pt-4">
                <TripTabs tripId={trip.id} />
            </div>

            {/* Content Area */}
            <div className="pt-4">
                <Outlet context={{ trip }} />
            </div>
        </div>
    );
}
