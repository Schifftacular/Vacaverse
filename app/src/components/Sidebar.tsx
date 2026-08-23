import { NavLink, useMatch } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { mainNavItems, allTripNavItems } from '../config/navItems';

// Desktop-only counterpart to BottomNav (see issue #9) — a fixed-width
// left column instead of stretching the mobile single-column stack full
// width. Mirrors BottomNav's outside-trip/in-trip split from the same
// shared nav config, so the two surfaces can't drift apart. Desktop has
// the vertical room mobile doesn't, so the in-trip list shows all 8
// surfaces directly instead of splitting 4 into a "More" sheet.
export function Sidebar() {
    const tripMatch = useMatch('/trips/:tripId/*');
    const tripId = tripMatch?.params.tripId;
    const items = tripId ? allTripNavItems : mainNavItems;

    return (
        <nav className="hidden lg:flex flex-col w-56 shrink-0 h-screen sticky top-0 bg-[var(--color-bg-card)] border-r border-[var(--color-border)] py-6 px-3">
            <div className="px-3 mb-6">
                <span className="cx-h1 text-lg text-[var(--color-text-primary)]">VacaVerse</span>
            </div>
            {tripId && (
                <NavLink
                    to="/trips"
                    className="cx-label text-xs text-[var(--color-text-muted)] hover:text-brand-teal transition-colors px-3 mb-4"
                >
                    ← Back to Trips
                </NavLink>
            )}
            <div className="flex flex-col gap-1">
                {items.map(({ icon: Icon, label, path, end }) => (
                    <NavLink
                        key={path}
                        to={tripId ? (path ? `/trips/${tripId}/${path}` : `/trips/${tripId}`) : path}
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
        </nav>
    );
}
