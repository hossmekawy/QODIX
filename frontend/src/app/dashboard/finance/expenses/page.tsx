'use client';
import { useState, useEffect } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { FiPlus, FiCreditCard, FiUpload, FiList } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';

export default function ExpensesPage() {
    const { fetchExpenses, fetchExpenseCategories, fetchBankAccounts, createExpense, loading } = useFinance();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const toast = useToast();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        category: '',   // ID
        bank_account: '', // ID
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        currency: 'EGP',
        vendor: '',
        description: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [expData, catData, accData] = await Promise.all([
                fetchExpenses(),
                fetchExpenseCategories(),
                fetchBankAccounts()
            ]);
            setExpenses(expData);
            setCategories(catData);
            setAccounts(accData);
            if (catData.length > 0) {
                setFormData(prev => ({ ...prev, category: catData[0].id.toString() }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: currency || 'EGP' }).format(amount);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Build payload
            const payload: any = {
                category_id: formData.category,
                date: formData.date,
                amount: formData.amount,
                currency: formData.currency,
                vendor: formData.vendor,
                description: formData.description
            };
            if (formData.bank_account) {
                payload.bank_account_id = formData.bank_account;
            }

            await createExpense(payload);
            toast.success('Expense logged successfully');
            setIsModalOpen(false);

            // Reset but keep some defaults
            setFormData({
                category: categories.length > 0 ? categories[0].id.toString() : '',
                bank_account: '',
                date: new Date().toISOString().split('T')[0],
                amount: 0,
                currency: 'EGP',
                vendor: '',
                description: ''
            });
            loadData();
        } catch (error) {
            toast.error('Failed to log expense');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Expenses</h1>
                    <p className="text-gray-400 mt-1">Track outflows, upload receipts, and manage budgets</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        className="flex items-center gap-2 px-4 py-3 bg-[#070308] border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-all justify-center whitespace-nowrap opacity-50 cursor-not-allowed"
                    >
                        <FiList className="w-4 h-4" /> Categories
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-400 transition-all w-full md:w-auto justify-center"
                    >
                        <FiPlus className="w-5 h-5" /> Log Expense
                    </button>
                </div>
            </div>

            {loading && expenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Loading Expenses...</div>
            ) : expenses.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[#721C97]/30 rounded-3xl bg-[#070308]/50">
                    <FiCreditCard className="w-16 h-16 text-[#721C97]/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Expenses Found</h3>
                    <p className="text-gray-400 mt-2 max-w-md mx-auto">Log your first expense to see it tracked here.</p>
                </div>
            ) : (
                <div className="bg-[#070308] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#721C97]/30 bg-[#721C97]/10 text-xs uppercase tracking-widest text-red-400">
                                    <th className="p-4 font-black">Date</th>
                                    <th className="p-4 font-black">Category</th>
                                    <th className="p-4 font-black">Description & Vendor</th>
                                    <th className="p-4 font-black">Amount</th>
                                    <th className="p-4 font-black text-right">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {expenses.map((exp) => (
                                    <tr key={exp.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-gray-300 font-bold whitespace-nowrap">{exp.date}</td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-white/5 border-white/20 text-gray-400">
                                                {exp.category_name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            <span className="font-bold text-white block">{exp.description || 'No Description'}</span>
                                            {exp.vendor && <span className="text-xs text-gray-500 mt-1">Vendor: {exp.vendor}</span>}
                                            {exp.bank_account_name && <span className="text-xs text-blue-400 block mt-1">Paid from: {exp.bank_account_name}</span>}
                                        </td>
                                        <td className="p-4 font-black text-red-400">
                                            -{formatCurrency(exp.amount, exp.currency)}
                                        </td>
                                        <td className="p-4 text-right">
                                            {exp.receipt_file ? (
                                                <a href={exp.receipt_file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg border border-white/10 transition-colors text-xs font-bold">
                                                    <FiUpload /> View
                                                </a>
                                            ) : (
                                                <span className="text-gray-600 text-xs italic">No receipt</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-[#070308] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl my-8">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-2xl font-bold text-white">Log Expense</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                                    <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500">
                                        <option value="" disabled>Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                                    <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                                    <input required type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Currency</label>
                                    <select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500">
                                        <option value="EGP">EGP</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Paid From (Optional)</label>
                                <select value={formData.bank_account} onChange={e => setFormData({ ...formData, bank_account: e.target.value })} className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500">
                                    <option value="">None (Paid out of personal / not tracked)</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency}) - {acc.current_balance}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Vendor/Merchant</label>
                                <input type="text" value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })} className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500" placeholder="e.g. Amazon Web Services" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 min-h-[100px]" placeholder="Brief description of what this was for..." />
                            </div>

                            <div className="pt-6 flex justify-end gap-3 border-t border-white/5">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 font-bold transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                                    {submitting ? 'Logging...' : 'Log Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
