export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    createdAt: number;
}

export interface Family {
    id: string;
    name: string;
    members: string[];
    admins: string[];
    createdAt: number;
}

export interface Trip {
    id: string;
    userId: string;
    familyId: string | null;
    title: string;
    startDate: string;
    endDate: string;
    image: string;
    budget: number;
    createdAt: number;
}

export interface TripEvent {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    createdBy?: string;
    rsvp?: Record<string, 'going' | 'maybe' | 'not_going'>; // userId -> status
}

export interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    paidBy?: string;
    createdAt?: any;
}

export interface Task {
    id: string;
    title: string;
    status: 'todo' | 'doing' | 'done';
    assignedTo?: string;
    createdBy?: string;
}
