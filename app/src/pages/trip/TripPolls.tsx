import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { db } from '../../lib/client';
import { addTripItem, getTripItems } from '../../services/tripService';
import { Plus, X, BarChart2, Check } from 'lucide-react';
import { Panel, Button, EmptyState } from '../../components/ui/Concourse';
import type { Trip, Poll, PollVote } from '../../types';

export default function TripPolls() {
    const { trip } = useOutletContext<{ trip: Trip }>();
    const { user } = useAuth();

    const [polls, setPolls] = useState<Poll[]>([]);
    const [votes, setVotes] = useState<PollVote[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [submitting, setSubmitting] = useState(false);

    // Collect all user IDs for profile resolution
    const userIds = useMemo(() => {
        const ids = new Set<string>();
        polls.forEach(p => ids.add(p.created_by));
        return Array.from(ids);
    }, [polls]);

    const { profiles } = useUserProfiles(userIds);

    useEffect(() => {
        if (!trip?.id) return;
        fetchPollsAndVotes();
    }, [trip?.id]);

    const fetchPollsAndVotes = async () => {
        try {
            const pollData = await getTripItems<Poll>('polls', trip.id, 'created_at');
            // Sort descending by created_at
            pollData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setPolls(pollData);

            if (pollData.length > 0) {
                const pollIds = pollData.map(p => p.id);
                const { data: voteData, error } = await db
                    .from('poll_votes')
                    .select('*')
                    .in('poll_id', pollIds);
                if (!error) {
                    setVotes(voteData || []);
                }
            }
        } catch (error) {
            console.error('Failed to load polls:', error);
        }
    };

    const handleVote = async (poll: Poll, optionIndex: number) => {
        if (!user) return;
        const myVote = votes.find(v => v.poll_id === poll.id && v.user_id === user.id);
        if (myVote?.option_index === optionIndex) return;

        // Optimistic update
        setVotes(prev => {
            const filtered = prev.filter(v => !(v.poll_id === poll.id && v.user_id === user.id));
            return [...filtered, { poll_id: poll.id, user_id: user.id, option_index: optionIndex }];
        });

        try {
            const { error } = await db
                .from('poll_votes')
                .upsert({ poll_id: poll.id, user_id: user.id, option_index: optionIndex });
            if (error) throw error;
        } catch (error) {
            console.error('Failed to vote:', error);
            fetchPollsAndVotes();
        }
    };

    const handleAddOption = () => {
        if (options.length < 4) {
            setOptions([...options, '']);
        }
    };

    const handleRemoveOption = (index: number) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleOptionChange = (index: number, value: string) => {
        const updated = [...options];
        updated[index] = value;
        setOptions(updated);
    };

    const handleCreatePoll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !question.trim()) return;
        const validOptions = options.filter(o => o.trim());
        if (validOptions.length < 2) return;

        setSubmitting(true);
        try {
            await addTripItem('polls', {
                trip_id: trip.id,
                question: question.trim(),
                options: validOptions,
                created_by: user.id,
            } as Record<string, unknown>);
            setQuestion('');
            setOptions(['', '']);
            setShowModal(false);
            fetchPollsAndVotes();
        } catch (error) {
            console.error('Failed to create poll:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const resetModal = () => {
        setQuestion('');
        setOptions(['', '']);
        setShowModal(false);
    };

    const formatTime = (timestamp: string) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="px-4 pb-24">
            <h2 className="cx-h2 text-[var(--color-text-primary)] mb-6">Polls</h2>

            {polls.length === 0 ? (
                <EmptyState
                    icon={<BarChart2 size={48} />}
                    title="No polls yet"
                    hint='Create a poll to vote on trip decisions with your family — e.g. "Boat tour or zip line?"'
                    action={
                        <button onClick={() => setShowModal(true)} className="text-brand-teal font-bold hover:underline">
                            Create the first poll
                        </button>
                    }
                />
            ) : (
                <div className="space-y-4">
                    {polls.map(poll => {
                        const pollVotes = votes.filter(v => v.poll_id === poll.id);
                        const totalVotes = pollVotes.length;
                        const myVote = user ? pollVotes.find(v => v.user_id === user.id)?.option_index : undefined;
                        const profile = profiles.get(poll.created_by);
                        const voteCounts = poll.options.map((_, i) =>
                            pollVotes.filter(v => v.option_index === i).length
                        );
                        const maxVotes = Math.max(...voteCounts, 1);

                        return (
                            <Panel key={poll.id} className="p-4">
                                <p className="text-[var(--color-text-primary)] font-semibold text-base mb-1">{poll.question}</p>
                                <p className="text-xs text-[var(--color-text-muted)] mb-4">
                                    Asked by {profile?.display_name ?? 'Someone'} · {formatTime(poll.created_at)} · {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                                </p>

                                <div className="space-y-2">
                                    {poll.options.map((option, index) => {
                                        const count = voteCounts[index];
                                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                        const isMyVote = myVote === index;
                                        const isWinning = count === maxVotes && count > 0;

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleVote(poll, index)}
                                                className={`w-full text-left relative overflow-hidden rounded-xl border transition-colors ${isMyVote ? 'border-brand-teal' : 'border-[var(--color-border)]'
                                                    }`}
                                            >
                                                {/* Background bar — flat fill, no gradient */}
                                                <div
                                                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${isMyVote
                                                            ? 'bg-brand-teal/25'
                                                            : isWinning
                                                                ? 'bg-brand-teal/10'
                                                                : 'bg-[var(--color-bg-secondary)]'
                                                        }`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                                <div className="relative flex items-center justify-between px-3 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        {isMyVote && (
                                                            <Check size={14} className="text-brand-teal shrink-0" />
                                                        )}
                                                        <span className={`text-sm ${isMyVote ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)]'}`}>
                                                            {option}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                                        <span className={`text-xs font-medium ${isMyVote ? 'text-brand-teal' : 'text-[var(--color-text-muted)]'} tabular-nums`}>
                                                            {count} {count === 1 ? 'vote' : 'votes'}
                                                        </span>
                                                        <span className={`text-xs ${isMyVote ? 'text-brand-teal' : 'text-[var(--color-text-muted)]'} tabular-nums`}>
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Panel>
                        );
                    })}
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => setShowModal(true)}
                className="cx-lit fixed bottom-24 right-6 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-[var(--color-carbon)]"
                aria-label="Create poll"
            >
                <Plus size={24} />
            </button>

            {/* Create Poll Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60"
                    onClick={resetModal}
                >
                    <Panel
                        className="p-6 w-full max-w-md mb-2 max-h-[85vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Create Poll</h3>
                            <button onClick={resetModal} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePoll} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Question</label>
                                <input
                                    type="text"
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                    placeholder="e.g. Should we do the boat tour or zip line?"
                                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] text-base focus:outline-none focus:border-brand-teal"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Options</label>
                                <div className="space-y-2">
                                    {options.map((opt, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={e => handleOptionChange(index, e.target.value)}
                                                placeholder={`Option ${index + 1}`}
                                                className="flex-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] text-base focus:outline-none focus:border-brand-teal"
                                                required
                                            />
                                            {options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveOption(index)}
                                                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-vermilion)]"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {options.length < 4 && (
                                    <button
                                        type="button"
                                        onClick={handleAddOption}
                                        className="mt-2 text-sm text-brand-teal hover:opacity-80 flex items-center gap-1"
                                    >
                                        <Plus size={14} />
                                        Add Option
                                    </button>
                                )}
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                disabled={submitting || !question.trim() || options.filter(o => o.trim()).length < 2}
                            >
                                {submitting ? 'Creating...' : 'Create Poll'}
                            </Button>
                        </form>
                    </Panel>
                </div>
            )}
        </div>
    );
}
