import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { lookupInviteCode } from '../services/inviteService';
import { useToast } from '../contexts/ToastContext';
import { db } from '../lib/client';
import { Users, Loader2, PartyPopper } from 'lucide-react';

export default function Join() {
    const { user, signInWithEmail, signUpWithEmail } = useAuth();
    const { setCurrentFamily, joinFamily } = useFamily();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [code, setCode] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [joinLoading, setJoinLoading] = useState(false);
    const [found, setFound] = useState<{ familyId: string; familyName: string; inviteId: string } | null>(null);

    // Inline sign-up/sign-in, so a brand-new person never loses the invite by
    // bouncing to a separate page.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(true);
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [autoJoin, setAutoJoin] = useState(false);

    const performLookup = async (rawCode: string) => {
        const trimmed = rawCode.trim();
        if (!trimmed) return;
        setLookupLoading(true);
        try {
            const result = await lookupInviteCode(trimmed);
            if (result) {
                setFound(result);
            } else {
                showToast('Invalid or expired invite code', 'error');
            }
        } catch (error) {
            showToast('Failed to look up invite code', 'error');
        } finally {
            setLookupLoading(false);
        }
    };

    // A shared invite link (e.g. /join?code=ABC123) should look itself up
    // automatically instead of making the new person retype the code.
    useEffect(() => {
        const fromLink = searchParams.get('code');
        if (fromLink) {
            const normalized = fromLink.toUpperCase();
            setCode(normalized);
            performLookup(normalized);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        await performLookup(code);
    };

    const handleJoin = async () => {
        if (!found || !user) return;
        setJoinLoading(true);
        try {
            try {
                await joinFamily(found.familyId);
            } catch (error) {
                // Already a member (e.g. they joined via an earlier click of this
                // same link) — treat that as success rather than an error.
                const message = error instanceof Error ? error.message : '';
                if (!message.includes('UNIQUE constraint failed')) throw error;
            }

            // Pull the real member list so the Family page doesn't show the
            // newly-selected family with zero members (including themselves).
            const { data: memberRows } = await db
                .from('family_members')
                .select('*')
                .eq('family_id', found.familyId);
            const memberIds = (memberRows ?? []).map((m: { user_id: string }) => m.user_id);
            setCurrentFamily({ id: found.familyId, name: found.familyName, created_by: '', created_at: '', members: memberIds });

            // Send them straight into a real trip when the family has one, so
            // they land somewhere with context instead of an empty dashboard.
            const { data: familyTrips } = await db
                .from('trips')
                .select('*')
                .eq('family_id', found.familyId)
                .order('created_at', { ascending: false });

            if (familyTrips && familyTrips.length > 0) {
                const trip = familyTrips[0];
                showToast(`Welcome to ${found.familyName}! Say hi in the Feed or check Tasks to see what's next.`, 'success');
                navigate(`/trips/${trip.id}`);
            } else {
                showToast(`Welcome to ${found.familyName}! No trips planned yet — start one to get going.`, 'success');
                navigate('/trips');
            }
        } catch (error) {
            showToast('Failed to join family', 'error');
        } finally {
            setJoinLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setAuthLoading(true);
        try {
            if (isSignUp) {
                await signUpWithEmail(email, password);
            } else {
                await signInWithEmail(email, password);
            }
            setAutoJoin(true);
        } catch (err: unknown) {
            setAuthError(err instanceof Error ? err.message : 'Failed to authenticate');
        } finally {
            setAuthLoading(false);
        }
    };

    // Once sign-up/sign-in succeeds, finish the join automatically.
    useEffect(() => {
        if (autoJoin && user && found) {
            setAutoJoin(false);
            handleJoin();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoJoin, user, found]);

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Users size={48} className="text-brand-teal mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white">Join a Family</h1>
                    <p className="text-gray-400 mt-2">Enter the invite code shared by your family member</p>
                </div>

                {!found ? (
                    <form onSubmit={handleLookup} className="space-y-4">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            className="w-full bg-[#1e293b] border border-gray-700 rounded-xl p-4 text-white text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-brand-teal uppercase"
                            required
                        />
                        <button
                            type="submit"
                            disabled={lookupLoading || code.length < 6}
                            className="w-full bg-brand-teal text-white font-bold py-4 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
                        >
                            {lookupLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Look Up Code'}
                        </button>
                    </form>
                ) : user ? (
                    <div className="bg-[#1e293b] rounded-2xl p-6 border border-gray-800 text-center">
                        <PartyPopper size={32} className="text-brand-teal mx-auto mb-3" />
                        <h2 className="text-xl font-bold text-white mb-2">{found.familyName}</h2>
                        <p className="text-gray-400 mb-6">Would you like to join this family group?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setFound(null)}
                                className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleJoin}
                                disabled={joinLoading}
                                className="flex-1 bg-brand-teal text-white font-bold py-3 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
                            >
                                {joinLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Join Family'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#1e293b] rounded-2xl p-6 border border-gray-800">
                        <div className="text-center mb-6">
                            <PartyPopper size={32} className="text-brand-teal mx-auto mb-3" />
                            <h2 className="text-xl font-bold text-white mb-1">You're invited to {found.familyName}</h2>
                            <p className="text-gray-400 text-sm">
                                {isSignUp ? 'Create an account to join and start planning together.' : 'Sign in to join the family.'}
                            </p>
                        </div>

                        <form onSubmit={handleEmailAuth} className="space-y-3">
                            {authError && <div className="bg-red-500/20 text-red-200 p-2 rounded text-sm">{authError}</div>}
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 rounded-lg bg-[#0f172a] text-white border border-gray-700 focus:outline-none focus:border-brand-teal"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 rounded-lg bg-[#0f172a] text-white border border-gray-700 focus:outline-none focus:border-brand-teal"
                                required
                            />
                            <button
                                type="submit"
                                disabled={authLoading || joinLoading}
                                className="w-full bg-brand-teal text-white font-bold py-3 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
                            >
                                {authLoading || joinLoading ? (
                                    <Loader2 className="animate-spin mx-auto" />
                                ) : isSignUp ? (
                                    'Create Account & Join'
                                ) : (
                                    'Sign In & Join'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
                                className="w-full text-gray-400 text-sm hover:text-white transition-colors"
                            >
                                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                            </button>
                        </form>

                        <button
                            onClick={() => setFound(null)}
                            className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            Wrong code? Start over
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
