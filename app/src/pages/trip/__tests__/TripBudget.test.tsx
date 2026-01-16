import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TripBudget from '../TripBudget';
import { TripProvider } from '../../../contexts/TripContext';

// Mock Recharts to avoid sizing issues in JSDOM
vi.mock('recharts', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div style={{ width: 800, height: 800 }}>{children}</div>,
        PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        Pie: () => <div>Pie</div>,
        Cell: () => <div>Cell</div>,
        Legend: () => <div>Legend</div>,
        Tooltip: () => <div>Tooltip</div>
    };
});

// Mock TripContext
vi.mock('../../../contexts/TripContext', () => ({
    TripProvider: ({ children }: any) => <div>{children}</div>,
    useTrip: () => ({
        currentTrip: { id: '1', title: 'Test Trip' }
    })
}));

describe('TripBudget', () => {
    it('renders budget summary', () => {
        render(
            <TripProvider>
                <TripBudget />
            </TripProvider>
        );
        expect(screen.getByText('Trip Budget')).toBeInTheDocument();
        expect(screen.getByText('Total Budget')).toBeInTheDocument();
    });

    it('renders expenses list', () => {
        render(
            <TripProvider>
                <TripBudget />
            </TripProvider>
        );
        expect(screen.getByText('Resort Booking')).toBeInTheDocument();
        expect(screen.getByText('Flight Tickets')).toBeInTheDocument();
    });
});
