import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TripTasks from '../TripTasks';
import { TripProvider } from '../../../contexts/TripContext';

// Mock TripContext
vi.mock('../../../contexts/TripContext', () => ({
    TripProvider: ({ children }: any) => <div>{children}</div>,
    useTrip: () => ({
        currentTrip: { id: '1', title: 'Test Trip' }
    })
}));

describe('TripTasks', () => {
    it('renders tasks board', () => {
        render(
            <TripProvider>
                <TripTasks />
            </TripProvider>
        );
        expect(screen.getByText('Tasks Board')).toBeInTheDocument();
        expect(screen.getByText('To Do')).toBeInTheDocument();
    });

    it('renders tasks', () => {
        render(
            <TripProvider>
                <TripTasks />
            </TripProvider>
        );
        expect(screen.getByText('Book rental car')).toBeInTheDocument();
    });
});
