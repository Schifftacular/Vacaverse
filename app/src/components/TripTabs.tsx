import { NavLink } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { allTripNavItems } from '../config/navItems';
import { Panel } from './ui/Concourse';

// Icon-only so all 8 trip destinations fit one row on a 390px viewport —
// the labeled version of this (the old top tab strip) didn't, which is why
// it was folded into BottomNav in issue #7. Now that BottomNav is reserved
// for the app-wide 4 (Home/Family/Trips/Profile) at all times, this strip
// is the only way to move between a trip's own sections on mobile.

export function TripTabs({ tripId }: { tripId: string }) {
    return (
        <Panel className="p-1.5 flex items-center justify-around lg:hidden" role="tablist" aria-label="Trip sections">
            {allTripNavItems.map(({ icon: Icon, label, path, end }) => (
                <NavLink
                    key={path}
                    to={path ? `/trips/${tripId}/${path}` : `/trips/${tripId}`}
                    end={end}
                    aria-label={label}
                    title={label}
                    className={({ isActive }) =>
                        twMerge(
                            'flex-1 min-h-11 flex items-center justify-center rounded-lg transition-colors',
                            isActive ? 'text-brand-teal bg-brand-teal/10' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                        )
                    }
                >
                    <Icon size={20} />
                </NavLink>
            ))}
        </Panel>
    );
}
