import { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { subscribeToActivity, subscribeToComments, addComment } from '../../services/activityService';
import { Send, MessageCircle, Activity } from 'lucide-react';
import type { Trip, ActivityEntry, Comment } from '../../types';

export default function TripFeed() {
    const { trip } = useOutletContext<{ trip: Trip }>();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'activity' | 'comments'>('comments');
    const [activity, setActivity] = useState<ActivityEntry[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Collect all user IDs for profile resolution
    const userIds = useMemo(() => {
        const ids = new Set<string>();
        activity.forEach(a => ids.add(a.userId));
        comments.forEach(c => ids.add(c.userId));
        return Array.from(ids);
    }, [activity, comments]);

    const { profiles } = useUserProfiles(userIds);

    useEffect(() => {
        if (!trip?.id) return;
        const unsub1 = subscribeToActivity(trip.id, setActivity);
        const unsub2 = subscribeToComments(trip.id, setComments);
        return () => { unsub1(); unsub2(); };
    }, [trip?.id]);

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments.length]);

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trip?.id || !user || !newComment.trim()) return;
        setSending(true);
        try {
            await addComment(trip.id, user.uid, newComment.trim());
            setNewComment('');
        } catch (error) {
            console.error('Failed to send comment:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
        <div className="px-4 pb-24 flex flex-col" style={{ height: 'calc(100vh - 300px)' }}>
            {/* Tab toggles */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeTab === 'comments'
                            ? 'bg-brand-teal text-white'
                            : 'bg-[#1e293b] text-gray-400 border border-gray-800'
                    }`}
                >
                    <MessageCircle size={14} />
                    Comments ({comments.length})
                </button>
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeTab === 'activity'
                            ? 'bg-brand-teal text-white'
                            : 'bg-[#1e293b] text-gray-400 border border-gray-800'
                    }`}
                >
                    <Activity size={14} />
                    Activity ({activity.length})
                </button>
            </div>

            {activeTab === 'comments' ? (
                /* Comments section */
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                        {comments.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No comments yet. Start the conversation!</p>
                            </div>
                        ) : (
                            comments.map(comment => {
                                const profile = profiles.get(comment.userId);
                                const isMe = comment.userId === user?.uid;
                                return (
                                    <div key={comment.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                            {profile?.photoURL ? (
                                                <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white text-xs font-bold">
                                                    {(profile?.displayName?.[0] ?? '?').toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`max-w-[75%] ${isMe ? 'items-end' : ''}`}>
                                            <div className={`rounded-2xl px-4 py-2 ${
                                                isMe ? 'bg-brand-teal text-white' : 'bg-[#1e293b] text-white border border-gray-800'
                                            }`}>
                                                {!isMe && (
                                                    <div className="text-xs font-medium text-brand-teal mb-1">
                                                        {profile?.displayName ?? 'Unknown'}
                                                    </div>
                                                )}
                                                <p className="text-sm">{comment.text}</p>
                                            </div>
                                            <div className={`text-xs text-gray-500 mt-1 ${isMe ? 'text-right' : ''}`}>
                                                {formatTime(comment.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={commentsEndRef} />
                    </div>

                    {/* Comment input */}
                    <form onSubmit={handleSendComment} className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-[#1e293b] border border-gray-700 rounded-full px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-teal"
                        />
                        <button
                            type="submit"
                            disabled={sending || !newComment.trim()}
                            className="w-12 h-12 bg-brand-teal rounded-full flex items-center justify-center text-white disabled:opacity-50 shrink-0"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            ) : (
                /* Activity section */
                <div className="flex-1 overflow-y-auto space-y-3">
                    {activity.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Activity size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No activity yet. Start planning!</p>
                        </div>
                    ) : (
                        activity.map(entry => {
                            const profile = profiles.get(entry.userId);
                            return (
                                <div key={entry.id} className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                                        {profile?.photoURL ? (
                                            <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-xs font-bold">
                                                {(profile?.displayName?.[0] ?? '?').toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-300">
                                            <span className="font-medium text-white">{profile?.displayName ?? 'Someone'}</span>
                                            {' '}{entry.action}
                                        </p>
                                        {entry.detail && (
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.detail}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-600 shrink-0">{formatTime(entry.createdAt)}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
