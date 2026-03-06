'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { FiDollarSign, FiAlertCircle, FiPlus, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

interface ProjectFinancialsTabProps {
    projectId: string;
    projectBudget: number;
}

export default function ProjectFinancialsTab({ projectId, projectBudget }: ProjectFinancialsTabProps) {
    const [bugs, setBugs] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [team, setTeam] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    // Modals
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const [bugData, setBugData] = useState({ project: projectId, title: '', description: '', status: 'Open', priority: 'High', assigned_to: '' });
    const [paymentData, setPaymentData] = useState({ project: projectId, title: '', amount: '', due_date: '', received_date: null, status: 'Pending' });

    useEffect(() => {
        fetchData();
        fetchTeam();
    }, [projectId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [bugRes, payRes] = await Promise.all([
                api.get(`/projects/bugs/?project=${projectId}`),
                api.get(`/projects/payments/?project=${projectId}`)
            ]);
            setBugs(bugRes.data);
            setPayments(payRes.data);
        } catch (error) {
            toast.error('Failed to load financial & QA data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTeam = () => {
        api.get(`/projects/team-members/?project=${projectId}`)
            .then(res => setTeam(res.data))
            .catch(() => { });
    };

    const handleSaveBug = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/projects/bugs/', bugData);
            toast.success('Bug ticket created');
            setIsBugModalOpen(false);
            setBugData({ project: projectId, title: '', description: '', status: 'Open', priority: 'High', assigned_to: '' });
            fetchData();
        } catch (error) {
            toast.error('Failed to save bug');
        }
    };

    const handleSavePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/projects/payments/', paymentData);
            toast.success('Payment milestone created');
            setIsPaymentModalOpen(false);
            setPaymentData({ project: projectId, title: '', amount: '', due_date: '', received_date: null, status: 'Pending' });
            fetchData();
        } catch (error) {
            toast.error('Failed to save payment milestone');
        }
    };

    const handleDeleteBug = async (id: number) => {
        if (!confirm('Delete this bug?')) return;
        await api.delete(`/projects/bugs/${id}/`).then(() => { toast.success('Deleted'); fetchData(); });
    };

    const handleDeletePayment = async (id: number) => {
        if (!confirm('Delete this payment milestone?')) return;
        await api.delete(`/projects/payments/${id}/`).then(() => { toast.success('Deleted'); fetchData(); });
    };

    const updateBugStatus = async (id: number, status: string) => {
        await api.patch(`/projects/bugs/${id}/`, { status }).then(() => fetchData());
    };

    const updatePaymentStatus = async (id: number, status: string) => {
        const payload = status === 'Paid' ? { status, received_date: new Date().toISOString().split('T')[0] } : { status, received_date: null };
        await api.patch(`/projects/payments/${id}/`, payload).then(() => fetchData());
    };

    const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Financial Payments Sector */}
                <div className="bg-[#070308] border border-white/10 rounded-2xl p-5 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2 text-emerald-500">
                            <FiDollarSign className="w-5 h-5 bg-emerald-500/20 rounded p-0.5" />
                            <h3 className="text-lg font-bold text-white">Payment Milestones</h3>
                        </div>
                        <button onClick={() => setIsPaymentModalOpen(true)} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 rounded-lg font-bold hover:bg-emerald-500/40 text-xs flex gap-1 items-center">
                            <FiPlus /> Add Invoice
                        </button>
                    </div>

                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center text-sm">
                        <span className="text-gray-300">Total Quoted Budget: <strong className="text-white">${parseFloat(projectBudget as any).toLocaleString()}</strong></span>
                        <span className="text-emerald-500 font-bold">Received: ${totalPaid.toLocaleString()}</span>
                    </div>

                    {isLoading ? <div className="text-center py-4 text-gray-500 italic">Loading...</div> : payments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl text-sm">No payment milestones defined.</div>
                    ) : (
                        <div className="space-y-3">
                            {payments.map(pay => (
                                <div key={pay.id} className={`flex items-center justify-between p-4 bg-white/5 border rounded-xl group transition-all ${pay.status === 'Paid' ? 'border-emerald-500/30' : 'border-white/10'}`}>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-white text-base">{pay.title}</h4>
                                            <span className="text-lg font-black text-emerald-400">${parseFloat(pay.amount).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs mt-2">
                                            <span className="text-gray-500">Due: {pay.due_date}</span>
                                            {pay.status === 'Paid' ? (
                                                <span className="text-emerald-500 font-bold flex items-center gap-1"><FiCheck /> Received {pay.received_date}</span>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button onClick={() => updatePaymentStatus(pay.id, 'Paid')} className="px-2 py-1 bg-emerald-500/20 text-emerald-500 rounded hover:bg-emerald-500/40 border border-emerald-500/30">Mark Paid</button>
                                                    <button onClick={() => handleDeletePayment(pay.id)} className="px-2 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/40 border border-red-500/30"><FiTrash2 /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bug Tracking Sector */}
                <div className="bg-[#070308] border border-white/10 rounded-2xl p-5 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2 text-rose-500">
                            <FiAlertCircle className="w-5 h-5" />
                            <h3 className="text-lg font-bold text-white">QA Bug Tracking</h3>
                        </div>
                        <button onClick={() => setIsBugModalOpen(true)} className="px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-lg font-bold hover:bg-rose-500/40 text-xs flex gap-1 items-center">
                            <FiPlus /> Log Bug
                        </button>
                    </div>

                    {isLoading ? <div className="text-center py-4 text-gray-500 italic">Loading...</div> : bugs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl text-sm">No bugs reported. Quality is solid!</div>
                    ) : (
                        <div className="space-y-4">
                            {bugs.map(bug => (
                                <div key={bug.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-rose-500/30 transition-colors group relative">
                                    <button onClick={() => handleDeleteBug(bug.id)} className="absolute top-4 right-4 p-1.5 text-red-500/50 hover:text-red-400 bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all z-10"><FiTrash2 size={14} /></button>

                                    <div className="flex justify-between items-start mb-2 pr-8">
                                        <div>
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border mr-2 ${bug.priority === 'Critical' ? 'text-red-500 border-red-500/30' : bug.priority === 'High' ? 'text-orange-500 border-orange-500/30' : 'text-yellow-500 border-yellow-500/30'}`}>{bug.priority}</span>
                                            <h4 className="font-bold text-white text-base inline">{bug.title}</h4>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{bug.description}</p>

                                    <div className="flex justify-between items-center text-xs border-t border-white/10 pt-3">
                                        <select
                                            className={`font-bold uppercase px-2 py-1 rounded bg-[#070308] border outline-none ${bug.status === 'Resolved' ? 'text-[#C1FF72] border-[#C1FF72]/30' : bug.status === 'Closed' ? 'text-gray-500 border-gray-500/30' : 'text-rose-400 border-rose-500/30'}`}
                                            value={bug.status}
                                            onChange={(e) => updateBugStatus(bug.id, e.target.value)}
                                        >
                                            <option value="Open">Open</option>
                                            <option value="In-Progress">In-Progress</option>
                                            <option value="Resolved">Resolved</option>
                                            <option value="Closed">Closed</option>
                                        </select>

                                        {bug.assigned_to_details && (
                                            <span className="text-gray-400">Assigned: <span className="text-white">{bug.assigned_to_details.first_name || bug.assigned_to_details.username}</span></span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#070308] border border-emerald-500/30 rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                        <div className="p-6 border-b border-emerald-500/20">
                            <h2 className="text-xl font-bold text-white">Create Payment Milestone</h2>
                        </div>
                        <form onSubmit={handleSavePayment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Invoice / Milestone Title*</label>
                                <input required type="text" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" value={paymentData.title} onChange={e => setPaymentData({ ...paymentData, title: e.target.value })} placeholder="e.g. 50% Upfront Deposit" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Amount ($)*</label>
                                    <input required type="number" step="0.01" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })} placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Due Date*</label>
                                    <input required type="date" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" value={paymentData.due_date} onChange={e => setPaymentData({ ...paymentData, due_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-white/10 mt-6">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 border border-white/10 text-white rounded-lg hover:bg-white/5">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-500 text-[#070308] font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400">Save Invoice</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bug Tracking Modal */}
            {isBugModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#070308] border border-rose-500/30 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(244,63,94,0.15)]">
                        <div className="p-6 border-b border-rose-500/20">
                            <h2 className="text-xl font-bold text-white">Log QA Bug</h2>
                        </div>
                        <form onSubmit={handleSaveBug} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Bug Title*</label>
                                <input required type="text" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-rose-500" value={bugData.title} onChange={e => setBugData({ ...bugData, title: e.target.value })} placeholder="e.g. Login button unresponsive on iOS Safari" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Priority</label>
                                    <select className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-rose-500" value={bugData.priority} onChange={e => setBugData({ ...bugData, priority: e.target.value })}>
                                        <option value="Critical">Critical</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-rose-400 mb-1">Assign To (Optional)</label>
                                    <select className="w-full bg-rose-500/5 text-rose-400 border border-rose-500/20 rounded-lg px-3 py-2 outline-none focus:border-rose-500" value={bugData.assigned_to} onChange={e => setBugData({ ...bugData, assigned_to: e.target.value })}>
                                        <option value="">-- Unassigned --</option>
                                        {team.map(member => (
                                            <option key={member.user_details.id} value={member.user_details.id}>{member.user_details.first_name || member.user_details.username} ({member.role})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Detailed Description & Replication Steps</label>
                                <textarea required rows={4} className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-3 text-white outline-none focus:border-rose-500 text-sm custom-scrollbar" value={bugData.description} onChange={e => setBugData({ ...bugData, description: e.target.value })} placeholder="Steps to reproduce..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-white/10 mt-6">
                                <button type="button" onClick={() => setIsBugModalOpen(false)} className="px-5 py-2 border border-white/10 text-white rounded-lg hover:bg-white/5">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-rose-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:bg-rose-400">Log Bug Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
