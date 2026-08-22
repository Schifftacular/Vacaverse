import { useState, useEffect } from 'react';

interface UserProfile {
    id: string;
    display_name: string;
    email: string;
    photo_url: string | null;
}

const profileCache = new Map<string, UserProfile>();

export function useUserProfiles(userIds: string[]): { profiles: Map<string, UserProfile>; loading: boolean } {
    const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
    const [loading, setLoading] = useState(true);

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

            setProfiles(result);
            setLoading(false);
        };

        fetchProfiles();
    }, [userIds.join(',')]);

    return { profiles, loading };
}
