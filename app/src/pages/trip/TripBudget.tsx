import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useOutletContext } from 'react-router-dom';
import { addTripItem, getTripItems, deleteTripItem } from '../../services/tripService';
import { useToast } from '../../contexts/ToastContext';
import { DollarSign, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { GridSkeleton } from '../../components/ui/Skeletons';
import type { Trip } from '../../types';

const COLORS = ['#68A8AD', '#FFC726', '#003E51', '#E88C0C', '#2E8B84', '#EF4444', '#8B5CF6'];

import type { Expense } from '../../types';

const CATEGORIES = ['Accommodation', 'Flights', 'Food', 'Activities', 'Transport', 'Shopping', 'Other'];

export default function TripBudget() {
    const { trip } = useOutletContext<{ trip: Trip }>();
    const { showToast } = useToast();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Form
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (trip?.id) {
            fetchExpenses();
        }
    }, [trip?.id]);

    const fetchExpenses = async () => {
        if (!trip?.id) return;
        try {
            const data = await getTripItems<Expense>('expenses', trip.id);
            // Sort by date desc
            const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setExpenses(sorted);
        } catch (error) {
            console.error(error);
            showToast('Failed to load expenses', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trip?.id) return;

        setSubmitLoading(true);
        try {
            const newExpense = {
                trip_id: trip.id,
                title,
                amount: parseFloat(amount),
                category,
                date,
            };
            await addTripItem('expenses', newExpense as Record<string, unknown>);
            showToast('Expense added!', 'success');
            setIsModalOpen(false);

            // Reset form
            setTitle('');
            setAmount('');
            setCategory(CATEGORIES[0]);

            fetchExpenses();
        } catch (error) {
            console.error(error);
            showToast('Failed to add expense', 'error');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!trip?.id) return;
        if (!confirm('Delete this expense?')) return;

        try {
            await deleteTripItem('expenses', id);
            setExpenses(prev => prev.filter(e => e.id !== id));
            showToast('Expense deleted', 'info');
        } catch (error) {
            console.error(error);
            showToast('Failed to delete expense', 'error');
        }
    };

    // Calculations
    const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalBudget = trip?.budget || 0;
    const remaining = totalBudget - totalSpent;

    const chartData = CATEGORIES.map(cat => {
        const catTotal = expenses
            .filter(e => e.category === cat)
            .reduce((sum, e) => sum + e.amount, 0);
        return { name: cat, value: catTotal };
    }).filter(d => d.value > 0);

    if (loading) return <div className="p-4"><GridSkeleton /></div>;

    return (
        <div className="px-4 pb-24">
            <h2 className="text-xl font-bold text-white mb-6">Trip Budget</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#1e293b] p-4 rounded-xl border border-gray-800">
                    <div className="text-gray-400 text-sm mb-1">Total Spent</div>
                    <div className="text-2xl font-bold text-white">${totalSpent.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Target: ${totalBudget.toLocaleString()}</div>
                </div>
                <div className="bg-[#1e293b] p-4 rounded-xl border border-gray-800">
                    <div className="text-gray-400 text-sm mb-1">Remaining</div>
                    <div className={`text-2xl font-bold ${remaining < 0 ? 'text-red-400' : 'text-brand-teal'}`}>
                        ${remaining.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-[#1e293b] p-4 rounded-xl border border-gray-800 mb-8 h-80">
                <h3 className="text-white font-medium mb-4">Expenses by Category</h3>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: any) => `$${value.toLocaleString()}`}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        No expenses yet
                    </div>
                )}
            </div>

            {/* Recent Expenses List */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-medium">Recent Expenses</h3>
                </div>
                <div className="space-y-3">
                    {expenses.map(expense => (
                        <div key={expense.id} className="flex items-center justify-between bg-[#1e293b] p-4 rounded-xl border border-gray-800 group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <div className="text-white font-medium">{expense.title}</div>
                                    <div className="text-xs text-gray-400">{expense.category} • {expense.date}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-white font-bold">
                                    ${expense.amount.toLocaleString()}
                                </div>
                                <button
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {expenses.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No expenses recorded.
                        </div>
                    )}
                </div>
            </div>

            {/* Fab */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-white hover:bg-teal-600 transition-colors z-30"
            >
                <Plus size={24} />
            </button>

            {/* Add Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-[#1e293b] w-full max-w-md rounded-2xl p-6 relative animate-in slide-in-from-bottom-10 fade-in border border-gray-800">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Add Expense</h2>

                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Resort Fee"
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-teal"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="w-full bg-brand-teal text-white font-bold py-4 rounded-xl mt-4 hover:bg-teal-600 transition-colors disabled:opacity-50"
                            >
                                {submitLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Add Expense'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
