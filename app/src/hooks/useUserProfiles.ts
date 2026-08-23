import { useState, useEffect, useSyncExternalStore } from 'react';

interface UserProfile {
    id: string;
    display_name: string;
    email: string;
    photo_url: string | null;
}

const profileCache = new Map<string, UserProfile>();
const listeners = new Set<() => void>();
let cacheVersion = 0;

function notifyListeners() {
    cacheVersion++;
    listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

// Called after a profile is edited (see AuthContext.updateProfile) so every
// mounted useUserProfiles consumer picks up the change immediately instead
// of showing a stale cached name/photo until a full page reload.
export function updateCachedProfile(id: string, patch: Partial<UserProfile>) {
    const existing = profileCache.get(id);
    if (existing) {
        profileCache.set(id, { ...existing, ...patch });
        notifyListeners();
    }
}

export function useUserProfiles(userIds: string[]): { profiles: Map<string, UserProfile>; loading: boolean } {
    const [fetchedProfiles, setFetchedProfiles] = useState<Map<string, UserProfile>>(new Map());
    const [loading, setLoading] = useState(true);

    // Forces a re-render whenever the shared cache changes (e.g. a
    // display_name edit) so already-mounted consumers reflect it below.
    useSyncExternalStore(subscribe, () => cacheVersion);

    useEffect(() => {
        if (userIds.length === 0) { setLoading(false); return; }

        const fetchProfiles = async () => {
            const result = new Map<string, UserProfile>();
            const toFetch: string[] = [];

            for (const uid of userIds) {
                if (profileCache.has(uid)) {
                    result.set(uid, profileCache.get(uid)!);
                } else {
                    toFetch.push(uid);
                }
            }

            if (toFetch.length > 0) {
                const res = await fetch(`/api/profiles?ids=${toFetch.join(',')}`, { credentials: 'include' });
                const body = await res.json().catch(() => ({ data: [] }));
                const data: UserProfile[] = body.data || [];

                for (const profile of data) {
                    profileCache.set(profile.id, profile);
                    result.set(profile.id, profile);
                }

                // Fallback for missing profiles
                for (const uid of toFetch) {
                    if (!result.has(uid)) {
                        const fallback: UserProfile = { id: uid, display_name: 'Unknown', email: '', photo_url: null };
                        result.set(uid, fallback);
                    }
                }
            }

            setFetchedProfiles(result);
            setLoading(false);
        };

        fetchProfiles();
    }, [userIds.join(',')]);

    // Pure per-render derivation, not its own effect: prefer whatever's
    // currently cached (freshest, post-edit) over what this hook fetched.
    const profiles = new Map(fetchedProfiles);
    for (const id of userIds) {
        const cached = profileCache.get(id);
        if (cached) profiles.set(id, cached);
    }

    return { profiles, loading };
}
