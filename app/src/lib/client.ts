import { io, type Socket } from 'socket.io-client';

const API_BASE = '/api';

async function apiFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        return { data: null, error: new Error(body.error || res.statusText) };
    }
    return { data: body.data, error: null };
}

// --- Minimal query builder mimicking the subset of the supabase-js client this app used ---

type Filter = { kind: 'eq' | 'in'; col: string; value: unknown };
type Order = { col: string; ascending: boolean };

class QueryBuilder<T = any> implements PromiseLike<{ data: T; error: Error | null }> {
    private table: string;
    private filters: Filter[] = [];
    private orders: Order[] = [];
    private limitN: number | null = null;
    private wantSingle = false;
    private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
    private payload: Record<string, unknown> | null = null;

    constructor(table: string) {
        this.table = table;
    }

    select(_columns = '*') {
        return this;
    }

    eq(col: string, value: unknown) {
        this.filters.push({ kind: 'eq', col, value });
        return this;
    }

    in(col: string, values: unknown[]) {
        this.filters.push({ kind: 'in', col, value: values });
        return this;
    }

    order(col: string, opts?: { ascending?: boolean }) {
        this.orders.push({ col, ascending: opts?.ascending !== false });
        return this;
    }

    limit(n: number) {
        this.limitN = n;
        return this;
    }

    single() {
        this.wantSingle = true;
        return this;
    }

    insert(payload: Record<string, unknown>) {
        this.op = 'insert';
        this.payload = payload;
        return this;
    }

    update(payload: Record<string, unknown>) {
        this.op = 'update';
        this.payload = payload;
        return this;
    }

    upsert(payload: Record<string, unknown>) {
        this.op = 'upsert';
        this.payload = payload;
        return this;
    }

    delete() {
        this.op = 'delete';
        return this;
    }

    private queryString(): string {
        const params = new URLSearchParams();
        for (const f of this.filters) {
            if (f.kind === 'eq') params.append(`eq.${f.col}`, String(f.value));
            if (f.kind === 'in') params.append(`in.${f.col}`, (f.value as unknown[]).join(','));
        }
        for (const o of this.orders) {
            params.append('order', `${o.col}.${o.ascending ? 'asc' : 'desc'}`);
        }
        if (this.limitN != null) params.set('limit', String(this.limitN));
        if (this.op === 'upsert') params.set('upsert', 'true');
        const qs = params.toString();
        return qs ? `?${qs}` : '';
    }

    private eqFilter(col: string) {
        return this.filters.find(f => f.kind === 'eq' && f.col === col)?.value as string | undefined;
    }

    async execute(): Promise<{ data: any; error: Error | null }> {
        if (this.op === 'select') {
            const { data, error } = await apiFetch(`/db/${this.table}${this.queryString()}`);
            if (error) return { data: null, error };
            if (this.wantSingle) {
                return { data: (data as any[])[0] ?? null, error: (data as any[]).length ? null : new Error('No rows found') };
            }
            return { data, error: null };
        }

        if (this.op === 'insert' || this.op === 'upsert') {
            const { data, error } = await apiFetch(`/db/${this.table}${this.queryString()}`, {
                method: 'POST',
                body: JSON.stringify(this.payload),
            });
            return { data: this.wantSingle ? data : data ? [data] : [], error };
        }

        if (this.op === 'update') {
            const id = this.eqFilter('id');
            const path = id ? `/db/${this.table}/${id}` : `/db/${this.table}${this.queryString()}`;
            const { data, error } = await apiFetch(path, { method: 'PATCH', body: JSON.stringify(this.payload) });
            return { data, error };
        }

        if (this.op === 'delete') {
            const id = this.eqFilter('id');
            const path = id ? `/db/${this.table}/${id}` : `/db/${this.table}${this.queryString()}`;
            const { data, error } = await apiFetch(path, { method: 'DELETE' });
            return { data, error };
        }

        return { data: null, error: new Error('Unsupported operation') };
    }

