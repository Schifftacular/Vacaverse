import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { FeedbackWidget } from '../components/FeedbackWidget';

export function MainLayout() {
    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans flex flex-col">
            <main className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))]">
                <Outlet />
            </main>
            <BottomNav />
            <FeedbackWidget />
        </div>
    );
}
