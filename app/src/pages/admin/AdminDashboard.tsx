import { useEffect, useState } from 'react';
import { Loader2, Users, MapPin, MessagesSquare, HardDrive, ShieldOff, Layers } from 'lucide-react';
import { adminApi, type AdminStats } from '../../lib/client';
import { Panel, SectionLabel } from '../../components/ui/Concourse';

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function StatTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
    return (
        <Panel className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0">
                <Icon size={20} />
            </div>
            <div className="min-w-0">
                <SectionLabel>{label}</SectionLabel>
                <div className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">{value}</div>
            </div>
        </Panel>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.stats().then(({ data }) => {
            setStats(data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="animate-spin text-brand-teal" size={28} />
            </div>
        );
    }

    if (!stats) {
        return <p className="text-[var(--color-text-secondary)]">Couldn't load platform stats.</p>;
    }

    return (
        <div className="space-y-6">
            <h1 className="cx-h1 text-2xl text-[var(--color-text-primary)]">Dashboard</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatTile icon={Users} label="Users" value={stats.users} />
                <StatTile icon={MapPin} label="Trips" value={stats.trips} />
                <StatTile icon={Layers} label="Families" value={stats.families} />
                <StatTile icon={MessagesSquare} label="New feedback" value={stats.newFeedback} />
                <StatTile icon={ShieldOff} label="Suspended users" value={stats.suspendedUsers} />
                <StatTile icon={HardDrive} label="Storage used" value={formatBytes(stats.storageBytes)} />
            </div>
        </div>
    );
}
