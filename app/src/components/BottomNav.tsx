import { NavLink } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { mainNavItems } from '../config/navItems';

// Mobile only — Sidebar takes over at the lg breakpoint (see issue #9).
// Always the same 4 global destinations, even inside a trip — trip-specific
// navigation lives in TripTabs instead, so this bar never has to swap.

export function BottomNav() {
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center h-16">
                {mainNavItems.map(({ icon: Icon, label, path, end }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={end}
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
