'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { FiX, FiUserPlus, FiCheck, FiTag, FiSettings } from 'react-icons/fi';
import TagManagerModal from '@/components/crm/TagManagerModal';

interface Tag {
    id: number;
    name: string;
    color: string;
}

interface CreateProjectModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
    const toast = useToast();

    // Tags Management
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);

    const [isCreatingClient, setIsCreatingClient] = useState(false);

    // Detailed Client Form Data
    const [clientData, setClientData] = useState({
        name: '',
        company_name: '',
        industry: 'Technology',
        email: '',
        phone: '',
        website: '',
        address: '',
        notes: '',
        tag_ids: [] as number[]
    });

    const [formData, setFormData] = useState({
        name: '',
        customer: '',
        project_type: 'WebApp',
        priority: 'Medium'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCustomers();
        api.get('/crm/tags/')
            .then(res => setAvailableTags(res.data))
            .catch(err => console.error("Failed to load tags", err));
    }, []);

    const fetchCustomers = () => {
        setIsLoadingCustomers(true);
        api.get('/crm/customers/')
            .then(res => setCustomers(res.data.results || res.data))
            .catch(() => toast.error('Failed to load customers'))
            .finally(() => setIsLoadingCustomers(false));
    };

    const handleTagAdded = (newTag: Tag) => {
        setAvailableTags(prev => [...prev, newTag]);
        setClientData(prev => ({ ...prev, tag_ids: [...prev.tag_ids, newTag.id] }));
    };

    const handleTagToggle = (tagId: number) => {
        setClientData(prev => {
            if (prev.tag_ids.includes(tagId)) {
                return { ...prev, tag_ids: prev.tag_ids.filter(id => id !== tagId) };
            } else {
                return { ...prev, tag_ids: [...prev.tag_ids, tagId] };
            }
        });
    };

    const handleClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setClientData({ ...clientData, [e.target.name]: e.target.value });
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/crm/customers/', clientData);
            setCustomers([...customers, res.data]);
            setFormData({ ...formData, customer: res.data.id.toString() });
            setIsCreatingClient(false);
            setClientData({
                name: '', company_name: '', industry: 'Technology', email: '', phone: '', website: '', address: '', notes: '', tag_ids: []
            });
            toast.success('New Client created successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create new client.');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-hidden">
            <div className="bg-[#070308] border border-[#C1FF72]/50 rounded-2xl w-full max-w-3xl shadow-[0_0_40px_rgba(193,255,114,0.15)] flex flex-col max-h-[100dvh] sm:max-h-[95vh] relative m-auto">

                <div className="p-4 sm:p-6 border-b border-[#C1FF72]/20 flex justify-between items-center shrink-0">
                    <h2 className="text-2xl font-black text-white tracking-tight">Setup New Project</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="p-4 sm:p-6 text-sm overflow-y-auto custom-scrollbar flex-1">
                    {/* Client Selection Box */}
                    <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden shrink-0">
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
                            <form onSubmit={handleCreateClient} className="flex flex-col gap-4 p-5 bg-[#070308] rounded-xl border border-blue-500/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Company / Contact Name*</label>
                                        <input required type="text" name="name" value={clientData.name} onChange={handleClientChange} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" placeholder="e.g. Acme Corp" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Official Company Name</label>
                                        <input type="text" name="company_name" value={clientData.company_name} onChange={handleClientChange} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Industry*</label>
                                        <input required type="text" name="industry" value={clientData.industry} onChange={handleClientChange} className="w-full bg-[#070308] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" placeholder="Technology" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                                        <input type="email" name="email" value={clientData.email} onChange={handleClientChange} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</label>
                                        <input type="tel" name="phone" value={clientData.phone} onChange={handleClientChange} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Website</label>
                                        <input type="url" name="website" value={clientData.website} onChange={handleClientChange} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" placeholder="https://" />
                                    </div>
                                    <div className="md:col-span-2 border-t border-white/10 pt-4 mt-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <FiTag /> Select Tags
                                            </label>
                                            <button type="button" onClick={() => setIsTagModalOpen(true)} className="text-xs flex items-center gap-1 font-bold text-blue-400 hover:underline bg-blue-500/10 px-2 py-1 rounded">
                                                <FiSettings /> Manage Tags
                                            </button>
                                        </div>
                                        {availableTags.length === 0 ? (
                                            <p className="text-xs text-gray-500 italic">No tags available.</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {availableTags.map(tag => (
                                                    <button
                                                        key={tag.id}
                                                        type="button"
                                                        onClick={() => handleTagToggle(tag.id)}
                                                        className={`px-2 py-1 rounded text-xs font-bold border transition-all ${clientData.tag_ids.includes(tag.id) ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                                        style={{
                                                            borderColor: tag.color,
                                                            color: clientData.tag_ids.includes(tag.id) ? '#000' : tag.color,
                                                            backgroundColor: clientData.tag_ids.includes(tag.id) ? tag.color : 'transparent'
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/10">
                                    <button type="button" onClick={() => setIsCreatingClient(false)} className="px-5 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white bg-white/5 font-bold">Cancel</button>
                                    <button type="submit" className="px-5 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 font-bold"><FiCheck /> Save Client Profile</button>
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

                            {/* Removed Scope and Financials */}
                            <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-4 text-center text-sm text-gray-400">
                                <p>You can add Scope, Deadlines, Details, and Financial Quotes later from the <strong>Project Dashboard</strong> once the project is created.</p>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-6 border-t border-[#C1FF72]/20 flex justify-end gap-2 sm:gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors text-xs sm:text-base">Cancel Setup</button>
                    <button
                        type="submit"
                        form="projectForm"
                        disabled={isSubmitting || !formData.customer}
                        className="px-4 sm:px-8 py-2 sm:py-3 rounded-xl bg-[#C1FF72] text-[#070308] font-black hover:bg-[#aef05f] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(193,255,114,0.3)] flex items-center gap-2 text-xs sm:text-base"
                    >
                        {isSubmitting ? 'Creating Project...' : 'Launch Project System'}
                    </button>
                </div>
            </div>

            <TagManagerModal
                isOpen={isTagModalOpen}
                onClose={() => {
                    setIsTagModalOpen(false);
                    api.get('/crm/tags/').then(res => setAvailableTags(res.data)).catch(() => { });
                }}
                onTagAdded={handleTagAdded}
            />
        </div>
    );
}
