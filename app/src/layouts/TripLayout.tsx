import { Outlet, NavLink, Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useTrip } from '../contexts/TripContext';
import { useMemo } from 'react';

// Mock stats for now if not in Trip object
const mockStats = { budget: 72, tasks: 85, bookings: { done: 5, total: 7 } };

const tabs = [
    { name: 'Itinerary', path: '' }, // Index route
    { name: 'Budget', path: 'budget' },
    { name: 'Tasks', path: 'tasks' },
    { name: 'Meals', path: 'meals' },
    { name: 'Docs', path: 'documents' }, // Shortened for mobile
];

export default function TripLayout() {
    const { tripId } = useParams<{ tripId: string }>();
    const { trips } = useTrip();

    const trip = useMemo(() => trips.find(t => t.id === tripId), [trips, tripId]);

    if (!trip) {
        // Fallback for direct URL access before trips are loaded or if not found
        // In a real app we might fetch specific trip document here.
        // For now, if simple loading check:
        if (trips.length === 0) { // Assuming loading or empty
            return <div className="p-8 text-center text-gray-400">Loading trip...</div>;
        }
        return (
            <div className="p-8 text-center">
                <p className="text-gray-400">Trip not found</p>
                <Link to="/trips" className="text-brand-teal mt-4 inline-block">Back to Trips</Link>
            </div>
        );
    }

    return (
        <div className="pb-8 min-h-screen bg-[#0f172a]">
            {/* Header with Background */}
            <div className="relative h-48 bg-gradient-to-b from-gray-800 to-[#0f172a]">
                <Link to="/trips" className="absolute top-4 left-4 p-2 bg-black/30 rounded-full z-20">
                    <ArrowLeft size={24} className="text-white" />
                </Link>
                {trip.image && (
                    <img src={trip.image} alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />
                )}
                <div className="absolute bottom-6 left-4 right-4 z-10">
                    <h1 className="text-2xl font-bold text-white">{trip.title}</h1>
                    <p className="text-gray-300 text-sm flex items-center gap-2 mt-1">
                        <Calendar size={16} /> {trip.dates} • {trip.daysAway} days to go
                    </p>
                </div>
            </div>

            {/* Stats Summary Row (Visible on all tabs? Maybe. Let's keep it consistent.) */}
            <div className="grid grid-cols-3 gap-3 p-4">
                <div className="bg-[#1e293b] rounded-xl p-3 text-center border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Budget</div>
                    {/* Use real progress data if available, else mock */}
                    <div className="text-xl font-bold text-white">{trip.progress?.budget || mockStats.budget}%</div>
                </div>
                <div className="bg-[#1e293b] rounded-xl p-3 text-center border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Tasks</div>
                    <div className="text-xl font-bold text-white">{trip.progress?.tasks || mockStats.tasks}%</div>
                </div>
                <div className="bg-[#1e293b] rounded-xl p-3 text-center border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Bookings</div>
                    <div className="text-xl font-bold text-white">
                        {trip.progress?.bookings ? `${trip.progress.bookings.done}/${trip.progress.bookings.total}` : `${mockStats.bookings.done}/${mockStats.bookings.total}`}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 px-4 sticky top-0 bg-[#0f172a] z-30 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.name}
                        to={tab.path}
                        end={tab.path === ''} // Exact match for index
                        className={({ isActive }) => `px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                                ? 'text-brand-teal border-brand-teal'
                                : 'text-gray-400 border-transparent hover:text-gray-300'
                            }`}
                    >
                        {tab.name}
                    </NavLink>
                ))}
            </div>

            {/* Content Area */}
            <div className="pt-4">
                <Outlet context={{ trip }} />
            </div>
        </div>
    );
}
