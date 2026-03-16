import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

export function MainLayout() {
    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans flex flex-col">
            <main className="flex-1 pb-20 overflow-y-auto">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}
