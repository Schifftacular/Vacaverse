import { useState } from 'react';
import { MessageSquarePlus, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { db } from '../lib/client';

export function FeedbackWidget() {
    const { user } = useAuth();
    const { isOpen, open, close } = useFeedback();
    const [text, setText] = useState('');
    const [type, setType] = useState<'bug' | 'idea' | 'general'>('general');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        setSending(true);
        try {
            const { error } = await db.from('feedback').insert({
                user_id: user.id,
                email: user.email,
                type,
                text: text.trim(),
                url: window.location.pathname,
                user_agent: navigator.userAgent,
            });
            if (error) throw error;
            setSent(true);
            setText('');
            setTimeout(() => {
                setSent(false);
                close();
            }, 2000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {/* Trigger button */}
            {!isOpen && (
                <button
                    onClick={open}
                    className="fixed bottom-20 left-4 z-40 w-12 h-12 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:text-brand-teal hover:border-brand-teal transition-colors shadow-lg"
                    aria-label="Send feedback"
                >
                    <MessageSquarePlus size={20} />
                </button>
            )}

            {/* Feedback panel */}
            {isOpen && (
                <div className="fixed bottom-20 left-4 z-50 w-80 max-w-[calc(100vw-32px)] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                        <h3 className="font-semibold text-[var(--color-text-primary)]">Beta Feedback</h3>
                        <button onClick={close} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                            <X size={18} />
                        </button>
                    </div>

                    {sent ? (
                        <div className="p-6 text-center">
                            <div className="text-2xl mb-2">&#x2705;</div>
                            <p className="text-brand-teal font-medium">Thank you!</p>
                            <p className="text-sm text-[var(--color-text-secondary)]">Your feedback helps us improve.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-4 space-y-3">
                            <div className="flex gap-2">
                                {(['bug', 'idea', 'general'] as const).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={`cx-label px-3 py-1.5 rounded-full text-[11px] border transition-colors ${
                                            type === t
                                                ? 'bg-brand-teal border-brand-teal text-[var(--color-carbon)]'
                                                : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                                        }`}
                                    >
                                        {t === 'bug' ? 'Bug' : t === 'idea' ? 'Feature Idea' : 'General'}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Tell us what you think..."
                                rows={3}
                                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-3 text-sm text-[var(--color-text-primary)] resize-none focus:outline-none focus:border-brand-teal"
                                required
                            />
                            <button
                                type="submit"
                                disabled={sending || !text.trim()}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-teal text-[var(--color-carbon)] rounded-xl text-sm font-medium disabled:opacity-50"
                            >
                                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                {sending ? 'Sending...' : 'Send Feedback'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </>
    );
}
