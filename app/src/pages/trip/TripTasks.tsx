import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { addTripItem, getTripItems, updateTripItem } from '../../services/tripService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { Plus, Loader2, X, ChevronRight, ChevronDown, ListChecks } from 'lucide-react';
import { GridSkeleton } from '../../components/ui/Skeletons';
import { Button, Panel, SectionLabel, Tag, EmptyState } from '../../components/ui/Concourse';
import type { Trip, Task } from '../../types';

export default function TripTasks() {
    const { trip: currentTrip } = useOutletContext<{ trip: Trip }>();
    const { showToast } = useToast();
    const { user } = useAuth();
    const { families } = useFamily();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    // Determine family members for assignee dropdown
    const familyMembers: string[] = useMemo(() => {
        if (!currentTrip?.family_id) return user ? [user.id] : [];
        const family = families.find(f => f.id === currentTrip.family_id);
        return family?.members ?? (user ? [user.id] : []);
    }, [families, currentTrip?.family_id, user]);

    // Resolve profiles for all family members + assignees
    const allProfileIds = useMemo(() => {
        const ids = new Set<string>(familyMembers);
        tasks.forEach(t => { if (t.assigned_to) ids.add(t.assigned_to); });
        return Array.from(ids);
    }, [familyMembers, tasks]);

    const { profiles } = useUserProfiles(allProfileIds);

    useEffect(() => {
        if (currentTrip?.id) {
            fetchTasks();
        }
    }, [currentTrip?.id]);

    const fetchTasks = async () => {
        if (!currentTrip?.id) return;
        try {
            const data = await getTripItems<Task>('tasks', currentTrip.id);
            setTasks(data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load tasks', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTrip?.id || !newTaskTitle.trim()) return;

        setSubmitLoading(true);
        try {
            const newTask = {
                trip_id: currentTrip.id,
                title: newTaskTitle.trim(),
                status: 'todo' as const,
                ...(newTaskAssignee ? { assigned_to: newTaskAssignee } : {}),
            };
            await addTripItem('tasks', newTask as Record<string, unknown>);
            showToast('Task added', 'success');
            setNewTaskTitle('');
            setNewTaskAssignee('');
            setIsModalOpen(false);
            fetchTasks();
        } catch (error) {
            console.error(error);
            showToast('Failed to add task', 'error');
        } finally {
            setSubmitLoading(false);
        }
    };

    const toggleDone = async (task: Task) => {
        if (!currentTrip?.id) return;

        const nextStatus: Task['status'] = task.status === 'done' ? 'todo' : 'done';

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));

        try {
            await updateTripItem('tasks', task.id, { status: nextStatus });
        } catch (error) {
            console.error(error);
            showToast('Failed to update task', 'error');
            fetchTasks();
        }
    };

    const updateAssignee = async (task: Task, assignedTo: string) => {
        if (!currentTrip?.id) return;

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, assigned_to: assignedTo || undefined } : t));

        try {
            await updateTripItem('tasks', task.id, { assigned_to: assignedTo || null });
        } catch (error) {
            console.error(error);
            showToast('Failed to update assignee', 'error');
            fetchTasks();
        }
    };

    const activeTasks = tasks.filter(t => t.status !== 'done');
    const doneTasks = tasks.filter(t => t.status === 'done');

    if (loading) return <div className="p-4"><GridSkeleton /></div>;

    const renderTask = (task: Task, dimmed = false) => {
        const isDone = task.status === 'done';
        const isExpanded = expandedTaskId === task.id;
        const assigneeProfile = task.assigned_to ? profiles.get(task.assigned_to) : null;

        return (
            <Panel key={task.id} className={`overflow-hidden transition-opacity ${dimmed ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3 p-4">
                    {/* Checkbox */}
                    <button
                        onClick={() => toggleDone(task)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isDone
                            ? 'bg-[var(--color-bottle-green)] border-[var(--color-bottle-green)]'
                            : 'border-[var(--color-border)] hover:border-brand-teal'
                            }`}
                        aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
                    >
                        {isDone && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="var(--color-ivory)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${isDone ? 'line-through text-[var(--color-bottle-green)]' : 'text-[var(--color-text-primary)]'}`}>
                            {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            {assigneeProfile ? (
                                <span className="text-xs text-[var(--color-text-secondary)]">
                                    {assigneeProfile.display_name}
                                </span>
                            ) : (
                                <span className="text-xs text-[var(--color-text-muted)]">Unassigned</span>
                            )}
                            {isDone ? (
                                <Tag tone="green">Done</Tag>
                            ) : task.status === 'doing' ? (
                                <Tag tone="gold">In progress</Tag>
                            ) : (
                                <Tag tone="neutral">To do</Tag>
                            )}
                        </div>
                    </div>

                    {/* Assignee avatar */}
                    {assigneeProfile && (
                        assigneeProfile.photo_url ? (
                            <img
                                src={assigneeProfile.photo_url}
                                alt={assigneeProfile.display_name}
                                className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-brand-teal flex items-center justify-center text-xs text-[var(--color-carbon)] font-bold shrink-0">
                                {(assigneeProfile.display_name?.[0] ?? '?').toUpperCase()}
                            </div>
                        )
                    )}

                    {/* Expand toggle */}
                    <button
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="p-2 -m-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] shrink-0"
                        aria-label="Expand task"
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                {/* Expanded: assignee selector */}
                {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-[var(--color-border)]">
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-2 mt-3">Assign to</label>
                        <select
                            value={task.assigned_to ?? ''}
                            onChange={(e) => updateAssignee(task, e.target.value)}
                            className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-2 text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-brand-teal"
                        >
                            <option value="">Unassigned</option>
                            {familyMembers.map(uid => {
                                const p = profiles.get(uid);
                                return (
                                    <option key={uid} value={uid}>
                                        {p?.display_name ?? uid}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                )}
            </Panel>
        );
    };

    return (
        <div className="px-4 pb-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className="cx-h2 text-[var(--color-text-primary)]">Tasks</h2>
                <Tag tone="neutral" className="tabular-nums">
                    {activeTasks.length} active · {doneTasks.length} done
                </Tag>
            </div>

            {tasks.length === 0 ? (
                <EmptyState
                    icon={<ListChecks size={48} />}
                    title="No tasks yet"
                    hint="Keep track of packing, bookings, and to-dos as a family."
                />
            ) : (
                <>
                    {/* Active tasks */}
                    {activeTasks.length > 0 && (
                        <div className="space-y-2 mb-6">
                            {activeTasks.map(task => renderTask(task, false))}
                        </div>
                    )}

                    {/* Completed tasks */}
                    {doneTasks.length > 0 && (
                        <>
                            <div className="flex items-center gap-3 mb-3">
                                <SectionLabel>Completed</SectionLabel>
                                <div className="h-[1px] bg-[var(--color-border)] flex-1" />
                            </div>
                            <div className="space-y-2">
                                {doneTasks.map(task => renderTask(task, true))}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* FAB */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="cx-lit fixed bottom-24 right-6 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-[var(--color-carbon)] hover:brightness-110 transition-all z-30"
                aria-label="Add task"
            >
                <Plus size={24} />
            </button>

            {/* Add Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-[var(--color-bg-card)] w-full max-w-md rounded-2xl p-6 relative animate-in slide-in-from-bottom-10 fade-in border border-[var(--color-border)] max-h-[85vh] overflow-y-auto">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                            aria-label="Close"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="cx-h2 text-[var(--color-text-primary)] mb-6">Add Task</h2>

                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="e.g., Book rental car"
                                    className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Assign to (optional)</label>
                                <select
                                    value={newTaskAssignee}
                                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                                    className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal"
                                >
                                    <option value="">Unassigned</option>
                                    {familyMembers.map(uid => {
                                        const p = profiles.get(uid);
                                        return (
                                            <option key={uid} value={uid}>
                                                {p?.display_name ?? uid}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <Button type="submit" variant="primary" size="lg" disabled={submitLoading} className="mt-4">
                                {submitLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Add Task'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
