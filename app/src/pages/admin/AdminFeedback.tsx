import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { adminApi, type FeedbackItem } from '../../lib/client';
import { useToast } from '../../contexts/ToastContext';
import { Panel, Tag, EmptyState } from '../../components/ui/Concourse';

const STATUS_TABS = ['new', 'triaged', 'resolved', 'all'] as const;
const TYPE_TONE = { bug: 'vermilion', idea: 'gold', general: 'neutral' } as const;

export default function AdminFeedback() {
    const { showToast } = useToast();
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('new');
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = async (s = status) => {
        setLoading(true);
        const { data, error } = await adminApi.listFeedback(s === 'all' ? '' : s);
        if (error) showToast('Failed to load feedback', 'error');
        setItems(data ?? []);
        setLoading(false);
    };

    useEffect(() => { load(status); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

    const setItemStatus = async (id: string, next: FeedbackItem['status']) => {
        setBusyId(id);
        try {
            await adminApi.updateFeedbackStatus(id, next);
            await load();
        } catch {
            showToast('Failed to update status', 'error');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="cx-h1 text-2xl text-[var(--color-text-primary)]">Feedback</h1>

            <div className="flex gap-2">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setStatus(tab)}
                        className={`cx-label px-3 py-1.5 rounded-full text-[11px] border transition-colors ${
                            status === tab
                                ? 'bg-brand-teal border-brand-teal text-[var(--color-carbon)]'
                                : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="animate-spin text-brand-teal" size={28} />
                </div>
            ) : items.length === 0 ? (
                <EmptyState title="No feedback here" hint="Nothing in this bucket yet." />
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <Panel key={item.id} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag tone={TYPE_TONE[item.type]}>{item.type}</Tag>
                                    <span className="text-sm text-[var(--color-text-secondary)]">{item.email}</span>
                                </div>
                                <span className="cx-label text-[11px] text-[var(--color-text-muted)] shrink-0">
                                    {format(parseISO(item.created_at), 'MMM d, yyyy')}
                                </span>
                            </div>
                            <p className="text-[var(--color-text-primary)] mt-2 whitespace-pre-wrap">{item.text}</p>
                            {item.url && (
                                <p className="cx-label text-[11px] text-[var(--color-text-muted)] mt-2">{item.url}</p>
                            )}
                            <div className="flex gap-2 mt-3">
                                {(['new', 'triaged', 'resolved'] as const)
                                    .filter(s => s !== item.status)
                                    .map(s => (
                                        <button
                                            key={s}
                                            disabled={busyId === item.id}
                                            onClick={() => setItemStatus(item.id, s)}
                                            className="cx-label text-[11px] px-2.5 py-1 rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-brand-teal hover:text-brand-teal disabled:opacity-50"
                                        >
                                            Mark {s}
                                        </button>
                                    ))}
                            </div>
                        </Panel>
                    ))}
                </div>
            )}
        </div>
    );
}
