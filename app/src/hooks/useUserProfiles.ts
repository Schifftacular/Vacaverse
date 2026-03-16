import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
                const { data } = await supabase
                    .from('profiles')
                    .select('id, display_name, email, photo_url')
                    .in('id', toFetch);

                for (const profile of (data || [])) {
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
