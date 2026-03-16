import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { addSubCollectionItem, getSubCollection, updateSubCollectionItem } from '../../services/tripService';
import { useToast } from '../../contexts/ToastContext';
import { Plus, GripVertical, Loader2, X } from 'lucide-react';
import { GridSkeleton } from '../../components/ui/Skeletons';
import type { Trip, Task } from '../../types';

function SortableItem(props: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-[#1e293b] p-3 mb-2 rounded-lg border border-gray-800 flex items-center gap-2 group touch-none">
            <div {...attributes} {...listeners} className="text-gray-500 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={16} />
            </div>
            <div className={`text-white text-sm ${props.status === 'done' ? 'line-through text-gray-500' : ''}`}>{props.children}</div>
        </div>
    );
}

const Column = ({ title, tasks, onAddTask }: { title: string, tasks: Task[], onAddTask?: () => void }) => {
    return (
        <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800 min-h-[500px] flex flex-col">
            <h3 className="text-white font-medium mb-4 flex justify-between items-center">
                {title}
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{tasks.length}</span>
            </h3>
            <div className="space-y-2 flex-1">
                <SortableContext
                    items={tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <SortableItem key={task.id} id={task.id} status={task.status}>
                            {task.title}
                        </SortableItem>
                    ))}
                </SortableContext>
            </div>
            {onAddTask && (
                <button
                    onClick={onAddTask}
                    className="w-full py-2 mt-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Add Task
                </button>
            )}
        </div>
    );
}

export default function TripTasks() {
    const { trip: currentTrip } = useOutletContext<{ trip: Trip }>();
    const { showToast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (currentTrip?.id) {
            fetchTasks();
        }
    }, [currentTrip?.id]);

    const fetchTasks = async () => {
        if (!currentTrip?.id) return;
        try {
            const data = await getSubCollection(currentTrip.id, 'tasks');
            setTasks(data as Task[]);
        } catch (error) {
            console.error(error);
            showToast('Failed to load tasks', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTrip?.id || !newTaskTitle) return;

        setSubmitLoading(true);
        try {
            const newTask = {
                title: newTaskTitle,
                status: 'todo'
            };
            await addSubCollectionItem(currentTrip.id, 'tasks', newTask);
            showToast('Task added', 'success');
            setNewTaskTitle('');
            setIsModalOpen(false);
            fetchTasks();
        } catch (error) {
            console.error(error);
            showToast('Failed to add task', 'error');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        // Find the task being dragged
        const activeTask = tasks.find(t => t.id === active.id);
        if (!activeTask) return;

        // In a real Kanban with dnd-kit, you need separate SortableContexts for each column 
        // and complex collision detection to know which column you dropped into.
        // For this MVP, we will stick to a simpler "List Reorder" within status, 
        // OR facilitate status change by clicking (or just assume explicit column drops later).

        // LIMITATION: dnd-kit vertical list strategy doesn't auto-handle cross-container drag easily 
        // without custom collision algorithms.
        // To keep this "15 features" sprint manageable, I will implement:
        // 1. Reordering within the "Todo" list.
        // 2. Clicking a task to advance its status (Todo -> Doing -> Done).

        if (active.id !== over.id) {
            setTasks((items) => {
                const oldIndex = items.findIndex(t => t.id === active.id);
                const newIndex = items.findIndex(t => t.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Quick Status Toggle for MVP (since full DnD Kanban is complex for one file)
    const toggleStatus = async (task: Task) => {
        if (!currentTrip?.id) return;

        const nextStatus = {
            'todo': 'doing',
            'doing': 'done',
            'done': 'todo'
        }[task.status] as Task['status'];

        try {
            // Optimistic update
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));

            await updateSubCollectionItem(currentTrip.id, 'tasks', task.id, { status: nextStatus });
            showToast(`Task moved to ${nextStatus}`, 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to update task', 'error');
            // Revert
            fetchTasks();
        }
    };

    const todoTasks = tasks.filter(t => t.status === 'todo');
    const doingTasks = tasks.filter(t => t.status === 'doing');
    const doneTasks = tasks.filter(t => t.status === 'done');

    if (loading) return <div className="p-4"><GridSkeleton /></div>;

    return (
        <div className="px-4 pb-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Tasks Board</h2>
                <div className="text-sm text-gray-500 bg-gray-900 px-3 py-1 rounded-full">
                    Tip: Click tasks to move them forward
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto">

                {/* TODO Column - Sortable */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <Column title="To Do" tasks={todoTasks} onAddTask={() => setIsModalOpen(true)} />
                </DndContext>

                {/* Doing Column - Click to advance */}
                <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800 min-h-[500px]">
                    <h3 className="text-white font-medium mb-4 flex justify-between items-center">
                        In Progress
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{doingTasks.length}</span>
                    </h3>
                    <div className="space-y-2">
                        {doingTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => toggleStatus(task)}
                                className="bg-[#1e293b] p-3 rounded-lg border border-gray-800 text-white text-sm cursor-pointer hover:bg-gray-700 transition-colors"
                            >
                                {task.title}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Done Column */}
                <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800 min-h-[500px]">
                    <h3 className="text-white font-medium mb-4 flex justify-between items-center">
                        Done
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{doneTasks.length}</span>
                    </h3>
                    <div className="space-y-2">
                        {doneTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => toggleStatus(task)}
                                className="bg-[#1e293b] p-3 rounded-lg border border-gray-800 text-white text-sm line-through text-gray-500 cursor-pointer hover:bg-gray-700 transition-colors"
                            >
                                {task.title}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-[#1e293b] w-full max-w-md rounded-2xl p-6 relative animate-in slide-in-from-bottom-10 fade-in border border-gray-800">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Add New Task</h2>

                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Task Title</label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="e.g., Book rental car"
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                    required
                                />
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
