import { useEffect, useState } from 'react';
import { Loader2, Search, Users as UsersIcon, HardDrive } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { adminApi, type AdminTrip } from '../../lib/client';
import { useToast } from '../../contexts/ToastContext';
import { Panel, Tag, EmptyState, Button } from '../../components/ui/Concourse';

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export default function AdminTrips() {
    const { showToast } = useToast();
    const [trips, setTrips] = useState<AdminTrip[]>([]);
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async (query = q) => {
        setLoading(true);
        const { data, error } = await adminApi.listTrips(query);
        if (error) showToast('Failed to load trips', 'error');
        setTrips(data ?? []);
        setLoading(false);
    };

    // `loading` already starts true, so the initial fetch skips load()'s
    // own setLoading(true) call — that's what react-hooks/set-state-in-effect
    // objects to (a setState call as the first synchronous statement inside
    // an effect-invoked function). load() itself stays as the reusable path
    // the search form's submit handler calls directly, outside an effect.
    useEffect(() => {
        adminApi.listTrips('').then(({ data, error }) => {
            if (error) showToast('Failed to load trips', 'error');
            setTrips(data ?? []);
            setLoading(false);
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-6">
            <h1 className="cx-h1 text-2xl text-[var(--color-text-primary)]">Trips</h1>

            <form onSubmit={e => { e.preventDefault(); load(); }} className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search by trip title..."
                        className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                    />
                </div>
                <Button type="submit" variant="outline">Search</Button>
            </form>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="animate-spin text-brand-teal" size={28} />
                </div>
            ) : trips.length === 0 ? (
                <EmptyState title="No trips found" hint="Try a different search." />
            ) : (
                <Panel className="divide-y divide-[var(--color-border)]">
                    {trips.map(t => (
                        <div key={t.id} className="p-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-[var(--color-text-primary)]">{t.title}</span>
                                {t.family_name && <Tag>{t.family_name}</Tag>}
                            </div>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                {t.owner_name} &middot; {t.owner_email}
                            </p>
                            <div className="flex items-center gap-4 mt-2 cx-label text-[11px] text-[var(--color-text-muted)]">
                                {t.start_date && (
                                    <span className="tabular-nums">
                                        {format(parseISO(t.start_date), 'MMM d, yyyy')}
                                        {t.end_date ? ` – ${format(parseISO(t.end_date), 'MMM d, yyyy')}` : ''}
                                    </span>
                                )}
                                <span className="flex items-center gap-1"><UsersIcon size={12} /> {t.member_count}</span>
                                <span className="flex items-center gap-1"><HardDrive size={12} /> {formatBytes(t.storage_bytes)}</span>
                            </div>
                        </div>
                    ))}
                </Panel>
            )}
        </div>
    );
}
