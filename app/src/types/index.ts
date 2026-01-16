export interface Family {
    id: string;
    name: string;
    members: string[]; // User IDs
    admins: string[]; // User IDs
    createdAt: number;
}

export interface Trip {
    id: string;
    userId: string; // Creator
    familyId?: string; // Optional for now, but goal is to have all trips belong to a family
    title: string;
    dates: string;
    daysAway: number;
    image: string;
    progress: {
        budget: number;
        tasks: number;
        bookings: { done: number; total: number };
    };
    createdAt: number;
}
