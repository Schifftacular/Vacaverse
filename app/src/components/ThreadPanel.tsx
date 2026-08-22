import { useEffect, useRef, useState } from 'react';
import { X, Send, Pencil, Trash2, Check, AlertCircle } from 'lucide-react';
import type { Comment } from '../types';
import type { FeedComment, PendingComment } from '../pages/trip/TripFeed';

interface ThreadProfile {
    display_name: string;
    photo_url: string | null;
}

interface ThreadPanelProps {
    root: FeedComment;
    replies: FeedComment[];
    profiles: Map<string, ThreadProfile>;
    currentUserId?: string;
    formatTime: (timestamp: any) => string;
    onClose: () => void;
    onSendReply: (text: string) => void;
    editingId: string | null;
    editingText: string;
    editSaving: boolean;
    editError: boolean;
    onStartEdit: (comment: Comment) => void;
    onCancelEdit: () => void;
    onSubmitEdit: (comment: Comment) => void;
    onEditingTextChange: (text: string) => void;
    openActionsId: string | null;
    onToggleActions: (id: string | null) => void;
    deleteErrorId: string | null;
    onDelete: (comment: Comment) => void;
    onRetryPending: (item: PendingComment) => void;
    onDiscardPending: (clientId: string) => void;
}

// A single comment or reply bubble, shared between the pinned root and the
// reply list below it. Kept local to this file since its layout (no
// left/right alternation by author, avatar always on the left) is simpler
// than the main feed's bubble and isn't reused there.
function ThreadMessage({
    comment,
    profile,
    isMe,
    canEditDelete,
    isEditing,
    editingText,
    editSaving,
    editError,
    onStartEdit,
    onCancelEdit,
    onSubmitEdit,
    onEditingTextChange,
    actionsOpen,
    onToggleActions,
    showDeleteError,
    onDelete,
    onRetryPending,
    onDiscardPending,
    formatTime,
}: {
    comment: FeedComment;
    profile?: ThreadProfile;
    isMe: boolean;
    canEditDelete: boolean;
    isEditing: boolean;
    editingText: string;
    editSaving: boolean;
    editError: boolean;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSubmitEdit: () => void;
    onEditingTextChange: (text: string) => void;
    actionsOpen: boolean;
    onToggleActions: () => void;
    showDeleteError: boolean;
    onDelete: () => void;
    onRetryPending: () => void;
    onDiscardPending: () => void;
    formatTime: (timestamp: any) => string;
}) {
    const isPending = !!comment._pending;
    const isErrored = comment._pending?.status === 'error';

    return (
        <div className="group flex gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden shrink-0">
                {profile?.photo_url ? (
                    <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-[var(--color-text-primary)] text-[10px] font-bold">
                        {(profile?.display_name?.[0] ?? '?').toUpperCase()}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-1">
                    {isEditing ? (
                        <div className="rounded-2xl px-3 py-2 bg-[var(--color-bg-primary)] border border-brand-teal w-full">
                            <textarea
                                autoFocus
                                value={editingText}
                                onChange={e => onEditingTextChange(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onSubmitEdit();
                                    } else if (e.key === 'Escape') {
                                        onCancelEdit();
                                    }
                                }}
                                className="w-full bg-transparent text-[var(--color-text-primary)] text-sm resize-none focus:outline-none"
                                rows={2}
                            />
                            <div className="flex justify-end gap-1 mt-1">
                                <button type="button" onClick={onCancelEdit} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" aria-label="Cancel edit">
                                    <X size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={onSubmitEdit}
                                    disabled={editSaving || !editingText.trim()}
                                    className="p-1 text-brand-teal hover:brightness-125 disabled:opacity-50"
                                    aria-label="Save edit"
                                >
                                    <Check size={14} />
                                </button>
                            </div>
                            {editError && <p className="text-xs text-[var(--color-vermilion)] mt-1">Couldn't save. Try again.</p>}
                        </div>
                    ) : (
                        <div
                            onClick={() => canEditDelete && onToggleActions()}
                            className={`rounded-2xl px-3 py-2 min-w-0 ${
                                isMe ? 'bg-brand-teal text-[var(--color-carbon)]' : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
                            } ${isPending ? 'opacity-60' : ''} ${canEditDelete ? 'cursor-pointer' : ''}`}
                        >
                            {!isMe && (
                                <div className="text-xs font-medium text-brand-teal mb-1">{profile?.display_name ?? 'Unknown'}</div>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                        </div>
                    )}

                    {canEditDelete && !isEditing && (
                        <div className={`flex gap-4 shrink-0 transition-opacity ${actionsOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <button
                                type="button"
                                onClick={onStartEdit}
                                className="min-w-11 min-h-11 -m-2 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                aria-label="Edit message"
                            >
                                <span className="p-1.5 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-center">
                                    <Pencil size={12} />
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={onDelete}
                                className="min-w-11 min-h-11 -m-2 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-vermilion)]"
                                aria-label="Delete message"
                            >
                                <span className="p-1.5 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-center">
                                    <Trash2 size={12} />
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mt-1">
                    {isPending ? (
                        isErrored ? (
                            <span className="flex items-center gap-1 text-[var(--color-vermilion)]">
                                <AlertCircle size={11} /> Failed to send
                                <button type="button" onClick={onRetryPending} className="underline hover:brightness-125">
                                    Retry
                                </button>
                                <button type="button" onClick={onDiscardPending} className="underline hover:brightness-125">
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
                            {showDeleteError && <span className="text-[var(--color-vermilion)]">Couldn't delete, try again</span>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export function ThreadPanel({
    root,
    replies,
    profiles,
    currentUserId,
    formatTime,
    onClose,
    onSendReply,
    editingId,
    editingText,
    editSaving,
    editError,
    onStartEdit,
    onCancelEdit,
    onSubmitEdit,
    onEditingTextChange,
    openActionsId,
    onToggleActions,
    deleteErrorId,
    onDelete,
    onRetryPending,
    onDiscardPending,
}: ThreadPanelProps) {
    const [replyText, setReplyText] = useState('');
    const listRef = useRef<HTMLDivElement>(null);

    // Threads are short — just stick to the bottom on open and whenever a
    // reply is added. Setting scrollTop directly on this panel's own list
    // (rather than scrollIntoView, which walks scrollable ancestors) keeps
    // this from ever touching the main feed's own scroll container behind it.
    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [replies.length]);

    // Focus the reply input on mount via a ref callback rather than the
    // `autoFocus` prop, with `preventScroll` set. This guarantees the panel
    // opening can never trigger a browser scroll-into-view on any ancestor
    // (including the main feed behind it) on any browser/viewport, rather
    // than relying on autoFocus's default (which does scroll ancestors).
    const focusReplyInput = (el: HTMLInputElement | null) => {
        el?.focus({ preventScroll: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = replyText.trim();
        if (!text) return;
        setReplyText('');
        onSendReply(text);
    };

    const rootProfile = profiles.get(root.user_id);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end" onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                className="h-full w-full sm:w-[420px] max-w-full bg-[var(--color-bg-card)] border-l border-[var(--color-border)] flex flex-col"
                data-testid="thread-panel"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] shrink-0">
                    <div>
                        <h3 className="cx-label text-sm text-[var(--color-text-primary)]">Thread</h3>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" aria-label="Close thread">
                        <X size={20} />
                    </button>
                </div>

                <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    <ThreadMessage
                        comment={root}
                        profile={rootProfile}
                        isMe={root.user_id === currentUserId}
                        canEditDelete={root.user_id === currentUserId && editingId !== root.id}
                        isEditing={editingId === root.id}
                        editingText={editingText}
                        editSaving={editSaving}
                        editError={editError}
                        onStartEdit={() => onStartEdit(root)}
                        onCancelEdit={onCancelEdit}
                        onSubmitEdit={() => onSubmitEdit(root)}
                        onEditingTextChange={onEditingTextChange}
                        actionsOpen={openActionsId === root.id}
                        onToggleActions={() => onToggleActions(openActionsId === root.id ? null : root.id)}
                        showDeleteError={deleteErrorId === root.id}
                        onDelete={() => onDelete(root)}
                        onRetryPending={() => {}}
                        onDiscardPending={() => {}}
                        formatTime={formatTime}
                    />

                    {replies.length > 0 && <div className="h-px bg-[var(--color-border)]" />}

                    {replies.map(reply => (
                        <ThreadMessage
                            key={reply.id}
                            comment={reply}
                            profile={profiles.get(reply.user_id)}
                            isMe={reply.user_id === currentUserId}
                            canEditDelete={reply.user_id === currentUserId && !reply._pending && editingId !== reply.id}
                            isEditing={editingId === reply.id}
                            editingText={editingText}
                            editSaving={editSaving}
                            editError={editError}
                            onStartEdit={() => onStartEdit(reply)}
                            onCancelEdit={onCancelEdit}
                            onSubmitEdit={() => onSubmitEdit(reply)}
                            onEditingTextChange={onEditingTextChange}
                            actionsOpen={openActionsId === reply.id}
                            onToggleActions={() => onToggleActions(openActionsId === reply.id ? null : reply.id)}
                            showDeleteError={deleteErrorId === reply.id}
                            onDelete={() => onDelete(reply)}
                            onRetryPending={() => onRetryPending(reply._pending!)}
                            onDiscardPending={() => onDiscardPending(reply._pending!.clientId)}
                            formatTime={formatTime}
                        />
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-[var(--color-border)] shrink-0">
                    <input
                        ref={focusReplyInput}
                        type="text"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Reply in thread..."
                        className="flex-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full px-4 py-2.5 text-[var(--color-text-primary)] text-base focus:outline-none focus:border-brand-teal"
                    />
                    <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className="w-11 h-11 bg-brand-teal rounded-full flex items-center justify-center text-[var(--color-carbon)] disabled:opacity-50 shrink-0"
                        aria-label="Send reply"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}
