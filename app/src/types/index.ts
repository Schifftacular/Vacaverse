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
    shareToken?: string;
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

export interface ActivityEntry {
    id: string;
    tripId: string;
    userId: string;
    action: string; // e.g., "added an event", "completed a task", "added an expense"
    detail: string; // e.g., "Snorkeling at 2pm"
    createdAt: any;
}

export interface Comment {
    id: string;
    userId: string;
    text: string;
    createdAt: any;
}

export interface Poll {
    id: string;
    question: string;
    options: string[];
    votes: Record<string, number>; // userId -> optionIndex
    createdBy: string;
    createdAt: any;
}

export interface TripDocument {
    id: string;
    name: string;
    size: number; // bytes
    type: string; // MIME type
    storageUrl: string; // Firebase Storage download URL
    uploadedBy: string; // userId
    createdAt: any;
}
