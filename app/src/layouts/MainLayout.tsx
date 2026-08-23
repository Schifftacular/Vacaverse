import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Sidebar } from '../components/Sidebar';
import { FeedbackWidget } from '../components/FeedbackWidget';

// Below lg: single-column mobile stack with BottomNav (unchanged). At lg+:
// a fixed-width Sidebar replaces BottomNav and content gets a real max
// width instead of the mobile stack just stretching to fill 1440px (see
// issue #9) — flex layout so the content column doesn't need to know the
// sidebar's width itself.
export function MainLayout() {
    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1 overflow-y-auto pb-[calc(5rem_+_env(safe-area-inset-bottom))] lg:pb-8 bg-[image:radial-gradient(circle_at_top,_rgb(var(--shadow-tint)/0.06),_transparent_60%)]">
                    <div className="lg:max-w-3xl lg:mx-auto">
                        <Outlet />
                    </div>
                </main>
                <BottomNav />
            </div>
            <FeedbackWidget />
        </div>
    );
}
