import { useState } from 'react';
import {
    Home, Users, Briefcase, User,
    MapPin, MessageCircle, FileText, Search, ListChecks, DollarSign, FolderOpen, BarChart2, MoreHorizontal, X,
} from 'lucide-react';
import { NavLink, useMatch, useNavigate, useLocation } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Family', path: '/family' },
    { icon: Briefcase, label: 'Trips', path: '/trips' },
    { icon: User, label: 'Profile', path: '/profile' },
];

// The 4 highest-traffic trip surfaces, always visible with icon+label —
// matching the outside-trip nav's pattern so there's one navigation
// language to learn, not two. The remaining 4 live behind "More" instead
// of being crammed into the same row: 8 labeled items don't fit a 390px
// viewport without shrinking text below what's legible to every age (see
// issue #7 — this replaces both the old icon-only 8-item row and the
// separate top tab strip that duplicated it in a different order).
const primaryTripNavItems = [
    { icon: MapPin, label: 'Itinerary', path: '', end: true },
    { icon: MessageCircle, label: 'Feed', path: 'feed' },
    { icon: ListChecks, label: 'Tasks', path: 'tasks' },
    { icon: DollarSign, label: 'Budget', path: 'budget' },
];

// "Files" (nav) / "Documents" (header) / `/documents` (route) named three
// different things for the same surface — Documents wins everywhere.
const moreTripNavItems = [
    { icon: FileText, label: 'Notes', path: 'notes' },
    { icon: Search, label: 'Search', path: 'search' },
    { icon: FolderOpen, label: 'Documents', path: 'documents' },
    { icon: BarChart2, label: 'Polls', path: 'polls' },
];

export function BottomNav() {
    const tripMatch = useMatch('/trips/:tripId/*');
    const tripId = tripMatch?.params.tripId;
    const navigate = useNavigate();
    const location = useLocation();
    const [moreOpen, setMoreOpen] = useState(false);

    if (tripId) {
        const moreIsActive = moreTripNavItems.some(item =>
            location.pathname === `/trips/${tripId}/${item.path}`
        );

        return (
            <>
                <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)] z-40">
                    <div className="flex justify-around items-center h-16">
                        {primaryTripNavItems.map(({ icon: Icon, label, path, end }) => (
                            <NavLink
                                key={path}
                                to={path ? `/trips/${tripId}/${path}` : `/trips/${tripId}`}
                                end={end}
                                className={({ isActive }) =>
                                    twMerge(
                                        'relative flex flex-col items-center justify-center h-full flex-1 min-w-11 gap-1 transition-colors',
                                        isActive ? 'text-brand-teal' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && <span className="absolute top-0 h-0.5 w-6 bg-brand-teal rounded-full" />}
                                        <Icon size={22} />
                                        <span className="cx-label text-[10px]">{label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                        <button
                            onClick={() => setMoreOpen(true)}
                            aria-label="More trip surfaces"
                            aria-haspopup="true"
                            aria-expanded={moreOpen}
                            className={twMerge(
                                'relative flex flex-col items-center justify-center h-full flex-1 min-w-11 gap-1 transition-colors',
                                moreIsActive ? 'text-brand-teal' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                            )}
                        >
                            {moreIsActive && <span className="absolute top-0 h-0.5 w-6 bg-brand-teal rounded-full" />}
                            <MoreHorizontal size={22} />
                            <span className="cx-label text-[10px]">More</span>
                        </button>
                    </div>
                </nav>

                {moreOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
                        onClick={() => setMoreOpen(false)}
                    >
                        <div
                            className="cx-slide w-full max-w-md p-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="cx-label text-sm text-[var(--color-text-primary)]">More</h3>
                                <button
                                    onClick={() => setMoreOpen(false)}
                                    aria-label="Close"
                                    className="p-2 -m-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {moreTripNavItems.map(({ icon: Icon, label, path }) => {
                                    const isActive = location.pathname === `/trips/${tripId}/${path}`;
                                    return (
                                        <button
                                            key={path}
                                            onClick={() => {
                                                setMoreOpen(false);
                                                navigate(`/trips/${tripId}/${path}`);
                                            }}
                                            className={twMerge(
                                                'flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl transition-colors',
                                                isActive
                                                    ? 'text-brand-teal bg-brand-teal/10'
                                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                                            )}
                                        >
                                            <Icon size={22} />
                                            <span className="cx-label text-[10px] text-center">{label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center h-16">
                {navItems.map(({ icon: Icon, label, path }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        className={({ isActive }) =>
                            twMerge(
                                'relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                                isActive ? 'text-brand-teal' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && <span className="absolute top-0 h-0.5 w-6 bg-brand-teal rounded-full" />}
                                <Icon size={24} />
                                <span className="cx-label text-[10px]">{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
