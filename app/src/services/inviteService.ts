async function apiFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`/api${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || res.statusText);
    return body.data;
}

export const createFamilyInvite = async (familyId: string, _createdBy: string): Promise<string> => {
    const data = await apiFetch('/invites', { method: 'POST', body: JSON.stringify({ family_id: familyId }) });
    return data.code;
};

export const lookupInviteCode = async (code: string): Promise<{ familyId: string; familyName: string; inviteId: string } | null> => {
    return apiFetch(`/invites/lookup/${encodeURIComponent(code)}`);
};

export const markInviteUsed = async (inviteId: string): Promise<void> => {
    await apiFetch(`/invites/${inviteId}/use`, { method: 'POST' });
};
