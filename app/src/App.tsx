import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/FamilyContext';
import { TripProvider } from './contexts/TripContext';

import { MainLayout } from './layouts/MainLayout';
import TripLayout from './layouts/TripLayout';
import Home from './pages/Home';
import Family from './pages/Family';
import Trips from './pages/Trips';
import TripTasks from './pages/trip/TripTasks';
import TripBudget from './pages/trip/TripBudget';
import TripItinerary from './pages/trip/TripItinerary';
import TripMeals from './pages/trip/TripMeals';
import TripDocuments from './pages/trip/TripDocuments';
import Discover from './pages/Discover';
import Profile from './pages/Profile';

import { ToastProvider } from './contexts/ToastContext';

export default function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <FamilyProvider>
                    <TripProvider>
                        <BrowserRouter>
                            <Routes>
                                <Route path="/" element={<MainLayout />}>
                                    <Route index element={<Home />} />
                                    <Route path="family" element={<Family />} />
                                    <Route path="trips" element={<Trips />} />
                                    <Route path="trips/:tripId" element={<TripLayout />}>
                                        <Route index element={<TripItinerary />} />
                                        <Route path="tasks" element={<TripTasks />} />
                                        <Route path="budget" element={<TripBudget />} />
                                        <Route path="meals" element={<TripMeals />} />
                                        <Route path="documents" element={<TripDocuments />} />
                                    </Route>
                                    <Route path="discover" element={<Discover />} />
                                    <Route path="profile" element={<Profile />} />
                                </Route>
                            </Routes>
                        </BrowserRouter>
                    </TripProvider>
                </FamilyProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
