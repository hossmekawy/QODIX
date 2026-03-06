'use client';
import { useState, useEffect } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { FiPlus, FiFileText, FiDownload, FiCheckCircle } from 'react-icons/fi';
import api from '@/lib/api';
import Link from 'next/link';

export default function InvoicesPage() {
    const { fetchInvoices, loading } = useFinance();
    const [invoices, setInvoices] = useState<any[]>([]);

    // Email Modal State
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [emailAddress, setEmailAddress] = useState('');
    const [emailLang, setEmailLang] = useState<'en' | 'ar'>('en');
    const [sendingEmail, setSendingEmail] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await fetchInvoices();
            setInvoices(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendEmail = async (invoiceId: string, email: string, lang: 'en' | 'ar') => {
        if (!email) return;
        setSendingEmail(true);
        try {
            await api.post(`/finance/invoices/${invoiceId}/send_email/?lang=${lang}`, { email });
            setEmailModalOpen(false);
            // In a real app we'd trigger a success toast here
        } catch (error) {
            console.error('Failed to send email', error);
        } finally {
            setSendingEmail(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'Sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Partial': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
            case 'Paid': return 'bg-[#C1FF72]/20 text-[#C1FF72] border-[#C1FF72]/30';
            case 'Overdue': return 'bg-red-500/20 text-red-500 border-red-500/30';
            case 'Cancelled': return 'bg-gray-800 text-gray-600 border-gray-700';
            default: return 'bg-white/10 text-white border-white/20';
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: currency || 'EGP' }).format(amount);
    };

    const handleDownloadPdf = async (invoiceId: string, lang: 'en' | 'ar') => {
        try {
            const response = await api.get(`/finance/invoices/${invoiceId}/export_pdf/?lang=${lang}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${invoiceId}_${lang}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Invoices</h1>
                    <p className="text-gray-400 mt-1">Manage billing, track payments, and follow up</p>
                </div>
                <Link
                    href="/dashboard/finance/invoices/new"
                    className="flex items-center gap-2 px-6 py-3 bg-[#8ca33b] hover:bg-[#C1FF72] text-[#110915] font-black rounded-xl shadow-[0_0_30px_rgba(193,255,114,0.3)] hover:shadow-[0_0_40px_rgba(193,255,114,0.5)] transition-all transform hover:scale-105"
                >
                    <FiPlus className="w-5 h-5" /> Create Invoice
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading Invoices...</div>
            ) : invoices.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[#721C97]/30 rounded-3xl bg-[#070308]/50">
                    <FiFileText className="w-16 h-16 text-[#721C97]/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Invoices Found</h3>
                    <p className="text-gray-400 mt-2 max-w-md mx-auto">Create your first invoice to start getting paid.</p>
                </div>
            ) : (
                <div className="bg-[#070308] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#721C97]/30 bg-[#721C97]/10 text-xs uppercase tracking-widest text-[#C1FF72]">
                                    <th className="p-4 font-black">Invoice #</th>
                                    <th className="p-4 font-black">Customer</th>
                                    <th className="p-4 font-black">Date</th>
                                    <th className="p-4 font-black">Amount</th>
                                    <th className="p-4 font-black">Status</th>
                                    <th className="p-4 font-black text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 font-bold text-white">{inv.invoice_number}</td>
                                        <td className="p-4 text-gray-300">
                                            {inv.customer_details?.name}
                                            {inv.project_details && <span className="block text-xs text-gray-500 mt-1">Project: {inv.project_details.name}</span>}
                                        </td>
                                        <td className="p-4 text-gray-400">
                                            <div className="flex flex-col">
                                                <span>Issued: {inv.issue_date}</span>
                                                <span className={new Date(inv.due_date) < new Date() && inv.status !== 'Paid' ? 'text-red-500' : 'text-gray-500'}>
                                                    Due: {inv.due_date}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-black text-white">
                                            {formatCurrency(inv.total_amount, inv.currency)}
                                            {inv.status !== 'Paid' && inv.status !== 'Draft' && inv.amount_paid > 0 && (
                                                <span className="block text-xs text-[#C1FF72] font-normal mt-1">
                                                    Paid: {formatCurrency(inv.amount_paid, inv.currency)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusStyle(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setSelectedInvoice(inv);
                                                        setEmailModalOpen(true);
                                                    }}
                                                    className="p-2 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/30 rounded-lg transition-colors border border-blue-500/30 text-xs"
                                                    title="Email Invoice"
                                                >
                                                    <span className="flex items-center gap-1">@ Email</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPdf(inv.id, 'en')}
                                                    className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 text-xs"
                                                    title="Download English PDF"
                                                >
                                                    <span className="flex items-center gap-1"><FiDownload /> EN</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPdf(inv.id, 'ar')}
                                                    className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 text-xs"
                                                    title="Download Arabic PDF"
                                                >
                                                    <span className="flex items-center gap-1"><FiDownload /> AR</span>
                                                </button>
                                                {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                                                    <button className="p-2 text-[#C1FF72] hover:text-black bg-[#C1FF72]/10 hover:bg-[#C1FF72] rounded-lg transition-colors border border-[#C1FF72]/30 mt-0">
                                                        <FiCheckCircle />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {emailModalOpen && selectedInvoice && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#110915] border border-blue-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                        <h2 className="text-xl font-bold text-white mb-4">Email Invoice #{selectedInvoice.invoice_number}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Customer Email</label>
                                <input
                                    type="email"
                                    defaultValue={selectedInvoice.customer_details?.email || ''}
                                    onChange={(e) => setEmailAddress(e.target.value)}
                                    className="w-full bg-[#070308] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="client@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Language</label>
                                <select
                                    className="w-full bg-[#070308] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    defaultValue="en"
                                    onChange={(e) => setEmailLang(e.target.value as 'en' | 'ar')}
                                >
                                    <option value="en">English PDF</option>
                                    <option value="ar">Arabic PDF</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setEmailModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSendEmail(selectedInvoice.id, emailAddress || selectedInvoice.customer_details?.email || '', emailLang)}
                                disabled={sendingEmail}
                                className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {sendingEmail ? 'Sending...' : 'Send Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
