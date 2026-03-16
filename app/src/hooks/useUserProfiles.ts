import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile } from '../types';

const profileCache = new Map<string, UserProfile>();

export function useUserProfiles(userIds: string[]): { profiles: Map<string, UserProfile>; loading: boolean } {
    const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userIds.length === 0) {
            setLoading(false);
            return;
        }

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

            for (const uid of toFetch) {
                try {
                    const snap = await getDoc(doc(db, 'users', uid));
                    if (snap.exists()) {
                        const profile = { uid, ...snap.data() } as UserProfile;
                        profileCache.set(uid, profile);
                        result.set(uid, profile);
                    } else {
                        const fallback: UserProfile = {
                            uid,
                            displayName: 'Unknown',
                            email: '',
                            photoURL: null,
                            createdAt: 0,
                        };
                        result.set(uid, fallback);
                    }
                } catch (error) {
                    console.error(`Failed to fetch profile for ${uid}:`, error);
                }
            }

            setProfiles(result);
            setLoading(false);
        };

        fetchProfiles();
    }, [userIds.join(',')]);

    return { profiles, loading };
}
