import { supabase } from '../lib/supabase';

export const logActivity = async (tripId: string, userId: string, action: string, detail: string) => {
    await supabase.from('activity').insert({ trip_id: tripId, user_id: userId, action, detail }).throwOnError();
};

export const subscribeToActivity = (
    tripId: string,
    callback: (entries: any[]) => void,
    maxEntries = 20
) => {
    // Initial fetch
    supabase
        .from('activity')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
        .limit(maxEntries)
        .then(({ data }) => callback(data || []));

    // Realtime
    const channel = supabase
        .channel(`activity-${tripId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity', filter: `trip_id=eq.${tripId}` },
            () => {
                supabase
                    .from('activity')
                    .select('*')
                    .eq('trip_id', tripId)
                    .order('created_at', { ascending: false })
                    .limit(maxEntries)
                    .then(({ data }) => callback(data || []));
            })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
};

export const subscribeToComments = (
    tripId: string,
    callback: (comments: any[]) => void
) => {
    supabase
        .from('comments')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
        .then(({ data }) => callback(data || []));

    const channel = supabase
        .channel(`comments-${tripId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `trip_id=eq.${tripId}` },
            () => {
                supabase
                    .from('comments')
                    .select('*')
                    .eq('trip_id', tripId)
                    .order('created_at', { ascending: true })
                    .then(({ data }) => callback(data || []));
            })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
};

export const addComment = async (tripId: string, userId: string, text: string) => {
    await supabase.from('comments').insert({ trip_id: tripId, user_id: userId, text }).throwOnError();
};
