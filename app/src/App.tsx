import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/FamilyContext';
import { TripProvider } from './contexts/TripContext';
import { ToastProvider } from './contexts/ToastContext';
import { FeedbackProvider } from './contexts/FeedbackContext';

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
import TripFeed from './pages/trip/TripFeed';
import TripNotes from './pages/trip/TripNotes';
import TripSearch from './pages/trip/TripSearch';
import TripPolls from './pages/trip/TripPolls';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Join from './pages/Join';
import TripPreview from './pages/TripPreview';

export default function App() {
    return (
        <ErrorBoundary>
            <MotionConfig reducedMotion="user">
                <ToastProvider>
                    <AuthProvider>
                        <FamilyProvider>
                            <TripProvider>
                                <FeedbackProvider>
                                    <BrowserRouter>
                                        <Routes>
                                            {/* Public routes */}
                                            <Route path="/login" element={<MainLayout />}>
                                                <Route index element={<Login />} />
                                            </Route>
                                            <Route path="/join" element={<Join />} />
                                            <Route path="/trip/preview/:shareToken" element={<TripPreview />} />

                                            {/* Protected routes */}
                                            <Route element={<ProtectedRoute />}>
                                                <Route path="/" element={<MainLayout />}>
                                                    <Route index element={<Home />} />
                                                    <Route path="family" element={<Family />} />
                                                    <Route path="trips" element={<Trips />} />
                                                    <Route path="profile" element={<Profile />} />
                                                    <Route path="trips/:tripId" element={<TripLayout />}>
                                                        <Route index element={<TripItinerary />} />
                                                        <Route path="tasks" element={<TripTasks />} />
                                                        <Route path="budget" element={<TripBudget />} />
                                                        <Route path="feed" element={<TripFeed />} />
                                                        <Route path="notes" element={<TripNotes />} />
                                                        <Route path="search" element={<TripSearch />} />
                                                        <Route path="documents" element={<TripDocuments />} />
                                                        <Route path="polls" element={<TripPolls />} />
                                                    </Route>
                                                </Route>
                                            </Route>
                                        </Routes>
                                    </BrowserRouter>
                                </FeedbackProvider>
                            </TripProvider>
                        </FamilyProvider>
                    </AuthProvider>
                </ToastProvider>
            </MotionConfig>
        </ErrorBoundary>
    );
}
