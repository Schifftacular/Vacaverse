import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { addTripItem, getTripItems, updateTripItem } from '../../services/tripService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { Plus, Loader2, X, ChevronRight, ChevronDown, ListChecks } from 'lucide-react';
import { GridSkeleton } from '../../components/ui/Skeletons';
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
            <div key={task.id} className={`bg-[#1e293b] rounded-xl border border-gray-800 overflow-hidden transition-opacity ${dimmed ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3 p-4">
                    {/* Checkbox */}
                    <button
                        onClick={() => toggleDone(task)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isDone
                            ? 'bg-brand-teal border-brand-teal'
                            : 'border-gray-600 hover:border-brand-teal'
                            }`}
                        aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
                    >
                        {isDone && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${isDone ? 'line-through text-gray-500' : 'text-white'}`}>
                            {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                            {assigneeProfile ? (
                                <span className="text-xs text-gray-400">
                                    {assigneeProfile.display_name}
                                </span>
                            ) : (
                                <span className="text-xs text-gray-600">Unassigned</span>
                            )}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${isDone
                                ? 'bg-gray-800 text-gray-500'
                                : task.status === 'doing'
                                    ? 'bg-yellow-900/40 text-yellow-400'
                                    : 'bg-gray-800 text-gray-400'
                                }`}>
                                {isDone ? 'Done' : task.status === 'doing' ? 'In progress' : 'To do'}
                            </span>
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
                            <div className="w-7 h-7 rounded-full bg-brand-teal flex items-center justify-center text-xs text-white font-bold shrink-0">
                                {(assigneeProfile.display_name?.[0] ?? '?').toUpperCase()}
                            </div>
                        )
                    )}

                    {/* Expand toggle */}
                    <button
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="p-2 -m-2 text-gray-500 hover:text-gray-300 shrink-0"
                        aria-label="Expand task"
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                {/* Expanded: assignee selector */}
                {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-800">
                        <label className="block text-xs text-gray-400 mb-2 mt-3">Assign to</label>
                        <select
                            value={task.assigned_to ?? ''}
                            onChange={(e) => updateAssignee(task, e.target.value)}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-brand-teal"
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
            </div>
        );
    };

    return (
        <div className="px-4 pb-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Tasks</h2>
                <span className="text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-full">
                    {activeTasks.length} active · {doneTasks.length} done
                </span>
            </div>

            {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
                    <ListChecks size={48} className="text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No tasks yet</h3>
                    <p className="text-gray-400 text-sm mb-4">Keep track of packing, bookings, and to-dos as a family.</p>
                    <button onClick={() => setIsModalOpen(true)} className="text-brand-teal font-bold hover:underline">
                        Add your first task
                    </button>
                </div>
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
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Completed</span>
                                <div className="h-[1px] bg-gray-800 flex-1" />
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
                className="fixed bottom-24 right-6 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-white hover:bg-teal-600 transition-colors z-30"
            >
                <Plus size={24} />
            </button>

            {/* Add Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-[#1e293b] w-full max-w-md rounded-2xl p-6 relative animate-in slide-in-from-bottom-10 fade-in border border-gray-800 max-h-[85vh] overflow-y-auto">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Add Task</h2>

                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="e.g., Book rental car"
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Assign to (optional)</label>
                                <select
                                    value={newTaskAssignee}
                                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
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

                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="w-full bg-brand-teal text-white font-bold py-4 rounded-xl mt-4 hover:bg-teal-600 transition-colors disabled:opacity-50"
                            >
                                {submitLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Add Task'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
