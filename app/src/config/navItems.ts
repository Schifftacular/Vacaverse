import {
    Home, Users, Briefcase, User,
    MapPin, MessageCircle, FileText, Search, ListChecks, DollarSign, FolderOpen, BarChart2,
    type LucideIcon,
} from 'lucide-react';

export interface NavItem {
    icon: LucideIcon;
    label: string;
    path: string;
    end?: boolean;
}

// Shared between BottomNav (mobile) and Sidebar (desktop, see issue #9) so
// the two navigation surfaces can never drift out of sync with each other.
export const mainNavItems: NavItem[] = [
    { icon: Home, label: 'Home', path: '/', end: true },
    { icon: Users, label: 'Family', path: '/family' },
    { icon: Briefcase, label: 'Trips', path: '/trips' },
    { icon: User, label: 'Profile', path: '/profile' },
];

// The 4 highest-traffic trip surfaces — always visible on mobile (see #7);
// on desktop there's room to show the full 8-item list instead (below).
export const primaryTripNavItems: NavItem[] = [
    { icon: MapPin, label: 'Itinerary', path: '', end: true },
    { icon: MessageCircle, label: 'Feed', path: 'feed' },
    { icon: ListChecks, label: 'Tasks', path: 'tasks' },
    { icon: DollarSign, label: 'Budget', path: 'budget' },
];

// "Files" (nav) / "Documents" (header) / `/documents` (route) named three
// different things for the same surface — Documents wins everywhere.
export const moreTripNavItems: NavItem[] = [
    { icon: FileText, label: 'Notes', path: 'notes' },
    { icon: Search, label: 'Search', path: 'search' },
    { icon: FolderOpen, label: 'Documents', path: 'documents' },
    { icon: BarChart2, label: 'Polls', path: 'polls' },
];

// Desktop has the vertical room mobile doesn't — no need for the "More"
// split there, so Sidebar shows all 8 trip surfaces as one list.
export const allTripNavItems: NavItem[] = [...primaryTripNavItems, ...moreTripNavItems];
