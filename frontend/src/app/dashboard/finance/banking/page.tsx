'use client';
import { useState, useEffect } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { FiPlus, FiBriefcase, FiArrowRightCircle } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';

export default function BankingPage() {
    const { fetchBankAccounts, createBankAccount, loading } = useFinance();
    const [accounts, setAccounts] = useState<any[]>([]);
    const toast = useToast();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        bank_name: '',
        account_number: '',
        current_balance: 0,
        currency: 'EGP',
        is_petty_cash: false
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await fetchBankAccounts();
            setAccounts(data);
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
            await createBankAccount(formData);
            toast.success('Bank account added successfully');
            setIsModalOpen(false);
            setFormData({
                name: '', bank_name: '', account_number: '',
                current_balance: 0, currency: 'EGP', is_petty_cash: false
            });
            loadData();
        } catch (error) {
            toast.error('Failed to create bank account');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Banking & Cash</h1>
                    <p className="text-gray-400 mt-1">Manage accounts, transfers, and petty cash</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        className="flex items-center gap-2 px-4 py-3 bg-[#070308] border border-[#C1FF72]/30 text-[#C1FF72] font-bold rounded-xl hover:bg-[#C1FF72]/10 transition-all justify-center whitespace-nowrap opacity-50 cursor-not-allowed"
                    >
                        <FiArrowRightCircle className="w-4 h-4" /> Transfer
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-blue-400 transition-all w-full md:w-auto justify-center"
                    >
                        <FiPlus className="w-5 h-5" /> Add Account
                    </button>
                </div>
            </div>

            {loading && accounts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Loading Accounts...</div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[#721C97]/30 rounded-3xl bg-[#070308]/50">
                    <FiBriefcase className="w-16 h-16 text-[#721C97]/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Accounts Found</h3>
                    <p className="text-gray-400 mt-2 max-w-md mx-auto">Add a bank or petty cash account to start tracking balances.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map((acc) => (
                        <div key={acc.id} className="bg-[#070308] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-xl text-white group-hover:text-blue-400 transition-colors">{acc.name}</h3>
                                    <p className="text-sm text-gray-400 mt-1">{acc.bank_name}</p>
                                </div>
                                {acc.is_petty_cash && (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30 text-amber-500 bg-amber-500/10">
                                        Petty Cash
                                    </span>
                                )}
                            </div>

                            <p className="font-mono text-gray-500 text-sm tracking-widest mb-6 border border-white/5 bg-white/5 inline-block px-3 py-1.5 rounded-lg">
                                {acc.account_number || '**** **** ****'}
                            </p>

                            <div className="border-t border-white/10 pt-4 mt-auto">
                                <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mb-1">Available Balance</p>
                                <p className="text-3xl font-black text-white">{formatCurrency(acc.current_balance, acc.currency)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#070308] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-2xl font-bold text-white">Add Bank Account</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Account Name</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Main Operating" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Bank Name</label>
                                    <input required type="text" value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. CIB" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Account Number</label>
                                <input type="text" value={formData.account_number} onChange={e => setFormData({ ...formData, account_number: e.target.value })} className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. 1000 0000 0000" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Initial Balance</label>
                                    <input required type="number" step="0.01" value={formData.current_balance} onChange={e => setFormData({ ...formData, current_balance: parseFloat(e.target.value) })} className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Currency</label>
                                    <select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} className="w-full bg-[#110915] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                                        <option value="EGP">EGP</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 mt-4 cursor-pointer">
                                <input type="checkbox" checked={formData.is_petty_cash} onChange={e => setFormData({ ...formData, is_petty_cash: e.target.checked })} className="w-5 h-5 rounded border-white/10 bg-[#110915] text-blue-500 focus:ring-blue-500 flex-shrink-0" />
                                <div>
                                    <span className="block text-white font-medium">This is a Petty Cash account</span>
                                    <span className="block text-xs text-gray-500">Used for small cash on hand expenses.</span>
                                </div>
                            </label>

                            <div className="pt-6 flex justify-end gap-3 border-t border-white/5">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 font-bold transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                                    {submitting ? 'Saving...' : 'Save Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
