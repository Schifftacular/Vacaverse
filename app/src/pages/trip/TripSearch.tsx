import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { Search, MessageCircle, CheckSquare, FileText, Loader2 } from 'lucide-react';
import type { Trip } from '../../types';

// The server wraps each matched term in the snippet with these control
// chars (never HTML tags) so we can safely render the highlight as plain
// React text nodes — no dangerouslySetInnerHTML on user-authored content.
const MARK_START = '';
const MARK_END = '';

interface CommentResult {
    type: 'comment';
    id: string;
    trip_id: string;
    text: string;
    user_id: string;
    created_at: string;
    parent_comment_id: string | null;
    snippet: string;
}

interface TaskResult {
    type: 'task';
    id: string;
    trip_id: string;
    title: string;
    status: 'todo' | 'doing' | 'done';
    assigned_to: string | null;
    created_at: string;
    snippet: string;
}

interface NoteResult {
    type: 'note';
    id: string;
    trip_id: string;
    title: string;
    created_by: string;
    updated_at: string;
    snippet: string;
}

type SearchResult = CommentResult | TaskResult | NoteResult;

const DEBOUNCE_MS = 300;

function renderSnippet(snippet: string) {
    const parts = snippet.split(new RegExp(`(${MARK_START}[^${MARK_END}]*${MARK_END})`));
    return parts.map((part, i) => {
        if (part.startsWith(MARK_START) && part.endsWith(MARK_END)) {
            const text = part.slice(1, -1);
            return (
                <mark key={i} className="bg-brand-teal/30 text-[var(--color-text-primary)] rounded-sm">
                    {text}
                </mark>
            );
        }
        return <Fragment key={i}>{part}</Fragment>;
    });
}

const formatDate = (timestamp: string): string => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function TripSearch() {
    const { trip } = useOutletContext<{ trip: Trip }>();
    const navigate = useNavigate();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(false);

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestSeq = useRef(0);

    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        const trimmed = query.trim();
        if (!trimmed) {
            requestSeq.current++; // invalidate any in-flight request so its response can't land after we've cleared
            setResults([]);
            setLoading(false);
            setSearched(false);
            setError(false);
            return;
        }

        debounceTimer.current = setTimeout(async () => {
            const seq = ++requestSeq.current;
            setLoading(true);
            setError(false);
            try {
                const res = await fetch(`/api/search/${trip.id}?q=${encodeURIComponent(trimmed)}`, {
                    credentials: 'include',
                });
                const body = await res.json().catch(() => ({ data: [] }));
                if (seq !== requestSeq.current) return; // stale response, a newer search is in flight
                if (!res.ok) throw new Error(body.error || 'Search failed');
                setResults(body.data || []);
                setSearched(true);
            } catch (err) {
                if (seq !== requestSeq.current) return;
                console.error('Search failed:', err);
                setError(true);
                setResults([]);
            } finally {
                if (seq === requestSeq.current) setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [query, trip?.id]);

    const authorIds = useMemo(() => {
        const ids = new Set<string>();
        results.forEach(r => {
            if (r.type === 'comment') ids.add(r.user_id);
            if (r.type === 'note') ids.add(r.created_by);
        });
        return Array.from(ids);
    }, [results]);

    const { profiles } = useUserProfiles(authorIds);

    const goTo = (result: SearchResult) => {
        if (result.type === 'comment') navigate(`/trips/${trip.id}/feed`);
        if (result.type === 'task') navigate(`/trips/${trip.id}/tasks`);
        if (result.type === 'note') navigate(`/trips/${trip.id}/notes`);
    };

    return (
        <div className="px-4 pb-24">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Search</h2>

            <div className="relative mb-6">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search comments, tasks, and notes..."
                    autoFocus
                    className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-3 text-[var(--color-text-primary)] text-base focus:outline-none focus:border-brand-teal"
                />
                {loading && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
                )}
            </div>

            {!query.trim() && (
                <div className="text-center py-16 text-gray-500">
                    <Search size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Search this trip's comments, tasks, and notes.</p>
                </div>
            )}

            {query.trim() && error && (
                <div className="text-center py-16 text-red-400">
                    <p>Something went wrong. Try again.</p>
                </div>
            )}

            {query.trim() && !error && searched && !loading && results.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                    <p>No results for "{query.trim()}"</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="space-y-2">
                    {results.map(result => {
                        const icon =
                            result.type === 'comment' ? MessageCircle : result.type === 'task' ? CheckSquare : FileText;
                        const Icon = icon;
                        const author =
                            result.type === 'comment'
                                ? profiles.get(result.user_id)
                                : result.type === 'note'
                                    ? profiles.get(result.created_by)
                                    : null;

                        return (
                            <button
                                key={`${result.type}-${result.id}`}
                                onClick={() => goTo(result)}
                                className="w-full text-left bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4 flex items-start gap-3 hover:border-brand-teal/50 transition-colors"
                            >
                                <div className="w-9 h-9 rounded-lg bg-[var(--color-bg-primary)] flex items-center justify-center shrink-0">
                                    <Icon size={16} className="text-brand-teal" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase tracking-wide text-gray-500">
                                            {result.type === 'comment' ? 'Comment' : result.type === 'task' ? 'Task' : 'Note'}
                                        </span>
                                        {result.type === 'task' && (
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-full ${result.status === 'done'
                                                    ? 'bg-gray-800 text-gray-500'
                                                    : result.status === 'doing'
                                                        ? 'bg-yellow-900/40 text-yellow-400'
                                                        : 'bg-gray-800 text-gray-400'
                                                    }`}
                                            >
                                                {result.status === 'done' ? 'Done' : result.status === 'doing' ? 'In progress' : 'To do'}
                                            </span>
                                        )}
                                    </div>
                                    {(result.type === 'task' || result.type === 'note') && (
                                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate mt-0.5">
                                            {result.title}
                                        </p>
                                    )}
                                    <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 line-clamp-2 break-words">
                                        {renderSnippet(result.snippet)}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {author && `${author.display_name} · `}
                                        {formatDate(result.type === 'note' ? result.updated_at : result.created_at)}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
