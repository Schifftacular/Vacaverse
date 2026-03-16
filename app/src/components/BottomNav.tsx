import { Home, Users, Briefcase, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Family', path: '/family' },
    { icon: Briefcase, label: 'Trips', path: '/trips' },
    { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-primary)] border-t border-[var(--color-border)] pb-safe">
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
