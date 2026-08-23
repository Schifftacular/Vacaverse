import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';

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
    const version = useSyncExternalStore(subscribe, () => cacheVersion);

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

    // Memoized so the returned Map keeps a stable identity across unrelated
    // re-renders (e.g. FamilyTree's layout effect depends on this by
    // reference) — only recomputed when the fetch result, the id list, or
    // the cache itself actually changes.
    const profiles = useMemo(() => {
        const merged = new Map(fetchedProfiles);
        for (const id of userIds) {
            const cached = profileCache.get(id);
            if (cached) merged.set(id, cached);
        }
        return merged;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchedProfiles, userIds.join(','), version]);

    return { profiles, loading };
}
