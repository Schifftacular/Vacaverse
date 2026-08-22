export interface UserProfile {
    id: string;
    display_name: string;
    email: string;
    photo_url: string | null;
    created_at: string;
}

export interface Family {
    id: string;
    name: string;
    members: string[];
    created_by: string;
    created_at: string;
}

export interface Trip {
    id: string;
    user_id: string;
    family_id: string | null;
    title: string;
    start_date: string;
    end_date: string;
    image: string;
    budget: number;
    share_token?: string;
    created_at: string;
}

export interface TripEvent {
    id: string;
    trip_id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    created_by?: string;
}

export interface EventRsvp {
    event_id: string;
    user_id: string;
    status: 'going' | 'maybe' | 'not_going';
}

export interface Expense {
    id: string;
    trip_id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    paid_by?: string;
    created_at?: string;
}

export interface Task {
    id: string;
    trip_id: string;
    title: string;
    status: 'todo' | 'doing' | 'done';
    assigned_to?: string;
    created_by?: string;
}

export interface ActivityEntry {
    id: string;
    trip_id: string;
    user_id: string;
    action: string;
    detail: string;
    created_at: string;
}

export interface Comment {
    id: string;
    trip_id: string;
    user_id: string;
    text: string;
    created_at: string;
    edited_at?: string | null;
    parent_comment_id?: string | null;
}

export interface Poll {
    id: string;
    trip_id: string;
    question: string;
    options: string[];
    created_by: string;
    created_at: string;
}

export interface PollVote {
    poll_id: string;
    user_id: string;
    option_index: number;
}

export interface TripDocument {
    id: string;
    trip_id: string;
    name: string;
    size: number;
    type: string;
    storage_path: string;
    storage_url: string;
    uploaded_by: string;
    created_at: string;
}

export interface TripNote {
    id: string;
    trip_id: string;
    title: string;
    content_json: Record<string, unknown> | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}
