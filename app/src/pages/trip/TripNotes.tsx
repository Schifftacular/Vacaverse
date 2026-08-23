import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
    getTripItems,
    addTripItem,
    updateTripItem,
    deleteTripItem,
} from '../../services/tripService';
import {
    Plus,
    FileText,
    ArrowLeft,
    Trash2,
    Bold,
    Italic,
    List,
    ListOrdered,
    CheckSquare,
    Heading2,
    Loader2,
} from 'lucide-react';
import { Panel, Button, EmptyState } from '../../components/ui/Concourse';
import type { Trip, TripNote } from '../../types';

const AUTOSAVE_DELAY = 1000;

const formatDate = (timestamp: string): string => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

// Pull a short plain-text preview out of a TipTap JSON document.
const previewText = (doc: Record<string, unknown> | null): string => {
    if (!doc) return '';
    let text = '';
    const walk = (node: any) => {
        if (text.length > 140) return;
        if (node?.type === 'text' && typeof node.text === 'string') {
            text += (text ? ' ' : '') + node.text;
        }
        if (Array.isArray(node?.content)) {
            for (const child of node.content) walk(child);
        }
    };
    walk(doc);
    return text.slice(0, 140);
};

function Toolbar({ editor }: { editor: Editor | null }) {
    if (!editor) return null;

    const buttons = [
        {
            label: 'Bold',
            icon: Bold,
            active: editor.isActive('bold'),
            onClick: () => editor.chain().focus().toggleBold().run(),
        },
        {
            label: 'Italic',
            icon: Italic,
            active: editor.isActive('italic'),
            onClick: () => editor.chain().focus().toggleItalic().run(),
        },
        {
            label: 'Heading',
            icon: Heading2,
            active: editor.isActive('heading', { level: 2 }),
            onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
            label: 'Bullet list',
            icon: List,
            active: editor.isActive('bulletList'),
            onClick: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
            label: 'Numbered list',
            icon: ListOrdered,
            active: editor.isActive('orderedList'),
            onClick: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
            label: 'Checklist',
            icon: CheckSquare,
            active: editor.isActive('taskList'),
            onClick: () => editor.chain().focus().toggleTaskList().run(),
        },
    ];

    return (
        <div className="flex items-center gap-2 px-2 py-2 border-b border-[var(--color-border)] overflow-x-auto">
            {buttons.map(({ label, icon: Icon, active, onClick }) => (
                <button
                    key={label}
                    type="button"
                    onClick={onClick}
                    aria-label={label}
                    aria-pressed={active}
                    className="min-w-11 min-h-11 -m-1 shrink-0 flex items-center justify-center"
                >
                    <span
                        className={`p-2 rounded-lg transition-colors ${
                            active
                                ? 'bg-brand-teal/20 text-brand-teal'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                        <Icon size={16} />
                    </span>
                </button>
            ))}
        </div>
    );
}

export default function TripNotes() {
    const { trip } = useOutletContext<{ trip: Trip }>();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [notes, setNotes] = useState<TripNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<TripNote | null>(null);

    const activeNote = useMemo(
        () => notes.find(n => n.id === activeNoteId) ?? null,
        [notes, activeNoteId]
    );

    // Refs so debounced saves and unmount-flush always see current values.
    const titleRef = useRef(title);
    titleRef.current = title;
    const activeNoteIdRef = useRef(activeNoteId);
    activeNoteIdRef.current = activeNoteId;
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!trip?.id) return;
        loadNotes();
    }, [trip?.id]);

    const loadNotes = async () => {
        try {
            const data = await getTripItems<TripNote>('notes', trip.id, 'updated_at');
            data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            setNotes(data);
        } catch (error) {
            console.error('Error loading notes:', error);
            showToast('Failed to load notes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const flushSave = useCallback(async (content: Record<string, unknown>) => {
        const id = activeNoteIdRef.current;
        if (!id) return;
        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
            saveTimer.current = null;
        }
        const now = new Date().toISOString();
        setSaving(true);
        try {
            await updateTripItem('notes', id, {
                title: titleRef.current || 'Untitled note',
                content_json: content,
                updated_at: now,
            });
            setNotes(prev =>
                prev.map(n =>
                    n.id === id ? { ...n, title: titleRef.current || 'Untitled note', content_json: content, updated_at: now } : n
                )
            );
        } catch (error) {
            console.error('Error saving note:', error);
            showToast('Failed to save note', 'error');
        } finally {
            setSaving(false);
        }
    }, [showToast]);

    const scheduleSave = useCallback((content: Record<string, unknown>) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            flushSave(content);
        }, AUTOSAVE_DELAY);
    }, [flushSave]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({ nested: true }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            scheduleSave(editor.getJSON());
        },
    }, []);

    // Load the selected note's content into the editor.
    useEffect(() => {
        if (!editor || !activeNote) return;
        editor.commands.setContent((activeNote.content_json as any) || '', { emitUpdate: false });
        setTitle(activeNote.title);
    }, [editor, activeNoteId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Flush any pending save when leaving the page entirely.
    useEffect(() => {
        return () => {
            if (saveTimer.current) {
                clearTimeout(saveTimer.current);
                if (editor && activeNoteIdRef.current) {
                    flushSave(editor.getJSON());
                }
            }
        };
    }, [editor, flushSave]);

    const handleOpenNote = (note: TripNote) => {
        if (saveTimer.current && editor && activeNoteIdRef.current) {
            flushSave(editor.getJSON());
        }
        setActiveNoteId(note.id);
    };

    const handleBack = () => {
        if (saveTimer.current && editor && activeNoteIdRef.current) {
            flushSave(editor.getJSON());
        }
        setActiveNoteId(null);
    };

    const handleCreateNote = async () => {
        if (!user) return;
        try {
            const newId = await addTripItem('notes', {
                trip_id: trip.id,
                title: 'Untitled note',
                content_json: {},
                created_by: user.id,
            } as Record<string, unknown>);
            const now = new Date().toISOString();
            const newNote: TripNote = {
                id: newId,
                trip_id: trip.id,
                title: 'Untitled note',
                content_json: {},
                created_by: user.id,
                created_at: now,
                updated_at: now,
            };
            setNotes(prev => [newNote, ...prev]);
            setActiveNoteId(newId);
        } catch (error) {
            console.error('Error creating note:', error);
            showToast('Failed to create note', 'error');
        }
    };

    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (editor) scheduleSave(editor.getJSON());
    };

    const handleDelete = async (note: TripNote) => {
        setConfirmDelete(null);
        try {
            await deleteTripItem('notes', note.id);
            setNotes(prev => prev.filter(n => n.id !== note.id));
            if (activeNoteId === note.id) setActiveNoteId(null);
            showToast('Note deleted', 'success');
        } catch (error) {
            console.error('Error deleting note:', error);
            showToast('Failed to delete note', 'error');
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[var(--color-text-secondary)] mt-4">Loading notes...</p>
            </div>
        );
    }

    // --- Editor view ---
    if (activeNote) {
        return (
            <div className="px-4 pb-24">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Notes
                    </button>
                    <div className="flex items-center gap-3">
                        {saving && (
                            <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                                <Loader2 size={12} className="animate-spin" />
                                Saving...
                            </span>
                        )}
                        <button
                            onClick={() => setConfirmDelete(activeNote)}
                            className="min-w-11 min-h-11 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-vermilion)] transition-colors"
                            aria-label="Delete note"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <input
                    value={title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Untitled note"
                    className="w-full text-xl font-bold bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none mb-4"
                />

                <Panel className="overflow-hidden">
                    <Toolbar editor={editor} />
                    <div className="notes-editor px-4 py-3 min-h-[300px]">
                        <EditorContent editor={editor} />
                    </div>
                </Panel>

                <style>{`
                    .notes-editor .ProseMirror {
                        outline: none;
                        color: var(--color-text-primary);
                        min-height: 260px;
                    }
                    .notes-editor .ProseMirror p.is-editor-empty:first-child::before {
                        content: attr(data-placeholder);
                        color: var(--color-text-muted);
                        float: left;
                        height: 0;
                        pointer-events: none;
                    }
                    .notes-editor .ProseMirror h2 {
                        font-size: 1.25rem;
                        font-weight: 700;
                        margin: 0.75rem 0 0.5rem;
                    }
                    .notes-editor .ProseMirror ul,
                    .notes-editor .ProseMirror ol {
                        padding-left: 1.25rem;
                        margin: 0.5rem 0;
                    }
                    .notes-editor .ProseMirror ul { list-style: disc; }
                    .notes-editor .ProseMirror ol { list-style: decimal; }
                    .notes-editor .ProseMirror ul[data-type="taskList"] {
                        list-style: none;
                        padding-left: 0;
                    }
                    .notes-editor .ProseMirror ul[data-type="taskList"] li {
                        display: flex;
                        align-items: flex-start;
                        gap: 0.5rem;
                    }
                    .notes-editor .ProseMirror ul[data-type="taskList"] li > label {
                        margin-top: 0.2rem;
                    }
                    .notes-editor .ProseMirror p { margin: 0.35rem 0; }
                `}</style>

                {confirmDelete && (
                    <div
                        className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60"
                        onClick={() => setConfirmDelete(null)}
                    >
                        <Panel
                            className="p-6 w-full max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Delete Note?</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                                "{confirmDelete.title}" will be permanently deleted.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="flex-1"
                                    onClick={() => setConfirmDelete(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="danger"
                                    size="lg"
                                    className="flex-1"
                                    onClick={() => handleDelete(confirmDelete)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </Panel>
                    </div>
                )}
            </div>
        );
    }

    // --- List view ---
    return (
        <div className="px-4 pb-24">
            <h2 className="cx-h2 text-[var(--color-text-primary)] mb-6">Notes</h2>

            {notes.length === 0 ? (
                <EmptyState
                    icon={<FileText size={48} />}
                    title="No notes yet"
                    hint="Create packing lists, itinerary notes, or free-form pages for this trip."
                />
            ) : (
                <div className="space-y-3">
                    {notes.map(note => (
                        <button
                            key={note.id}
                            onClick={() => handleOpenNote(note)}
                            className="cx-slide w-full text-left p-4 flex items-start gap-3 hover:border-brand-teal/50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-primary)] flex items-center justify-center shrink-0">
                                <FileText size={18} className="text-brand-teal" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                    {note.title || 'Untitled note'}
                                </p>
                                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                                    {previewText(note.content_json) || 'Empty note'}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatDate(note.updated_at)}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <button
                onClick={handleCreateNote}
                className="cx-lit fixed bottom-24 right-6 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-[var(--color-carbon)] hover:brightness-110 transition-all"
                aria-label="New note"
            >
                <Plus size={24} />
            </button>
        </div>
    );
}
