import {
    Home, Users, Briefcase, User,
    MapPin, MessageCircle, FileText, Search, ListChecks, DollarSign, FolderOpen, BarChart2,
} from 'lucide-react';
import { NavLink, useMatch } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Family', path: '/family' },
    { icon: Briefcase, label: 'Trips', path: '/trips' },
    { icon: User, label: 'Profile', path: '/profile' },
];

// The 8 primary trip surfaces, reachable in one tap from anywhere while inside
// a trip. Icon-only (no labels) so all 8 fit a 390px-wide bottom nav without
// horizontal scrolling — each column is ~49px, above the 44px touch minimum.
const tripNavItems = [
    { icon: MapPin, label: 'Itinerary', path: '', end: true },
    { icon: MessageCircle, label: 'Feed', path: 'feed' },
    { icon: FileText, label: 'Notes', path: 'notes' },
    { icon: Search, label: 'Search', path: 'search' },
    { icon: ListChecks, label: 'Tasks', path: 'tasks' },
    { icon: DollarSign, label: 'Budget', path: 'budget' },
    { icon: FolderOpen, label: 'Files', path: 'documents' },
    { icon: BarChart2, label: 'Polls', path: 'polls' },
];

export function BottomNav() {
    const tripMatch = useMatch('/trips/:tripId/*');
    const tripId = tripMatch?.params.tripId;

    if (tripId) {
        return (
            <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-primary)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-around items-center h-16">
                    {tripNavItems.map(({ icon: Icon, label, path, end }) => (
                        <NavLink
                            key={path}
                            to={`/trips/${tripId}/${path}`}
                            end={end}
                            title={label}
                            aria-label={label}
                            className={({ isActive }) =>
                                twMerge(
                                    'flex flex-col items-center justify-center h-full flex-1 min-w-11 transition-colors',
                                    isActive ? 'text-brand-teal' : 'text-gray-500 hover:text-gray-300'
                                )
                            }
                        >
                            <Icon size={20} />
                            <span className="sr-only">{label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>
        );
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-primary)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center h-16">
                {navItems.map(({ icon: Icon, label, path }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            twMerge(
                                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                                isActive ? 'text-brand-teal' : 'text-gray-500 hover:text-gray-300'
                            )
                        }
                    >
                        <Icon size={24} />
                        <span className="text-xs font-medium">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
