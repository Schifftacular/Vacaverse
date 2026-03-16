import { supabase } from '../lib/supabase';

export const createTrip = async (userId: string, tripData: {
    title: string; start_date: string; end_date: string; image: string; budget: number;
}): Promise<string> => {
    const { data, error } = await supabase
        .from('trips')
        .insert({ user_id: userId, ...tripData })
        .select('id')
        .single();
    if (error) throw error;
    return data.id;
};

export const updateTrip = async (tripId: string, data: Record<string, unknown>) => {
    const { error } = await supabase.from('trips').update(data).eq('id', tripId);
    if (error) throw error;
};

export const deleteTrip = async (tripId: string) => {
    const { error } = await supabase.from('trips').delete().eq('id', tripId);
    if (error) throw error;
};

// Generic table operations for trip sub-resources
export const addTripItem = async (table: string, data: Record<string, unknown>): Promise<string> => {
    const { data: row, error } = await supabase.from(table).insert(data).select('id').single();
    if (error) throw error;
    return row.id;
};

export const updateTripItem = async (table: string, id: string, data: Record<string, unknown>) => {
    const { error } = await supabase.from(table).update(data).eq('id', id);
    if (error) throw error;
};

export const deleteTripItem = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
};

export const getTripItems = async <T>(table: string, tripId: string, orderBy = 'created_at'): Promise<T[]> => {
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('trip_id', tripId)
        .order(orderBy, { ascending: true });
    if (error) throw error;
    return (data || []) as T[];
};
