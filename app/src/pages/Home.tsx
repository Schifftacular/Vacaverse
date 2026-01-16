import { CheckCircle2, Circle, Utensils, Plane, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { Section } from '../components/Section';
import { TripCard } from '../components/TripCard';

function ActivityItem({ icon: Icon, title, date, color }: { icon: any, title: string, date: string, color: string }) {
    return (
        <div className="flex items-center space-x-4 mb-4 last:mb-0">
            <div className={clsx("p-2 rounded-full", color)}>
                <Icon size={20} className="text-white" />
            </div>
            <div>
                <h4 className="font-medium text-white">{title}</h4>
                <p className="text-sm text-gray-400">{date}</p>
            </div>
        </div>
    );
}

function TaskItem({ completed, title }: { completed: boolean; title: string }) {
    return (
        <div className="flex items-center space-x-3 mb-3 last:mb-0">
            {completed ? (
                <CheckCircle2 className="text-yellow-400" size={20} />
            ) : (
                <Circle className="text-gray-500" size={20} />
            )}
            <span className={clsx("text-sm", completed ? "text-gray-400 line-through" : "text-white")}>
                {title}
            </span>
        </div>
    );
}

export default function Home() {
    return (
        <div className="pb-8">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-[#0f172a] sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-white">VacaVerse</h1>
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-brand-teal">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" alt="Avatar" />
                </div>
            </div>

            <div className="px-4 mb-2">
                <h2 className="text-lg font-semibold text-brand-teal">Upcoming Vacations</h2>
            </div>

            <TripCard
                title="Hawaii 2024"
                dates="June 10 - June 20"
                days={15}
                hours={10}
                minutes={30}
                image="https://images.unsplash.com/photo-1542259688-c4efc0399d9b?auto=format&fit=crop&q=80&w=800"
            />

            <Section title="Upcoming Activities">
                <ActivityItem
                    icon={Plane}
                    title="Flight to HNL"
                    date="June 10, 8:00 AM"
                    color="bg-orange-500"
                />
                <ActivityItem
                    icon={Utensils}
                    title="Luau Dinner"
                    date="June 11, 7:00 PM"
                    color="bg-yellow-600"
                />
            </Section>

            <Section title="My Tasks">
                <TaskItem completed={true} title="Book rental car" />
                <TaskItem completed={false} title="Buy sunscreen" />
                <TaskItem completed={false} title="Confirm hotel booking" />
            </Section>

            <Section title="Recent Activity">
                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" className="w-8 h-8 rounded-full bg-gray-600" alt="User" />
                        <p className="text-sm text-gray-300">
                            <span className="font-bold text-white">Jane</span> added 'Snorkeling' to the Hawaii trip.
                        </p>
                    </div>
                    <div className="flex items-start space-x-3">
                        <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" className="w-8 h-8 rounded-full bg-gray-600" alt="User" />
                        <p className="text-sm text-gray-300">
                            <span className="font-bold text-white">Mark</span> booked the 'Mountain Cabin' for the retreat.
                        </p>
                    </div>
                </div>
            </Section>

            {/* FAB */}
            <button className="fixed bottom-20 right-4 w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg text-black hover:bg-yellow-500 transition-colors">
                <Plus size={32} />
            </button>
        </div>
    );
}
