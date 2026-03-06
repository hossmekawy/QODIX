'use client';
import { useEffect, useState } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiActivity, FiPieChart, FiFileText } from 'react-icons/fi';

export default function FinanceOverviewPage() {
    const { fetchDashboardOverview, loading } = useFinance();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const result = await fetchDashboardOverview();
            setData(result);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading || !data) {
        return <div className="text-center py-20 text-gray-500 animate-pulse font-bold tracking-widest uppercase">Loading Financial Data...</div>;
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(val || 0);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative mb-8">
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#C1FF72]/10 blur-[60px] pointer-events-none rounded-full"></div>
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#C1FF72] tracking-tight">Finance Overview</h1>
                    <p className="text-gray-400 mt-1">Real-time health of your business accounts</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#070308] border border-blue-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <p className="text-blue-400 text-xs uppercase font-bold tracking-wider">Total Bank Balances</p>
                        <FiDollarSign className="text-blue-500 w-5 h-5 opacity-50" />
                    </div>
                    <h3 className="text-3xl font-black text-white relative z-10">{formatCurrency(data.bank_balances)}</h3>
                </div>

                <div className="bg-[#070308] border border-green-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <p className="text-green-500 text-xs uppercase font-bold tracking-wider">Income This Month</p>
                        <FiTrendingUp className="text-green-500 w-5 h-5 opacity-50" />
                    </div>
                    <h3 className="text-3xl font-black text-green-400 relative z-10">{formatCurrency(data.income_this_month)}</h3>
                </div>

                <div className="bg-[#070308] border border-red-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <p className="text-red-500 text-xs uppercase font-bold tracking-wider">Expenses This Month</p>
                        <FiTrendingDown className="text-red-500 w-5 h-5 opacity-50" />
                    </div>
                    <h3 className="text-3xl font-black text-red-400 relative z-10">{formatCurrency(data.expenses_this_month)}</h3>
                </div>

                <div className="bg-[#070308] border border-[#C1FF72]/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#C1FF72]/10 rounded-full blur-xl group-hover:bg-[#C1FF72]/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <p className="text-[#C1FF72] text-xs uppercase font-bold tracking-wider">Net Profit/Loss</p>
                        <FiActivity className="text-[#C1FF72] w-5 h-5 opacity-50" />
                    </div>
                    <h3 className={`text-3xl font-black relative z-10 ${(data.profit_loss || 0) >= 0 ? 'text-[#C1FF72]' : 'text-red-500'}`}>
                        {formatCurrency(data.profit_loss)}
                    </h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* AR / AP Summary */}
                <div className="bg-[#070308] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <FiFileText className="text-[#C1FF72]" /> Payables & Receivables
                    </h3>

                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Accounts Receivable (Owed to You)</p>
                            <p className="text-3xl font-black text-[#C1FF72]">{formatCurrency(data.accounts_receivable)}</p>
                            <p className="text-xs text-gray-500 mt-2">Total outstanding from unpaid invoices</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Accounts Payable (You Owe)</p>
                            <p className="text-3xl font-black text-red-400">{formatCurrency(data.accounts_payable)}</p>
                            <p className="text-xs text-gray-500 mt-2">Total unpaid bills and upcoming expenses</p>
                        </div>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-[#070308] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <FiPieChart className="text-[#C1FF72]" /> Expense Breakdown
                    </h3>

                    {data.expense_breakdown && data.expense_breakdown.length > 0 ? (
                        <div className="space-y-4">
                            {data.expense_breakdown.map((item: any, idx: number) => {
                                const percentage = ((item.total / data.expenses_this_month) * 100).toFixed(1);
                                return (
                                    <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-gray-300">{item.category__name || 'Uncategorized'}</span>
                                            <span className="font-bold text-white">{formatCurrency(item.total)}</span>
                                        </div>
                                        <div className="w-full bg-black/50 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-[#721C97] to-[#C1FF72] h-2 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-right mt-1 text-gray-500">{percentage}% of total</div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-xl">
                            No expenses recorded this month
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
