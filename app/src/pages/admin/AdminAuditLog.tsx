import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { adminApi, type AuditLogEntry } from '../../lib/client';
import { useToast } from '../../contexts/ToastContext';
import { Panel, Tag, EmptyState } from '../../components/ui/Concourse';

const ACTION_LABEL: Record<string, string> = {
    suspend_user: 'Suspended user',
    reinstate_user: 'Reinstated user',
    force_logout: 'Force-logged-out user',
    grant_admin: 'Granted admin access',
    revoke_admin: 'Revoked admin access',
    update_feedback_status: 'Updated feedback status',
};

export default function AdminAuditLog() {
    const { showToast } = useToast();
    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.listAuditLog().then(({ data, error }) => {
            if (error) showToast('Failed to load audit log', 'error');
            setEntries(data ?? []);
            setLoading(false);
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-6">
            <h1 className="cx-h1 text-2xl text-[var(--color-text-primary)]">Audit Log</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
                Every mutating action taken from this admin panel, most recent first.
            </p>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="animate-spin text-brand-teal" size={28} />
                </div>
            ) : entries.length === 0 ? (
                <EmptyState title="No admin actions yet" />
            ) : (
                <Panel className="divide-y divide-[var(--color-border)]">
                    {entries.map(e => (
                        <div key={e.id} className="p-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[var(--color-text-primary)]">
                                    <span className="font-semibold">{e.admin_name ?? e.admin_email ?? e.admin_id}</span>
                                    {' '}
                                    {(ACTION_LABEL[e.action] ?? e.action).toLowerCase()}
                                    {e.target_id && <span className="text-[var(--color-text-secondary)]"> ({e.target_id})</span>}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Tag>{e.target_type}</Tag>
                                <span className="cx-label text-[11px] text-[var(--color-text-muted)] tabular-nums">
                                    {format(parseISO(e.created_at), 'MMM d, yyyy HH:mm')}
                                </span>
                            </div>
                        </div>
                    ))}
                </Panel>
            )}
        </div>
    );
}
