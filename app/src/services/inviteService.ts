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

export const createTripEmailInvite = async (tripId: string, email: string): Promise<void> => {
    await apiFetch('/invites/email', {
        method: 'POST',
        body: JSON.stringify({ target_type: 'trip', trip_id: tripId, email }),
    });
};

export const createFamilyEmailInvite = async (familyId: string, email: string): Promise<void> => {
    await apiFetch('/invites/email', {
        method: 'POST',
        body: JSON.stringify({ target_type: 'family', family_id: familyId, email }),
    });
};

export interface EmailInviteLookup {
    targetType: 'trip' | 'family';
    tripId: string | null;
    familyId: string | null;
    name: string;
    email: string;
}

export const lookupEmailInvite = async (token: string): Promise<EmailInviteLookup | null> => {
    return apiFetch(`/invites/email/lookup/${encodeURIComponent(token)}`);
};

export const acceptEmailInvite = async (
    token: string
): Promise<{ targetType: 'trip' | 'family'; tripId: string | null; familyId: string | null }> => {
    return apiFetch('/invites/email/accept', { method: 'POST', body: JSON.stringify({ token }) });
};
