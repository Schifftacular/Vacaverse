import { useEffect, useState } from 'react';
import { Loader2, Search, ShieldCheck, ShieldOff, LogOut, ShieldAlert } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { adminApi, type AdminUser } from '../../lib/client';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Panel, Tag, EmptyState, Button } from '../../components/ui/Concourse';

export default function AdminUsers() {
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = async (query = q) => {
        setLoading(true);
        const { data, error } = await adminApi.listUsers(query);
        if (error) showToast('Failed to load users', 'error');
        setUsers(data ?? []);
        setLoading(false);
    };

    useEffect(() => { load(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const withBusy = async (id: string, action: () => Promise<unknown>, successMessage: string) => {
        setBusyId(id);
        try {
            await action();
            showToast(successMessage, 'success');
            await load();
        } catch {
            showToast('Action failed', 'error');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="cx-h1 text-2xl text-[var(--color-text-primary)]">Users</h1>

            <form onSubmit={e => { e.preventDefault(); load(); }} className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search by email or name..."
                        className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                    />
                </div>
                <Button type="submit" variant="outline">Search</Button>
            </form>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="animate-spin text-brand-teal" size={28} />
                </div>
            ) : users.length === 0 ? (
                <EmptyState title="No users found" hint="Try a different search." />
            ) : (
                <Panel className="divide-y divide-[var(--color-border)]">
                    {users.map(u => (
                        <div key={u.id} className="p-4 flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-[var(--color-text-primary)] truncate">{u.display_name}</span>
                                    {u.is_admin && <Tag tone="gold">Admin</Tag>}
                                    {u.is_suspended && <Tag tone="vermilion">Suspended</Tag>}
                                </div>
                                <p className="text-sm text-[var(--color-text-secondary)] truncate">{u.email}</p>
                                <p className="cx-label text-[11px] text-[var(--color-text-muted)]">
                                    Joined {format(parseISO(u.created_at), 'MMM d, yyyy')}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    disabled={busyId === u.id}
                                    onClick={() => withBusy(u.id, () => adminApi.forceLogout(u.id), 'Sessions revoked')}
                                    title="Force logout"
                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
                                >
                                    <LogOut size={16} />
                                </button>
                                {u.is_suspended ? (
                                    <button
                                        disabled={busyId === u.id}
                                        onClick={() => withBusy(u.id, () => adminApi.reinstateUser(u.id), 'User reinstated')}
                                        title="Reinstate"
                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-bottle-green)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
                                    >
                                        <ShieldCheck size={16} />
                                    </button>
                                ) : (
                                    <button
                                        disabled={busyId === u.id || u.id === currentUser?.id}
                                        onClick={() => {
                                            if (!confirm(`Suspend ${u.email}? They'll be logged out immediately.`)) return;
                                            withBusy(u.id, () => adminApi.suspendUser(u.id), 'User suspended');
                                        }}
                                        title="Suspend"
                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-vermilion)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <ShieldOff size={16} />
                                    </button>
                                )}
                                <button
                                    disabled={busyId === u.id || (u.is_admin && u.id === currentUser?.id)}
                                    onClick={() => {
                                        const next = u.is_admin ? adminApi.revokeAdmin(u.id) : adminApi.makeAdmin(u.id);
                                        withBusy(u.id, () => next, u.is_admin ? 'Admin access revoked' : 'Granted admin access');
                                    }}
                                    title={u.is_admin ? 'Revoke admin' : 'Make admin'}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-brand-teal hover:bg-[var(--color-bg-secondary)] disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <ShieldAlert size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </Panel>
            )}
        </div>
    );
}
