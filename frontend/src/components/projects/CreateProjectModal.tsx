'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { FiX, FiUserPlus, FiCheck } from 'react-icons/fi';

interface CreateProjectModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
    const toast = useToast();

    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientIndustry, setNewClientIndustry] = useState('Technology');

    const [formData, setFormData] = useState({
        name: '',
        customer: '',
        project_type: 'WebApp',
        priority: 'Medium',
        description: '',
        scope: '',
        start_date: '',
        deadline: '',
        budget_quoted: '',
        payment_terms: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = () => {
        setIsLoadingCustomers(true);
        api.get('/crm/customers/')
            .then(res => setCustomers(res.data.results || res.data))
            .catch(() => toast.error('Failed to load customers'))
            .finally(() => setIsLoadingCustomers(false));
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/crm/customers/', { name: newClientName, industry: newClientIndustry });
            setCustomers([...customers, res.data]);
            setFormData({ ...formData, customer: res.data.id.toString() });
            setIsCreatingClient(false);
            setNewClientName('');
            toast.success('New Client created successfully!');
        } catch (error) {
            toast.error('Failed to create new client.');
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/projects/projects/', formData);
            toast.success('Project created successfully!');
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create project.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#070308] border border-[#C1FF72]/50 rounded-2xl w-full max-w-3xl shadow-[0_0_40px_rgba(193,255,114,0.15)] flex flex-col max-h-[95vh]">

                <div className="p-6 border-b border-[#C1FF72]/20 flex justify-between items-center shrink-0">
                    <h2 className="text-2xl font-black text-white tracking-tight">Setup New Project</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="p-6 text-sm overflow-y-auto custom-scrollbar flex-1">
                    {/* Client Selection Box */}
                    <div className="mb-8 p-5 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden shrink-0">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white text-lg">1. Select Client Organization</h3>
                            {!isCreatingClient && (
                                <button onClick={() => setIsCreatingClient(true)} type="button" className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-500/30 transition-colors border border-blue-500/30 font-bold">
                                    <FiUserPlus /> Create New Client
                                </button>
                            )}
                        </div>

                        {isCreatingClient ? (
                            <form onSubmit={handleCreateClient} className="flex flex-col md:flex-row gap-3 items-end p-4 bg-[#070308] rounded-xl border border-blue-500/30">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Company / Contact Name*</label>
                                    <input required type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" placeholder="e.g. Acme Corp" />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Industry*</label>
                                    <select required value={newClientIndustry} onChange={e => setNewClientIndustry(e.target.value)} className="w-full bg-[#070308] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500">
                                        <option value="Technology">Technology</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    <button type="button" onClick={() => setIsCreatingClient(false)} className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white bg-white/5">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-1 hover:bg-blue-600 font-bold"><FiCheck /> Save Client</button>
                                </div>
                            </form>
                        ) : (
                            <div>
                                {isLoadingCustomers ? (
                                    <p className="text-gray-500 italic">Loading clients database...</p>
                                ) : (
                                    <select
                                        required
                                        className="w-full bg-[#070308] border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 text-base"
                                        value={formData.customer}
                                        onChange={e => setFormData({ ...formData, customer: e.target.value })}
                                    >
                                        <option value="" disabled>-- Select an existing Client from CRM --</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} {c.company_name ? `(${c.company_name})` : ''}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleCreateProject} id="projectForm">
                        <div className="space-y-6">
                            {/* General Project Info */}
                            <div>
                                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-[#C1FF72] rounded-full"></div> 2. Project Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Project Name*</label>
                                        <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none focus:border-[#C1FF72] transition-colors" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Qodix ERP V2" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Project Type</label>
                                        <select className="w-full bg-[#070308] border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none focus:border-[#C1FF72] transition-colors" value={formData.project_type} onChange={e => setFormData({ ...formData, project_type: e.target.value })}>
                                            <option value="WebApp">Web Application</option>
                                            <option value="Website">Website</option>
                                            <option value="MobileApp">Mobile App</option>
                                            <option value="DesktopApp">Desktop App</option>
                                            <option value="System">System Integration</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Priority Level</label>
                                        <select className="w-full bg-[#070308] border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none focus:border-[#C1FF72] transition-colors" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                            <option value="Critical">Critical</option>
                                            <option value="High">High</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Low">Low</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Scope & Timing */}
                            <div className="border-t border-white/10 pt-6">
                                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div> 3. Scope & Timeline
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Target Start Date</label>
                                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none focus:border-purple-500 transition-colors" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Deadline Delivery</label>
                                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white outline-none focus:border-purple-500 transition-colors" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Brief Description</label>
                                        <textarea rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 transition-colors" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="High-level overview of the project goal..."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Detailed Technical Scope</label>
                                        <textarea rows={4} className="w-full bg-[#070308] border border-white/10 rounded-lg px-3 py-3 text-gray-300 outline-none focus:border-purple-500 transition-colors font-mono text-xs custom-scrollbar" value={formData.scope} onChange={e => setFormData({ ...formData, scope: e.target.value })} placeholder="1. Authentication System&#10;2. Billing Module&#10;..."></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Financial */}
                            <div className="border-t border-white/10 pt-6">
                                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div> 4. Initial Financials
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Quoted Budget (EGP/USD)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                            <input type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2.5 text-white outline-none focus:border-amber-500 transition-colors" value={formData.budget_quoted} onChange={e => setFormData({ ...formData, budget_quoted: e.target.value })} placeholder="50000.00" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Terms & Milestones</label>
                                        <textarea rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 transition-colors" value={formData.payment_terms} onChange={e => setFormData({ ...formData, payment_terms: e.target.value })} placeholder="e.g. 50% upfront, 25% after UI, 25% on delivery..."></textarea>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </form>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-[#C1FF72]/20 flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors">Cancel Setup</button>
                    <button
                        type="submit"
                        form="projectForm"
                        disabled={isSubmitting || !formData.customer}
                        className="px-8 py-3 rounded-xl bg-[#C1FF72] text-[#070308] font-black hover:bg-[#aef05f] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(193,255,114,0.3)] flex items-center gap-2"
                    >
                        {isSubmitting ? 'Creating Project...' : 'Launch Project System'}
                    </button>
                </div>
            </div>
        </div>
    );
}
