import React, { useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Users, GripVertical, Plus } from 'lucide-react';

// Mock Members for builder
const mockMembers = [
    { id: '1', name: 'Dad', role: 'Admin', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50' },
    { id: '2', name: 'Mom', role: 'Admin', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50' },
    { id: '3', name: 'Kid 1', role: 'Member', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50' },
];

function SortableMember(props: any) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="bg-[#1e293b] p-4 mb-3 rounded-xl border border-gray-800 flex items-center justify-between group">
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="text-gray-500 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={20} />
                </div>
                <img src={props.member.avatar} alt={props.member.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                    <div className="text-white font-medium">{props.member.name}</div>
                    <div className="text-xs text-gray-400">{props.member.role}</div>
                </div>
            </div>
        </div>
    );
}

export default function Family() {
    const { currentFamily } = useFamily();
    const [members, setMembers] = useState(mockMembers);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setMembers((items) => {
                const oldIndex = items.findIndex(m => m.id === active.id);
                const newIndex = items.findIndex(m => m.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <div className="p-4 pb-24 min-h-screen bg-[#0f172a]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">My Family</h1>
                    <p className="text-gray-400 text-sm">Manage your vacation squad</p>
                </div>
                <button className="w-10 h-10 bg-[#1e293b] rounded-full flex items-center justify-center text-brand-teal border border-gray-800">
                    <Users size={20} />
                </button>
            </div>

            {/* Drag and Drop List */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={members.map(m => m.id)} strategy={verticalListSortingStrategy}>
                    {members.map(member => <SortableMember key={member.id} id={member.id} member={member} />)}
                </SortableContext>
            </DndContext>

            <button className="fixed bottom-24 right-6 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-white">
                <Plus size={24} />
            </button>
        </div>
    );
}
