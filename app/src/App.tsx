import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/FamilyContext';
import { TripProvider } from './contexts/TripContext';
import { ToastProvider } from './contexts/ToastContext';

import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import TripLayout from './layouts/TripLayout';
import Home from './pages/Home';
import Family from './pages/Family';
import Trips from './pages/Trips';
import TripTasks from './pages/trip/TripTasks';
import TripBudget from './pages/trip/TripBudget';
import TripItinerary from './pages/trip/TripItinerary';
import TripDocuments from './pages/trip/TripDocuments';
import Profile from './pages/Profile';
import Join from './pages/Join';

export default function App() {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <AuthProvider>
                    <FamilyProvider>
                        <TripProvider>
                            <BrowserRouter>
                                <Routes>
                                    {/* Public routes */}
                                    <Route path="/profile" element={<MainLayout />}>
                                        <Route index element={<Profile />} />
                                    </Route>
                                    <Route path="/join" element={<Join />} />

                                    {/* Protected routes */}
                                    <Route element={<ProtectedRoute />}>
                                        <Route path="/" element={<MainLayout />}>
                                            <Route index element={<Home />} />
                                            <Route path="family" element={<Family />} />
                                            <Route path="trips" element={<Trips />} />
                                            <Route path="trips/:tripId" element={<TripLayout />}>
                                                <Route index element={<TripItinerary />} />
                                                <Route path="tasks" element={<TripTasks />} />
                                                <Route path="budget" element={<TripBudget />} />
                                                <Route path="documents" element={<TripDocuments />} />
                                            </Route>
                                        </Route>
                                    </Route>
                                </Routes>
                            </BrowserRouter>
                        </TripProvider>
                    </FamilyProvider>
                </AuthProvider>
            </ToastProvider>
        </ErrorBoundary>
    );
}
