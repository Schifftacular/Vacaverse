import { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import {
    subscribeToActivity,
    subscribeToComments,
    subscribeToPresence,
    subscribeToTyping,
    emitTypingStart,
    emitTypingStop,
    addComment,
    editComment,
    deleteComment,
    type PresenceUser,
    type TypingUser,
} from '../../services/activityService';
import { Send, MessageCircle, Activity, Pencil, Trash2, X, Check, ChevronDown, AlertCircle, Reply } from 'lucide-react';
import type { Trip, ActivityEntry, Comment } from '../../types';
import { ThreadPanel } from '../../components/ThreadPanel';
import { EmptyState } from '../../components/ui/Concourse';

// A comment that hasn't been confirmed by the server yet, rendered inline
// with real comments so sending feels instant.
export interface PendingComment {
    clientId: string;
    trip_id: string;
    user_id: string;
    text: string;
    created_at: string;
    status: 'sending' | 'error';
    parent_comment_id: string | null;
}

export type FeedComment = Comment & { _pending?: PendingComment };

const NEAR_BOTTOM_PX = 120;

export default function TripFeed() {
    const { trip } = useOutletContext<{ trip: Trip }>();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'activity' | 'comments'>('comments');
    const [activity, setActivity] = useState<ActivityEntry[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [pending, setPending] = useState<PendingComment[]>([]);
    const [presence, setPresence] = useState<PresenceUser[]>([]);
    const [newComment, setNewComment] = useState('');
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

    // Typing indicator: emit typing:start once per burst (not per keystroke),
    // and typing:stop after a short idle gap or immediately on send.
    const TYPING_IDLE_MS = 2000;
    const isTypingRef = useRef(false);
    const typingIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Editing a single comment in place.
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState(false);

    // Deleting is optimistic: hide immediately, roll back on failure.
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [deleteErrorId, setDeleteErrorId] = useState<string | null>(null);

    // Which own-message's hover/tap actions are pinned open (for touch, which has no hover).
    const [openActionsId, setOpenActionsId] = useState<string | null>(null);

    // Which comment's reply thread is open in the side panel.
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

    // Scroll behavior: only stick to bottom if already near it.
    const scrollRef = useRef<HTMLDivElement>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);
    const prevCountRef = useRef(0);
    const [showJumpToBottom, setShowJumpToBottom] = useState(false);

    // "New since you were last looking at this tab" divider.
    const [unreadBoundary, setUnreadBoundary] = useState<number | null>(null);
    const awaySinceRef = useRef<number | null>(null);

    // Collect all user IDs for profile resolution
    const userIds = useMemo(() => {
        const ids = new Set<string>();
        activity.forEach(a => ids.add(a.user_id));
        comments.forEach(c => ids.add(c.user_id));
        pending.forEach(p => ids.add(p.user_id));
        return Array.from(ids);
    }, [activity, comments, pending]);

    const { profiles } = useUserProfiles(userIds);

    useEffect(() => {
        if (!trip?.id) return;
        const unsub1 = subscribeToActivity(trip.id, setActivity);
        const unsub2 = subscribeToComments(trip.id, setComments);
        const unsub3 = subscribeToPresence(trip.id, setPresence);
        const unsub4 = subscribeToTyping(trip.id, setTypingUsers);
        return () => {
            unsub1(); unsub2(); unsub3(); unsub4();
            if (typingIdleTimer.current) clearTimeout(typingIdleTimer.current);
            if (isTypingRef.current) {
                isTypingRef.current = false;
                emitTypingStop(trip.id);
            }
            setTypingUsers([]);
        };
    }, [trip?.id]);

    // Track whether the comments tab is actually being looked at (tab selected
    // AND the browser tab/window is visible). When focus returns after being
    // away, freeze the moment we left as the "unread" boundary for the divider.
    useEffect(() => {
        const evaluate = () => {
            const focused = activeTab === 'comments' && document.visibilityState === 'visible';
            if (focused) {
                if (awaySinceRef.current !== null) {
                    setUnreadBoundary(awaySinceRef.current);
                    awaySinceRef.current = null;
                }
            } else if (awaySinceRef.current === null) {
                awaySinceRef.current = Date.now();
            }
        };
        evaluate();
        document.addEventListener('visibilitychange', evaluate);
        return () => document.removeEventListener('visibilitychange', evaluate);
    }, [activeTab]);

    // Clean up optimistic delete markers once the real delete/edit has landed.
    useEffect(() => {
        setDeletingIds(prev => {
            if (prev.size === 0) return prev;
            const next = new Set(prev);
            let changed = false;
            for (const id of next) {
                if (!comments.some(c => c.id === id)) { next.delete(id); changed = true; }
            }
            return changed ? next : prev;
        });
    }, [comments]);

    const displayComments: FeedComment[] = useMemo(() => {
        const confirmed = comments.filter(c => !deletingIds.has(c.id));
        const pendingItems: FeedComment[] = pending.map(p => ({
            id: p.clientId,
            trip_id: p.trip_id,
            user_id: p.user_id,
            text: p.text,
            created_at: p.created_at,
            parent_comment_id: p.parent_comment_id,
            _pending: p,
        }));
        return [...confirmed, ...pendingItems];
    }, [comments, pending, deletingIds]);

    // Only top-level comments render in the main feed; replies live in the
    // thread panel so posting/receiving a reply never grows the main list
    // (which is what keeps the main feed's scroll position stable).
    const topLevelComments: FeedComment[] = useMemo(
        () => displayComments.filter(c => !c.parent_comment_id),
        [displayComments]
    );

    const repliesByParent = useMemo(() => {
        const map = new Map<string, FeedComment[]>();
        for (const c of displayComments) {
            if (!c.parent_comment_id) continue;
            const arr = map.get(c.parent_comment_id) ?? [];
            arr.push(c);
            map.set(c.parent_comment_id, arr);
        }
        return map;
    }, [displayComments]);

    const activeThreadRoot = useMemo(
        () => (activeThreadId ? comments.find(c => c.id === activeThreadId) ?? null : null),
        [activeThreadId, comments]
    );

    // The thread root can vanish while the panel is open (deleted here or
    // remotely) — close the panel rather than showing a dangling thread.
    useEffect(() => {
        if (activeThreadId && !activeThreadRoot) setActiveThreadId(null);
    }, [activeThreadId, activeThreadRoot]);

    const unreadStartIndex = useMemo(() => {
        if (unreadBoundary === null) return -1;
        return topLevelComments.findIndex(
            c => !c._pending && new Date(c.created_at).getTime() > unreadBoundary
        );
    }, [topLevelComments, unreadBoundary]);

    const checkNearBottom = () => {
        const el = scrollRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    };

    const handleScroll = () => {
        const near = checkNearBottom();
        isNearBottomRef.current = near;
        if (near) setShowJumpToBottom(false);
    };

    const scrollToBottom = (smooth: boolean) => {
        commentsEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
        isNearBottomRef.current = true;
        setShowJumpToBottom(false);
    };

    // Stick to bottom only if the user was already there (or it's their own
    // message, or this is the first load); otherwise leave scroll alone and
    // surface a "new messages" affordance instead.
    useEffect(() => {
        const count = topLevelComments.length;
        const grew = count > prevCountRef.current;
        const isFirstLoad = prevCountRef.current === 0 && count > 0;
        if (grew) {
            const last = topLevelComments[count - 1];
            const isOwn = last.user_id === user?.id;
            if (isFirstLoad || isOwn || isNearBottomRef.current) {
                scrollToBottom(!isFirstLoad);
            } else {
                setShowJumpToBottom(true);
            }
        }
        prevCountRef.current = count;
    }, [topLevelComments, user?.id]);

    const sendComment = async (text: string, parentCommentId: string | null = null) => {
        if (!trip?.id || !user || !text.trim()) return;
        const clientId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const item: PendingComment = {
            clientId,
            trip_id: trip.id,
            user_id: user.id,
            text: text.trim(),
            created_at: new Date().toISOString(),
            status: 'sending',
            parent_comment_id: parentCommentId,
        };
        setPending(prev => [...prev, item]);
        try {
            await addComment(trip.id, user.id, item.text, parentCommentId);
            setPending(prev => prev.filter(p => p.clientId !== clientId));
        } catch (error) {
            console.error('Failed to send comment:', error);
            setPending(prev => prev.map(p => (p.clientId === clientId ? { ...p, status: 'error' } : p)));
        }
    };

    const stopTyping = () => {
        if (typingIdleTimer.current) {
            clearTimeout(typingIdleTimer.current);
            typingIdleTimer.current = null;
        }
        if (isTypingRef.current && trip?.id) {
            isTypingRef.current = false;
            emitTypingStop(trip.id);
        }
    };

    const handleComposeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewComment(e.target.value);
        if (!trip?.id) return;
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            emitTypingStart(trip.id);
        }
        if (typingIdleTimer.current) clearTimeout(typingIdleTimer.current);
        typingIdleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = newComment.trim();
        if (!text) return;
        setNewComment('');
        stopTyping();
        await sendComment(text);
    };

    const retryPending = async (item: PendingComment) => {
        setPending(prev => prev.map(p => (p.clientId === item.clientId ? { ...p, status: 'sending' } : p)));
        try {
            await addComment(item.trip_id, item.user_id, item.text, item.parent_comment_id);
            setPending(prev => prev.filter(p => p.clientId !== item.clientId));
        } catch (error) {
            console.error('Failed to send comment:', error);
            setPending(prev => prev.map(p => (p.clientId === item.clientId ? { ...p, status: 'error' } : p)));
        }
    };

    const discardPending = (clientId: string) => {
        setPending(prev => prev.filter(p => p.clientId !== clientId));
    };

    const startEdit = (comment: Comment) => {
        setOpenActionsId(null);
        setEditingId(comment.id);
        setEditingText(comment.text);
        setEditError(false);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingText('');
        setEditError(false);
    };

    const submitEdit = async (comment: Comment) => {
        if (!trip?.id) return;
        const text = editingText.trim();
        if (!text) return;
        if (text === comment.text) { cancelEdit(); return; }
        setEditSaving(true);
        setEditError(false);
        try {
            await editComment(trip.id, comment.id, text);
            setEditingId(null);
            setEditingText('');
        } catch (error) {
            console.error('Failed to edit comment:', error);
            setEditError(true);
        } finally {
            setEditSaving(false);
        }
    };

    const handleDelete = async (comment: Comment) => {
        if (!trip?.id) return;
        setOpenActionsId(null);
        if (!window.confirm('Delete this message?')) return;
        setDeletingIds(prev => new Set(prev).add(comment.id));
        try {
            await deleteComment(trip.id, comment.id);
        } catch (error) {
            console.error('Failed to delete comment:', error);
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(comment.id);
                return next;
            });
            setDeleteErrorId(comment.id);
            setTimeout(() => setDeleteErrorId(id => (id === comment.id ? null : id)), 3000);
        }
    };

    const formatTime = (timestamp: any) => {
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
        <div className="px-4 flex flex-col" style={{ height: 'calc(100dvh - 300px)' }}>
            {/* Presence */}
            {presence.length > 0 && (
                <div className="flex items-center gap-2 mb-3 text-xs text-[var(--color-text-secondary)]" data-testid="presence-bar">
                    <div className="flex -space-x-2">
                        {presence.slice(0, 5).map(p => (
                            <div
                                key={p.id}
                                title={p.display_name}
                                className="w-6 h-6 rounded-full bg-brand-teal border-2 border-[var(--color-bg-primary)] flex items-center justify-center overflow-hidden"
                            >
                                {p.photo_url ? (
                                    <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[var(--color-carbon)] text-[9px] font-bold">{(p.display_name?.[0] ?? '?').toUpperCase()}</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <span>
                        {presence.length <= 3
                            ? `${presence.map(p => p.display_name).join(', ')} online now`
                            : `${presence.length} online now`}
                    </span>
                </div>
            )}

            {/* Tab toggles */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`cx-label flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
                        activeTab === 'comments'
                            ? 'bg-brand-teal text-[var(--color-carbon)]'
                            : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                    }`}
                >
                    <MessageCircle size={14} />
                    Comments ({comments.length})
                </button>
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`cx-label flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
                        activeTab === 'activity'
                            ? 'bg-brand-teal text-[var(--color-carbon)]'
                            : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                    }`}
                >
                    <Activity size={14} />
                    Activity ({activity.length})
                </button>
            </div>

            {activeTab === 'comments' ? (
                /* Comments section */
                <div className="flex flex-col flex-1 min-h-0 relative">
                    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto space-y-3 mb-4 pb-24">
                        {topLevelComments.length === 0 ? (
                            <EmptyState
                                icon={<MessageCircle size={32} className="opacity-50" />}
                                title="No comments yet. Start the conversation!"
                                hint="Say hi, or ask what everyone's excited about."
                            />
                        ) : (
                            topLevelComments.map((comment, index) => {
                                const profile = profiles.get(comment.user_id);
                                const isMe = comment.user_id === user?.id;
                                const isEditing = editingId === comment.id;
                                const isPending = !!comment._pending;
                                const isErrored = comment._pending?.status === 'error';
                                const showDeleteError = deleteErrorId === comment.id;
                                const showEditDelete = isMe && !isPending && !isEditing;
                                const showReply = !isPending && !isEditing;
                                const actionsOpen = openActionsId === comment.id;
                                const replyCount = repliesByParent.get(comment.id)?.length ?? 0;

                                return (
                                    <div key={comment.id}>
                                        {index === unreadStartIndex && (
                                            <div className="flex items-center gap-2 my-3" data-testid="unread-divider">
                                                <div className="flex-1 h-px bg-brand-teal/40" />
                                                <span className="text-[10px] uppercase tracking-wide text-brand-teal">New</span>
                                                <div className="flex-1 h-px bg-brand-teal/40" />
                                            </div>
                                        )}
                                        <div className={`group flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden shrink-0">
                                                {profile?.photo_url ? (
                                                    <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[var(--color-text-primary)] text-xs font-bold">
                                                        {(profile?.display_name?.[0] ?? '?').toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`max-w-[75%] ${isMe ? 'items-end' : ''} flex flex-col`}>
                                                <div className={`flex items-center gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                    {isEditing ? (
                                                        <div className="rounded-2xl px-3 py-2 bg-[var(--color-bg-card)] border border-brand-teal w-64 max-w-full">
                                                            <textarea
                                                                autoFocus
                                                                value={editingText}
                                                                onChange={e => setEditingText(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        submitEdit(comment);
                                                                    } else if (e.key === 'Escape') {
                                                                        cancelEdit();
                                                                    }
                                                                }}
                                                                className="w-full bg-transparent text-[var(--color-text-primary)] text-sm resize-none focus:outline-none"
                                                                rows={2}
                                                            />
                                                            <div className="flex justify-end gap-1 mt-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={cancelEdit}
                                                                    className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                                                    aria-label="Cancel edit"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => submitEdit(comment)}
                                                                    disabled={editSaving || !editingText.trim()}
                                                                    className="p-1 text-brand-teal hover:brightness-125 disabled:opacity-50"
                                                                    aria-label="Save edit"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                            </div>
                                                            {editError && (
                                                                <p className="text-xs text-[var(--color-vermilion)] mt-1">Couldn't save. Try again.</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div
                                                            onClick={() =>
                                                                (showEditDelete || showReply) &&
                                                                setOpenActionsId(actionsOpen ? null : comment.id)
                                                            }
                                                            className={`rounded-2xl px-4 py-2 ${
                                                                isMe ? 'bg-brand-teal text-[var(--color-carbon)]' : 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
                                                            } ${isPending ? 'opacity-60' : ''} ${(showEditDelete || showReply) ? 'cursor-pointer' : ''}`}
                                                        >
                                                            {!isMe && (
                                                                <div className="text-xs font-medium text-brand-teal mb-1">
                                                                    {profile?.display_name ?? 'Unknown'}
                                                                </div>
                                                            )}
                                                            <p className="text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                                                        </div>
                                                    )}

                                                    {/* Hover (desktop) / tap-to-pin (touch) actions */}
                                                    {(showEditDelete || showReply) && (
                                                        <div
                                                            className={`flex gap-4 transition-opacity ${
                                                                actionsOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                            }`}
                                                        >
                                                            {showReply && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActiveThreadId(comment.id)}
                                                                    className="min-w-11 min-h-11 -m-2 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                                                    aria-label="Reply"
                                                                >
                                                                    <span className="p-1.5 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center">
                                                                        <Reply size={12} />
                                                                    </span>
                                                                </button>
                                                            )}
                                                            {showEditDelete && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => startEdit(comment)}
                                                                        className="min-w-11 min-h-11 -m-2 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                                                        aria-label="Edit message"
                                                                    >
                                                                        <span className="p-1.5 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center">
                                                                            <Pencil size={12} />
                                                                        </span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDelete(comment)}
                                                                        className="min-w-11 min-h-11 -m-2 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-vermilion)]"
                                                                        aria-label="Delete message"
                                                                    >
                                                                        <span className="p-1.5 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center">
                                                                            <Trash2 size={12} />
                                                                        </span>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                    {isPending ? (
                                                        isErrored ? (
                                                            <span className="flex items-center gap-1 text-[var(--color-vermilion)]">
                                                                <AlertCircle size={11} /> Failed to send
                                                                <button
                                                                    type="button"
                                                                    onClick={() => retryPending(comment._pending!)}
                                                                    className="underline hover:brightness-125"
                                                                >
                                                                    Retry
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => discardPending(comment._pending!.clientId)}
                                                                    className="underline hover:brightness-125"
                                                                >
                                                                    Discard
                                                                </button>
                                                            </span>
                                                        ) : (
                                                            <span>Sending…</span>
                                                        )
                                                    ) : (
                                                        <>
                                                            <span>{formatTime(comment.created_at)}</span>
                                                            {comment.edited_at && <span>(edited)</span>}
                                                            {showDeleteError && (
                                                                <span className="text-[var(--color-vermilion)]">Couldn't delete, try again</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* Reply-count badge — always visible when replies exist, not hover-gated */}
                                                {replyCount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveThreadId(comment.id)}
                                                        className={`flex items-center gap-1 text-xs text-brand-teal mt-1 hover:underline ${isMe ? 'self-end' : ''}`}
                                                        data-testid="reply-count-badge"
                                                    >
                                                        <Reply size={12} />
                                                        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={commentsEndRef} />
                    </div>

                    {showJumpToBottom && (
                        <button
                            type="button"
                            onClick={() => scrollToBottom(true)}
                            className="cx-label absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-teal text-[var(--color-carbon)] text-xs shadow-lg"
                        >
                            <ChevronDown size={14} />
                            New messages
                        </button>
                    )}

                    {/* Typing indicator — height is always reserved (even when empty) so its
                        appearance/disappearance never shifts the scroll container above it. */}
                    <div className="h-4 mb-1 px-1 text-xs text-[var(--color-text-secondary)] italic" data-testid="typing-indicator">
                        {typingUsers.length > 0 && (
                            <span>
                                {typingUsers.length === 1
                                    ? `${typingUsers[0].display_name} is typing…`
                                    : typingUsers.length === 2
                                        ? `${typingUsers[0].display_name} and ${typingUsers[1].display_name} are typing…`
                                        : `${typingUsers.length} people are typing…`}
                            </span>
                        )}
                    </div>

                    {/* Comment input — pinned with position:fixed (not sticky, and not
                        bottom padding) so it always sits directly above the fixed
                        BottomNav, regardless of page scroll position or viewport height
                        (on-screen keyboard). Unlike `sticky`, this doesn't depend on the
                        page having been scrolled far enough to reach its "stuck" resting
                        spot — focusing the input on a tall page only scrolls it partially
                        into view, which left a sticky composer stranded behind the nav.
                        The bottom offset matches BottomNav's own height + safe-area
                        reservation (see MainLayout's pb) so there's no gap or overlap.
                        left-20 (not left-4) so it clears the global FeedbackWidget FAB,
                        which floats fixed at the same bottom-20/left-4 corner. */}
                    <form
                        onSubmit={handleSendComment}
                        className="fixed left-20 right-4 bottom-[calc(4rem_+_env(safe-area-inset-bottom)_+_0.5rem)] z-20 flex gap-2 bg-[var(--color-bg-primary)] p-1 -m-1 rounded-full"
                    >
                        <input
                            type="text"
                            value={newComment}
                            onChange={handleComposeChange}
                            placeholder="Type a message..."
                            className="flex-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-full px-4 py-3 text-[var(--color-text-primary)] text-base focus:outline-none focus:border-brand-teal"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="w-12 h-12 bg-brand-teal rounded-full flex items-center justify-center text-[var(--color-carbon)] disabled:opacity-50 shrink-0"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            ) : (
                /* Activity section */
                <div className="flex-1 overflow-y-auto space-y-3">
                    {activity.length === 0 ? (
                        <EmptyState
                            icon={<Activity size={32} className="opacity-50" />}
                            title="No activity yet. Start planning!"
                            hint="Add a task, event, or poll and it'll show up here."
                        />
                    ) : (
                        activity.map(entry => {
                            const profile = profiles.get(entry.user_id);
                            return (
                                <div key={entry.id} className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                                        {profile?.photo_url ? (
                                            <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[var(--color-text-primary)] text-xs font-bold">
                                                {(profile?.display_name?.[0] ?? '?').toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[var(--color-text-secondary)]">
                                            <span className="font-medium text-[var(--color-text-primary)]">{profile?.display_name ?? 'Someone'}</span>
                                            {' '}{entry.action}
                                        </p>
                                        {entry.detail && (
                                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{entry.detail}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-[var(--color-text-muted)] shrink-0">{formatTime(entry.created_at)}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeThreadRoot && (
                <ThreadPanel
                    root={activeThreadRoot}
                    replies={repliesByParent.get(activeThreadRoot.id) ?? []}
                    profiles={profiles}
                    currentUserId={user?.id}
                    formatTime={formatTime}
                    onClose={() => setActiveThreadId(null)}
                    onSendReply={(text) => sendComment(text, activeThreadRoot.id)}
                    editingId={editingId}
                    editingText={editingText}
                    editSaving={editSaving}
                    editError={editError}
                    onStartEdit={startEdit}
                    onCancelEdit={cancelEdit}
                    onSubmitEdit={submitEdit}
                    onEditingTextChange={setEditingText}
                    openActionsId={openActionsId}
                    onToggleActions={setOpenActionsId}
                    deleteErrorId={deleteErrorId}
                    onDelete={handleDelete}
                    onRetryPending={retryPending}
                    onDiscardPending={discardPending}
                />
            )}
        </div>
    );
}
