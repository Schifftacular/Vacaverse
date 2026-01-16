import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

export function MainLayout() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans flex flex-col">
            <main className="flex-1 pb-20 overflow-y-auto">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}
