import { useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, X, Check } from 'lucide-react';

export default function Family() {
    const { user } = useAuth();
    const { families, currentFamily, setCurrentFamily, createFamily, loading } = useFamily();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    const handleCreateFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFamilyName.trim()) return;
        setCreateLoading(true);
        try {
            await createFamily(newFamilyName.trim());
            setNewFamilyName('');
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to create family:', error);
        } finally {
            setCreateLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 pb-24 min-h-screen bg-[#0f172a]">
                <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-gray-800/50 rounded w-1/2" />
                    <div className="h-24 bg-gray-800/50 rounded-xl" />
                    <div className="h-24 bg-gray-800/50 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 min-h-screen bg-[#0f172a]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">My Families</h1>
                    <p className="text-gray-400 text-sm">Manage your family groups</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-10 h-10 bg-[#1e293b] rounded-full flex items-center justify-center text-brand-teal border border-gray-800"
                >
                    <Plus size={20} />
                </button>
            </div>

            {families.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Users size={48} className="text-gray-600 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">No family groups yet</h2>
                    <p className="text-gray-400 mb-6">Create a family group to start planning together.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-brand-teal text-white rounded-lg font-bold"
                    >
                        Create Family Group
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {families.map(family => (
                        <button
                            key={family.id}
                            onClick={() => setCurrentFamily(currentFamily?.id === family.id ? null : family)}
                            className={`w-full bg-[#1e293b] p-4 rounded-xl border transition-colors text-left ${
                                currentFamily?.id === family.id
                                    ? 'border-brand-teal'
                                    : 'border-gray-800 hover:border-gray-700'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-white font-medium">{family.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {family.members.length} member{family.members.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                {currentFamily?.id === family.id && (
                                    <Check size={20} className="text-brand-teal" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Create Family Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-[#1e293b] w-full max-w-md rounded-2xl p-6 relative border border-gray-800">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-6">Create Family Group</h2>
                        <form onSubmit={handleCreateFamily} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Family Name</label>
                                <input
                                    type="text"
                                    value={newFamilyName}
                                    onChange={(e) => setNewFamilyName(e.target.value)}
                                    placeholder="e.g., The Smiths"
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={createLoading}
                                className="w-full bg-brand-teal text-white font-bold py-4 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
                            >
                                {createLoading ? 'Creating...' : 'Create Family'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
