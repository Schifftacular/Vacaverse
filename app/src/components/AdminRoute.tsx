import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Mirrors ProtectedRoute's guard shape, with an added role check. Client-side
// only — the real gate is server/auth.js's requireAdmin middleware on every
// /api/admin/* route; this just keeps a non-admin from seeing the admin UI
// shell at all.
export function AdminRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (!user.is_admin) return <Navigate to="/" replace />;

    return <Outlet />;
}
