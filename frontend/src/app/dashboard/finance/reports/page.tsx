'use client';
import { useState, useEffect } from 'react';
import { FiTrendingUp, FiDownload, FiArrowLeft, FiPieChart, FiDollarSign, FiActivity, FiArchive, FiInbox } from 'react-icons/fi';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useFinance } from '@/hooks/useFinance';

const reportConfig = [
    { id: 'balance_sheet', icon: FiArchive, name: "Balance Sheet", desc: "Assets, liabilities, and equity" },
    { id: 'cashflow', icon: FiActivity, name: "Cash Flow Statement", desc: "Inflows vs Outflows over 30 days" },
    { id: 'ar_aging', icon: FiTrendingUp, name: "A/R Aging", desc: "Overdue invoices tracking bins" },
    { id: 'expense_analysis', icon: FiPieChart, name: "Expense Analysis", desc: "Deep dive into category spending" },
    { id: 'tax_report', icon: FiDollarSign, name: "Tax Report", desc: "Automated tax net liability calculations" },
];

export default function ReportsPage() {
    const toast = useToast();
    const { fetchAdvancedReport } = useFinance();

    // State
    const [activeReport, setActiveReport] = useState<string | null>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);

    const handleDownload = async (type: string, format: string) => {
        try {
            setDownloading(`${type}-${format}`);
            const response = await api.get(`/finance/dashboard/export/?type=${type}&format=${format}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const ext = format === 'excel' ? 'xlsx' : format;
            link.setAttribute('download', `${type}_report.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed', error);
            toast.error(`Failed to download ${format.toUpperCase()} report. Note: Advanced CSV exports are still in development.`);
        } finally {
            setDownloading(null);
        }
    };

    const openReport = async (reportId: string) => {
        setActiveReport(reportId);
        setLoadingData(true);
        try {
            const data = await fetchAdvancedReport(reportId);
            setReportData(data);
        } catch (e) {
            toast.error("Failed to load report data");
            setActiveReport(null);
        } finally {
            setLoadingData(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount || 0);
    };

    // ----- Renderers for Specific Reports -----
    const renderBalanceSheet = () => {
        if (!reportData) return null;
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#110915] p-6 rounded-2xl border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Assets</h3>
                        <div className="space-y-3 text-gray-400">
                            <div className="flex justify-between items-center"><span className="text-sm">Bank Accounts:</span> <span className="text-white font-medium">{formatCurrency(reportData.assets?.bank_accounts)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm">Accounts Receivable:</span> <span className="text-white font-medium">{formatCurrency(reportData.assets?.accounts_receivable)}</span></div>
                            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-blue-400 font-bold">
                                <span>Total Assets</span>
                                <span>{formatCurrency(reportData.assets?.total)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#110915] p-6 rounded-2xl border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Liabilities</h3>
                        <div className="space-y-3 text-gray-400">
                            <div className="flex justify-between items-center"><span className="text-sm">Taxes Payable:</span> <span className="text-white font-medium">{formatCurrency(reportData.liabilities?.taxes_payable)}</span></div>
                            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-red-400 font-bold">
                                <span>Total Liabilities</span>
                                <span>{formatCurrency(reportData.liabilities?.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-[#070308] border border-[#C1FF72]/20 p-6 rounded-2xl text-center shadow-[0_0_30px_rgba(193,255,114,0.05)]">
                    <p className="text-gray-400 text-sm tracking-widest uppercase mb-2">Total Equity</p>
                    <p className="text-4xl font-black text-[#C1FF72] tracking-tight">{formatCurrency(reportData.equity)}</p>
                </div>
            </div>
        );
    };

    const renderCashflow = () => {
        if (!reportData) return null;
        const net = reportData.net_cashflow;
        return (
            <div className="space-y-6">
                <div className="flex gap-4 p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl items-center text-sm font-medium">
                    <FiActivity className="w-5 h-5 flex-shrink-0" /> Note: This statement operates on a rolling 30-day window.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#110915] p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-2 text-center text-green-400 uppercase tracking-widest text-xs">Cash Inflows</h3>
                        <p className="text-3xl font-black text-center text-white mt-4">{formatCurrency(reportData.operating_activities?.cash_in)}</p>
                    </div>
                    <div className="bg-[#110915] p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-2 text-center text-red-400 uppercase tracking-widest text-xs">Cash Outflows</h3>
                        <p className="text-3xl font-black text-center text-white mt-4">-{formatCurrency(reportData.operating_activities?.cash_out)}</p>
                    </div>
                </div>
                <div className={`p-6 rounded-2xl border text-center ${net >= 0 ? 'bg-[#C1FF72]/10 border-[#C1FF72]/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <p className="text-sm font-bold uppercase tracking-tight mb-2 opacity-80 {net >= 0 ? 'text-[#C1FF72]' : 'text-red-400'}">Net Cashflow</p>
                    <p className={`text-4xl font-black ${net >= 0 ? 'text-[#C1FF72]' : 'text-red-400'}`}>{formatCurrency(net)}</p>
                </div>
            </div>
        );
    };

    const renderARAging = () => {
        if (!reportData) return null;
        return (
            <div className="bg-[#110915] rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#070308]">
                    <h3 className="font-bold text-white">Accounts Receivable Aging</h3>
                    <span className="text-[#C1FF72] font-black">{formatCurrency(reportData.total)} Total</span>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'Current', val: reportData.current, color: 'text-gray-300' },
                            { label: '1 - 30 Days', val: reportData.days_1_30, color: 'text-yellow-400' },
                            { label: '31 - 60 Days', val: reportData.days_31_60, color: 'text-orange-400' },
                            { label: '61 - 90 Days', val: reportData.days_61_90, color: 'text-red-400' },
                            { label: '90+ Days', val: reportData.over_90, color: 'text-red-600 font-bold' },
                        ].map((b, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">{b.label}</p>
                                <p className={`text-lg ${b.color}`}>{formatCurrency(b.val)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderExpenseAnalysis = () => {
        if (!reportData) return null;
        return (
            <div className="space-y-6">
                <div className="p-6 bg-[#070308] border border-white/10 rounded-2xl flex justify-between items-center shadow-lg">
                    <span className="text-gray-400 font-medium">Total Tracked Expenses</span>
                    <span className="text-2xl font-black text-red-400">{formatCurrency(reportData.total_expenses)}</span>
                </div>
                <div className="bg-[#110915] border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-xs text-gray-400 uppercase tracking-widest">
                                <th className="p-4">Category</th>
                                <th className="p-4">Trx Count</th>
                                <th className="p-4">% of Total</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {reportData.breakdown?.map((b: any, i: number) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-white">{b.category}</td>
                                    <td className="p-4 text-gray-400">{b.transaction_count}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-300 w-10">{b.percentage}%</span>
                                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${b.percentage}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-medium text-red-400">{formatCurrency(b.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {reportData.breakdown?.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No expenses recorded yet.</div>
                    )}
                </div>
            </div>
        );
    };

    const renderTaxReport = () => {
        if (!reportData) return null;
        const liability = reportData.net_tax_liability;
        return (
            <div className="bg-[#110915] rounded-2xl border border-white/10 p-6 shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"><FiDollarSign className="w-6 h-6" /></div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Estimated Tax Liability</h3>
                        <p className="text-gray-400 text-sm">Calculated from Invoices vs Expected Expense Offsets</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-gray-300">Taxes Collected on Sales</span>
                        <span className="font-bold text-blue-400">{formatCurrency(reportData.tax_collected_from_sales)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-gray-300 flex items-center gap-2">Estimated Taxes Paid on Purchases <span className="text-xs px-2 py-0.5 bg-gray-600 rounded-full text-white">14% Flat</span></span>
                        <span className="font-bold text-gray-400">-{formatCurrency(reportData.estimated_tax_paid_on_purchases)}</span>
                    </div>
                    <div className="flex justify-between items-center p-6 bg-[#070308] rounded-xl border border-white/10 mt-6">
                        <span className="text-lg font-bold text-white uppercase tracking-wider">Net Tax Liability</span>
                        <span className={`text-3xl font-black ${liability >= 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(liability)}</span>
                    </div>
                </div>
            </div>
        );
    };

    // ----- Main Render Router -----
    if (activeReport) {
        const CurrentConfig = reportConfig.find(r => r.id === activeReport);
        return (
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setActiveReport(null)}
                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                {CurrentConfig?.icon && <CurrentConfig.icon className="text-[#C1FF72]" />}
                                {CurrentConfig?.name}
                            </h1>
                            <p className="text-gray-400 text-sm">{CurrentConfig?.desc}</p>
                        </div>
                    </div>
                    {/* Placeholder for future email capability similar to Invoices */}
                    <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                        @ Email Report
                    </button>
                </div>

                {loadingData ? (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-4 border-white/20 border-t-[#C1FF72] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400 font-medium">Crunching the numbers...</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeReport === 'balance_sheet' && renderBalanceSheet()}
                        {activeReport === 'cashflow' && renderCashflow()}
                        {activeReport === 'ar_aging' && renderARAging()}
                        {activeReport === 'expense_analysis' && renderExpenseAnalysis()}
                        {activeReport === 'tax_report' && renderTaxReport()}
                    </div>
                )}
            </div>
        )
    }

    // Default Dashboard View
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Financial Reports</h1>
                    <p className="text-gray-400 mt-1">Generate automated statements and visual analysis modules</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {/* Basic P&L CSV Export Button */}
                    <button
                        onClick={() => handleDownload('pnl', 'csv')}
                        disabled={downloading !== null}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#070308] border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-all w-full md:w-auto whitespace-nowrap"
                    >
                        <FiDownload className="w-4 h-4" /> {downloading === 'pnl-csv' ? '...' : 'Export Global P&L CSV'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportConfig.map((report) => {
                    const Icon = report.icon;
                    return (
                        <div
                            key={report.id}
                            onClick={() => openReport(report.id)}
                            className="bg-[#070308] border border-white/10 rounded-2xl p-6 hover:border-[#C1FF72]/50 hover:bg-[#110915] transition-all flex flex-col group cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(193,255,114,0.1)] transform hover:-translate-y-1"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-6 group-hover:bg-[#C1FF72]/10 group-hover:border-[#C1FF72]/20 text-gray-400 group-hover:text-[#C1FF72] transition-colors shadow-inner">
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-xl text-white mb-2">{report.name}</h3>
                            <p className="text-sm text-gray-500 mb-6">{report.desc}</p>

                            <div className="mt-auto">
                                <span className="text-[#C1FF72] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                    View Report <FiArrowLeft className="rotate-180" />
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