    then<TResult1 = { data: T; error: Error | null }, TResult2 = never>(
        onfulfilled?: ((value: { data: T; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): PromiseLike<TResult1 | TResult2> {
        return this.execute().then(onfulfilled as any, onrejected as any);
    }

    // Supabase's client throws on .throwOnError(); this app used it in a couple of fire-and-forget inserts.
    async throwOnError() {
        const { error } = await this.execute();
        if (error) throw error;
    }
}

export const db = {
    from<T = any>(table: string) {
        return new QueryBuilder<T>(table);
    },
};

// --- Storage: local file uploads served from /uploads/<bucket>/<path> ---

export const storage = {
    from(bucket: string) {
        return {
            async upload(path: string, file: File) {
                const form = new FormData();
                form.append('path', path);
                form.append('file', file);
                const res = await fetch(`${API_BASE}/upload/${bucket}`, {
                    method: 'POST',
                    credentials: 'include',
                    body: form,
                });
                const body = await res.json().catch(() => ({}));
                if (!res.ok) return { data: null, error: new Error(body.error || res.statusText) };
                return { data: body.data, error: null };
            },
            getPublicUrl(path: string) {
                return { data: { publicUrl: `/uploads/${bucket}/${path}` } };
            },
            async remove(paths: string[]) {
                const res = await fetch(`${API_BASE}/upload/${bucket}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paths }),
                });
                if (!res.ok) throw new Error('Failed to remove file(s)');
            },
        };
    },
};

// --- Auth ---

export interface AppUser {
    id: string;
    email: string;
    display_name: string;
    photo_url: string | null;
    created_at: string;
    is_admin: boolean;
    is_suspended: boolean;
}

export const auth = {
    async signUp(email: string, password: string, display_name?: string) {
        return apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, display_name }) });
    },
    async signIn(email: string, password: string) {
        return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    },
    async signOut() {
        return apiFetch('/auth/logout', { method: 'POST' });
    },
    async updateProfile(display_name: string) {
        return apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify({ display_name }) });
    },
    async me(): Promise<AppUser | null> {
        const { data } = await apiFetch('/auth/me');
        return data?.user ?? null;
    },
};

// --- Admin panel ---

export interface AdminStats {
    users: number;
    suspendedUsers: number;
    trips: number;
    families: number;
    newFeedback: number;
    storageBytes: number;
}

export interface AdminUser {
    id: string;
    email: string;
    display_name: string;
    photo_url: string | null;
    created_at: string;
    is_admin: boolean;
    is_suspended: boolean;
    tripCount?: number;
    familyCount?: number;
    storageBytes?: number;
}

export interface AdminTrip {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    owner_id: string;
    owner_email: string | null;
    owner_name: string | null;
    family_name: string | null;
    member_count: number;
    storage_bytes: number;
}

export interface FeedbackItem {
    id: string;
    user_id: string;
    email: string | null;
    type: 'bug' | 'idea' | 'general';
    text: string;
    url: string | null;
    user_agent: string | null;
    status: 'new' | 'triaged' | 'resolved';
    created_at: string;
}

export interface AuditLogEntry {
    id: string;
    admin_id: string;
    admin_email: string | null;
    admin_name: string | null;
    action: string;
    target_type: string;
    target_id: string | null;
    detail: string | null;
    created_at: string;
}

export const adminApi = {
    stats: () => apiFetch('/admin/stats') as Promise<{ data: AdminStats | null; error: Error | null }>,
    listUsers: (q = '') =>
        apiFetch(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`) as Promise<{ data: AdminUser[] | null; error: Error | null }>,
    getUser: (id: string) => apiFetch(`/admin/users/${id}`) as Promise<{ data: AdminUser | null; error: Error | null }>,
    suspendUser: (id: string) => apiFetch(`/admin/users/${id}/suspend`, { method: 'POST' }),
    reinstateUser: (id: string) => apiFetch(`/admin/users/${id}/reinstate`, { method: 'POST' }),
    forceLogout: (id: string) => apiFetch(`/admin/users/${id}/logout`, { method: 'POST' }),
    makeAdmin: (id: string) => apiFetch(`/admin/users/${id}/make-admin`, { method: 'POST' }),
    revokeAdmin: (id: string) => apiFetch(`/admin/users/${id}/revoke-admin`, { method: 'POST' }),
    listTrips: (q = '') =>
        apiFetch(`/admin/trips${q ? `?q=${encodeURIComponent(q)}` : ''}`) as Promise<{ data: AdminTrip[] | null; error: Error | null }>,
    listFeedback: (status = '') =>
        apiFetch(`/admin/feedback${status ? `?status=${status}` : ''}`) as Promise<{ data: FeedbackItem[] | null; error: Error | null }>,
    updateFeedbackStatus: (id: string, status: FeedbackItem['status']) =>
        apiFetch(`/admin/feedback/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    listAuditLog: () => apiFetch('/admin/audit-log') as Promise<{ data: AuditLogEntry[] | null; error: Error | null }>,
};

// --- Realtime socket singleton ---

let socketSingleton: Socket | null = null;

export function getSocket(): Socket {
    if (!socketSingleton) {
        socketSingleton = io({ path: '/socket.io', withCredentials: true, autoConnect: true });
    }
    return socketSingleton;
}
