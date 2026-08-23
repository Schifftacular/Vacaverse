import { NavLink, Outlet } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { LayoutDashboard, Users, MapPin, MessageSquareText, ScrollText } from 'lucide-react';

// Deliberately its own layout, not MainLayout: no BottomNav/FeedbackWidget,
// and a visually distinct shell so it's obvious this isn't the regular app
// (mirrors how Slack/Notion visually separate workspace-admin consoles from
// the product itself, per the admin-panel research this was built from).
const NAV_ITEMS = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/trips', label: 'Trips', icon: MapPin },
    { to: '/admin/feedback', label: 'Feedback', icon: MessageSquareText },
    { to: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
];

export function AdminLayout() {
    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans flex">
            <nav className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r border-[var(--color-border)] py-6 px-3">
                <div className="px-3 mb-1">
                    <span className="cx-h1 text-lg text-[var(--color-text-primary)]">VacaVerse</span>
                </div>
                <div className="px-3 mb-6">
                    <span className="cx-label text-[11px] text-[var(--color-text-muted)]">Admin</span>
                </div>
                <div className="flex flex-col gap-1">
                    {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                twMerge(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                                    isActive
                                        ? 'bg-brand-teal/10 text-brand-teal'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
                                )
                            }
                        >
                            <Icon size={20} />
                            <span className="text-sm font-medium">{label}</span>
                        </NavLink>
                    ))}
                </div>
                <div className="mt-auto px-3">
                    <NavLink to="/" className="cx-label text-xs text-[var(--color-text-muted)] hover:text-brand-teal transition-colors">
                        ← Back to app
                    </NavLink>
                </div>
            </nav>
            <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
