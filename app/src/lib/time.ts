const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Itinerary event times are stored as 24h "HH:mm" (straight from
// <input type="time">). Display them 12h with AM/PM for a US-centric,
// cross-generational audience instead of raw "18:00".
export function formatEventTime(time: string): string {
    const match = HH_MM.exec(time);
    if (!match) return time;

    const hour24 = parseInt(match[1], 10);
    const minute = match[2];
    const period = hour24 < 12 ? 'AM' : 'PM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    return `${hour12}:${minute} ${period}`;
}
