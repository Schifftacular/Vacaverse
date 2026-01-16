import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TripProvider, useTrip } from '../TripContext';
import * as AuthContextModule from '../AuthContext';
import * as FamilyContextModule from '../FamilyContext';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
    db: {},
    auth: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    addDoc: vi.fn()
}));

// Mock Contexts
vi.mock('../AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../FamilyContext', () => ({
    useFamily: vi.fn(),
}));

const TestComponent = () => {
    const { trips, loading } = useTrip();
    return (
        <div>
            {loading ? 'Loading...' : 'Loaded'}
            <ul>
                {trips.map(t => <li key={t.id}>{t.title}</li>)}
            </ul>
        </div>
    );
};

describe('TripContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches trips for current family', async () => {
        (AuthContextModule.useAuth as any).mockReturnValue({ user: { uid: 'test-user' } });
        (FamilyContextModule.useFamily as any).mockReturnValue({ currentFamily: { id: 'family-1' } });

        const mockTrips = [
            { id: '1', title: 'Hawaii 2024', data: () => ({ title: 'Hawaii 2024', familyId: 'family-1' }) }
        ];

        const { onSnapshot } = await import('firebase/firestore');
        (onSnapshot as any).mockImplementation((query: any, callback: any) => {
            callback({
                forEach: (fn: any) => mockTrips.forEach(fn)
            });
            return () => { };
        });

        render(
            <TripProvider>
                <TestComponent />
            </TripProvider>
        );

        expect(await screen.findByText('Hawaii 2024')).toBeInTheDocument();
    });

    it('fetches personal trips if no family selected', async () => {
        (AuthContextModule.useAuth as any).mockReturnValue({ user: { uid: 'test-user' } });
        (FamilyContextModule.useFamily as any).mockReturnValue({ currentFamily: null });

        const mockTrips = [
            { id: '2', title: 'Solo Trip', data: () => ({ title: 'Solo Trip', userId: 'test-user' }) }
        ];

        const { onSnapshot } = await import('firebase/firestore');
        (onSnapshot as any).mockImplementation((query: any, callback: any) => {
            callback({
                forEach: (fn: any) => mockTrips.forEach(fn)
            });
            return () => { };
        });

        render(
            <TripProvider>
                <TestComponent />
            </TripProvider>
        );

        expect(await screen.findByText('Solo Trip')).toBeInTheDocument();
    });
});
