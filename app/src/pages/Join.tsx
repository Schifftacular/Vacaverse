import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { lookupInviteCode, markInviteUsed } from '../services/inviteService';
import { useToast } from '../contexts/ToastContext';
import { Users, Loader2 } from 'lucide-react';

export default function Join() {
    const { user } = useAuth();
    const { joinFamily } = useFamily();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [found, setFound] = useState<{ familyId: string; familyName: string; inviteId: string } | null>(null);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setLoading(true);
        try {
            const result = await lookupInviteCode(code.trim());
            if (result) {
                setFound(result);
            } else {
                showToast('Invalid or expired invite code', 'error');
            }
        } catch (error) {
            showToast('Failed to look up invite code', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!found || !user) return;
        setLoading(true);
        try {
            await joinFamily(found.familyId);
            await markInviteUsed(found.inviteId);
            showToast(`Joined ${found.familyName}!`, 'success');
            navigate('/family');
        } catch (error) {
            showToast('Failed to join family', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 text-center">
                <Users size={48} className="text-gray-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Sign in to join a family</h2>
                <p className="text-gray-400 mb-4">You need an account to join a family group.</p>
                <a href="/profile" className="px-6 py-3 bg-brand-teal text-white rounded-lg font-bold">Sign In</a>
            </div>
        );
    }

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
                            disabled={loading || code.length < 6}
                            className="w-full bg-brand-teal text-white font-bold py-4 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Look Up Code'}
                        </button>
                    </form>
                ) : (
                    <div className="bg-[#1e293b] rounded-2xl p-6 border border-gray-800 text-center">
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
                                disabled={loading}
                                className="flex-1 bg-brand-teal text-white font-bold py-3 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Join Family'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
