import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FamilyProvider, useFamily } from '../FamilyContext';
import * as AuthContextModule from '../AuthContext';

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
    addDoc: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    arrayUnion: vi.fn()
}));

// Mock AuthContext
vi.mock('../AuthContext', () => ({
    useAuth: vi.fn(),
}));

const TestComponent = () => {
    const { families, loading, createFamily } = useFamily();
    return (
        <div>
            {loading ? 'Loading...' : 'Loaded'}
            <ul>
                {families.map(f => <li key={f.id}>{f.name}</li>)}
            </ul>
            <button onClick={() => createFamily('New Family')}>Create</button>
        </div>
    );
};

describe('FamilyContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders children and handles loading state', async () => {
        (AuthContextModule.useAuth as any).mockReturnValue({ user: { uid: 'test-user' } });

        // Mock onSnapshot to return empty list immediately
        const { onSnapshot } = await import('firebase/firestore');
        (onSnapshot as any).mockImplementation((query: any, callback: any) => {
            callback({ forEach: () => { } });
            return () => { };
        });

        render(
            <FamilyProvider>
                <TestComponent />
            </FamilyProvider>
        );

        expect(screen.getByText('Loaded')).toBeInTheDocument();
    });

    it('fetches families for authenticated user', async () => {
        (AuthContextModule.useAuth as any).mockReturnValue({ user: { uid: 'test-user' } });

        const mockFamilies = [
            { id: '1', name: 'Family 1', data: () => ({ name: 'Family 1', members: ['test-user'] }) },
            { id: '2', name: 'Family 2', data: () => ({ name: 'Family 2', members: ['test-user'] }) }
        ];

        const { onSnapshot } = await import('firebase/firestore');
        (onSnapshot as any).mockImplementation((query: any, callback: any) => {
            callback({
                forEach: (fn: any) => mockFamilies.forEach(fn)
            });
            return () => { };
        });

        render(
            <FamilyProvider>
                <TestComponent />
            </FamilyProvider>
        );

        expect(await screen.findByText('Family 1')).toBeInTheDocument();
        expect(await screen.findByText('Family 2')).toBeInTheDocument();
    });
});
