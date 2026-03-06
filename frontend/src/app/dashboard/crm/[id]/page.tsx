'use client';
import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { FiArrowLeft, FiEdit2, FiSave, FiX, FiDownload, FiTrash2, FiFileText, FiUploadCloud, FiSettings, FiCalendar, FiPlusCircle, FiBriefcase } from 'react-icons/fi';
import Link from 'next/link';
import TagManagerModal from '@/components/crm/TagManagerModal';
import { useToast } from '@/contexts/ToastContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Mini Modal Component for logging a new interaction
function RecordInteractionModal({ isOpen, onClose, customerId, onSaved }: { isOpen: boolean, onClose: () => void, customerId: string, onSaved: () => void }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        interaction_type: 'Call',
        notes: '',
        next_followup_date: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/crm/interactions/', {
                customer: customerId,
                ...formData
            });
            toast.success('Interaction logged successfully!');
            onSaved();
            onClose();
            setFormData({ interaction_type: 'Call', notes: '', next_followup_date: '' });
        } catch (error) {
            toast.error('Failed to log interaction.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#110915] border border-[#721C97]/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-[#721C97]/30 flex justify-between items-center bg-[#070308]">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FiFileText className="text-[#C1FF72]" /> Log Interaction
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Type</label>
                        <select
                            className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C1FF72] transition-colors"
                            value={formData.interaction_type}
                            onChange={(e) => setFormData({ ...formData, interaction_type: e.target.value })}
                        >
                            <option value="Call">Call</option>
                            <option value="Meeting">Meeting</option>
                            <option value="Email">Email</option>
                            <option value="Note">Note</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Notes & Details</label>
                        <textarea
                            required
                            rows={4}
                            className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C1FF72] transition-colors resize-none"
                            placeholder="What was discussed?"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Schedule Next Follow-up (Optional)</label>
                        <div className="relative">
                            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#C1FF72] transition-colors"
                                value={formData.next_followup_date}
                                onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 pl-1">Setting this will automatically trigger a System Notification.</p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-xl font-bold text-[#070308] bg-[#C1FF72] hover:bg-[#aef556] transition-colors disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [customer, setCustomer] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<any>({});
    const [availableTags, setAvailableTags] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
    const [isEditingFollowUp, setIsEditingFollowUp] = useState(false);
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const dashboardRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    const handleTagAdded = (newTag: any) => {
        setAvailableTags(prev => [...prev, newTag]);
        setEditFormData((prev: any) => ({ ...prev, tag_ids: [...(prev.tag_ids || []), newTag.id] }));
    };

    const fetchCustomer = () => {
        api.get(`/crm/customers/${id}/`)
            .then(res => {
                setCustomer(res.data);
                setEditFormData({
                    name: res.data.name,
                    company_name: res.data.company_name,
                    industry: res.data.industry,
                    email: res.data.email,
                    phone: res.data.phone,
                    address: res.data.address,
                    website: res.data.website,
                    last_contact_date: res.data.last_contact_date,
                    next_followup_date: res.data.next_followup_date,
                    notes: res.data.notes,
                    tag_ids: res.data.tags.map((t: any) => t.id)
                });
            })
            .catch(() => router.push('/dashboard/crm'));
    };

    useEffect(() => {
        fetchCustomer();
        api.get('/crm/tags/').then(res => setAvailableTags(res.data)).catch(() => { });
    }, [id]);

    const handleSaveProfile = async () => {
        try {
            const dataToSubmit = { ...editFormData };
            if (!dataToSubmit.last_contact_date) delete dataToSubmit.last_contact_date;
            if (!dataToSubmit.next_followup_date) delete dataToSubmit.next_followup_date;

            await api.patch(`/crm/customers/${id}/`, dataToSubmit);
            setIsEditing(false);
            fetchCustomer();
            toast.success('Customer details updated successfully!');
        } catch (error) {
            toast.error('Failed to update customer details.');
        }
    };

    const handleQuickFollowUpChange = async (newDate: string) => {
        try {
            await api.patch(`/crm/customers/${id}/`, { next_followup_date: newDate || null });
            fetchCustomer();
            toast.success('Follow-up date updated!');
            setIsEditingFollowUp(false);
        } catch (error) {
            toast.error('Failed to update follow-up date.');
        }
    };

    const handleQuickTagsSave = async (newTagIds: number[]) => {
        try {
            await api.patch(`/crm/customers/${id}/`, { tag_ids: newTagIds });
            fetchCustomer();
            toast.success('Tags updated successfully!');
            setIsEditingTags(false);
        } catch (error) {
            toast.error('Failed to update tags.');
        }
    };

    const handleQuickNotesSave = async () => {
        try {
            await api.patch(`/crm/customers/${id}/`, { notes: editFormData.notes });
            fetchCustomer();
            toast.success('Notes saved successfully!');
            setIsEditingNotes(false);
        } catch (error) {
            toast.error('Failed to save notes.');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError('');
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/crm/customers/${id}/attachments/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchCustomer(); // Refresh attachments
            toast.success('Attachment uploaded successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to upload file.');
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        if (!confirm('Delete this file?')) return;
        try {
            await api.delete(`/crm/customers/${id}/attachments/${attachmentId}/`);
            fetchCustomer();
            toast.success('Attachment deleted.');
        } catch (error) {
            toast.error('Failed to delete attachment.');
        }
    };

    const generatePDF = async () => {
        try {
            toast.info("Generating high-quality PDF report...");

            // Dynamic import to avoid SSR context issues and heavy payload on initial load
            const { pdf } = await import('@react-pdf/renderer');
            const { CustomerPDF } = await import('@/components/crm/CustomerPDF');

            const blob = await pdf(<CustomerPDF customer={customer} />).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${customer.name.replace(/\s+/g, '_')}_CRM_Report.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Professional PDF generated successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate PDF. Check console.');
        }
    };

    if (!customer) return <div className="p-8 text-center text-gray-500">Loading customer profile...</div>;

    // Use actual interaction history from the API
    const interactionActivity = customer.interaction_ytd || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#721C97]/30 pb-6 relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#C1FF72]/20 blur-[80px] pointer-events-none rounded-full"></div>

                <div className="flex items-center gap-4 relative z-10">
                    <Link href="/dashboard/crm" className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                        <FiArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            {customer.name}
                            {customer.industry && <span className="text-sm font-semibold text-[#070308] bg-[#C1FF72] px-3 py-1 rounded-full">{customer.industry}</span>}
                        </h1>
                        <p className="text-[#C1FF72] mt-1 font-mono tracking-wide">{customer.company_name || 'Individual Client'}</p>
                    </div>
                </div>

                <div className="flex gap-3 relative z-10 w-full md:w-auto print:hidden">
                    <button onClick={() => setIsInteractionModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#721C97]/20 border border-[#721C97]/50 text-white rounded-xl hover:bg-[#721C97]/40 transition-all font-bold tracking-wide">
                        <FiPlusCircle /> Log Interaction
                    </button>
                    <button onClick={generatePDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#070308] border border-[#721C97]/50 text-[#C1FF72] rounded-xl hover:bg-[#721C97]/20 hover:border-[#C1FF72] transition-all font-bold shadow-[0_0_15px_rgba(114,28,151,0.2)] tracking-wide">
                        <FiDownload /> Export PDF
                    </button>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#C1FF72] text-[#070308] rounded-xl hover:bg-[#aef556] transition-colors shadow-[0_0_20px_rgba(193,255,114,0.3)] font-bold tracking-wide">
                            <FiEdit2 /> Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Dashboard Container (For PDF Export) */}
            <div ref={dashboardRef} className="space-y-6 p-1">
                <style>{`
                    @media print {
                        body { background-color: white !important; color: black !important; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        aside, header, nav { display: none !important; }
                        .print\\:hidden { display: none !important; }
                        main { padding: 0 !important; margin: 0 !important; }
                    }
                    .pdf-fix text { fill: #fff !important; }
                    .pdf-fix .recharts-cartesian-grid-horizontal line, .pdf-fix .recharts-cartesian-grid-vertical line { stroke: #333 !important; }
                `}</style>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Profile & Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-6 shadow-[0_8px_32px_rgba(114,28,151,0.1)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#721C97]/30 blur-[50px] pointer-events-none rounded-full"></div>
                            <h3 className="text-xl font-bold text-white mb-4 border-b border-[#721C97]/30 pb-2 relative z-10">
                                Contact Details
                            </h3>

                            {isEditing ? (
                                <div className="space-y-4 relative z-10 max-h-[60vh] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Customer Name</label><input type="text" className="w-full bg-[#070308]/80 border border-[#721C97]/50 rounded-lg px-3 py-2 text-white" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Company Name</label><input type="text" className="w-full bg-[#070308]/80 border border-[#721C97]/50 rounded-lg px-3 py-2 text-white" value={editFormData.company_name || ''} onChange={e => setEditFormData({ ...editFormData, company_name: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Industry</label><input type="text" className="w-full bg-[#070308]/80 border border-[#721C97]/50 rounded-lg px-3 py-2 text-white" value={editFormData.industry || ''} onChange={e => setEditFormData({ ...editFormData, industry: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input type="email" className="w-full bg-[#070308]/80 border border-[#721C97]/50 rounded-lg px-3 py-2 text-white" value={editFormData.email || ''} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Phone</label><input type="text" className="w-full bg-[#070308]/80 border border-[#721C97]/50 rounded-lg px-3 py-2 text-white" value={editFormData.phone || ''} onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Website</label><input type="url" className="w-full bg-[#070308]/80 border border-[#721C97]/50 rounded-lg px-3 py-2 text-white" value={editFormData.website || ''} onChange={e => setEditFormData({ ...editFormData, website: e.target.value })} placeholder="https://" /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Address</label><textarea className="w-full bg-[#070308]/80 border border-[#721C97]/50 rounded-lg px-3 py-2 text-white resize-none" rows={2} value={editFormData.address || ''} onChange={e => setEditFormData({ ...editFormData, address: e.target.value })} /></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Last Contact</label><input type="date" className="w-full bg-[#070308]/80 border border-[#721C97]/50 rounded-lg px-2 py-2 text-white text-sm" value={editFormData.last_contact_date || ''} onChange={e => setEditFormData({ ...editFormData, last_contact_date: e.target.value })} /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Next Follow-up</label><input type="date" className="w-full bg-[#070308]/80 border border-[#721C97]/50 rounded-lg px-2 py-2 text-white text-sm" value={editFormData.next_followup_date || ''} onChange={e => setEditFormData({ ...editFormData, next_followup_date: e.target.value })} /></div>
                                    </div>

                                    <div className="flex gap-2 pt-2 pb-1 sticky bottom-0 bg-[#070308] p-1 -mx-1 border-t border-[#721C97]/30 mt-4 rounded-b-lg">
                                        <button onClick={() => setIsEditing(false)} className="flex-1 py-2 rounded-lg bg-[#721C97]/20 hover:bg-[#721C97]/40 text-white font-bold text-sm transition-colors">Cancel</button>
                                        <button onClick={handleSaveProfile} className="flex-1 py-2 rounded-lg bg-[#C1FF72] text-[#070308] hover:bg-[#aef556] font-bold text-sm shadow-[0_0_10px_rgba(193,255,114,0.3)] transition-colors">Save</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 relative z-10">
                                    <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email</span><a href={`mailto:${customer.email}`} className="text-[#C1FF72] hover:underline break-all">{customer.email || 'N/A'}</a></div>
                                    <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Phone</span><a href={`tel:${customer.phone}`} className="text-white hover:text-[#C1FF72]">{customer.phone || 'N/A'}</a></div>
                                    <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Website</span>{customer.website ? <a href={customer.website} target="_blank" rel="noreferrer" className="text-[#721C97] hover:text-[#C1FF72] hover:underline break-all">{customer.website}</a> : <span className="text-gray-500">N/A</span>}</div>
                                    <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Address</span><span className="text-gray-300">{customer.address || 'N/A'}</span></div>
                                </div>
                            )}
                        </div>

                        {/* Tags Card */}
                        <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-6 shadow-[0_8px_32px_rgba(114,28,151,0.1)] group">
                            <div className="flex justify-between items-center mb-4 border-b border-[#721C97]/30 pb-2">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    Tags
                                    {!isEditing && !isEditingTags && (
                                        <button onClick={() => { setIsEditingTags(true); setEditFormData((prev: any) => ({ ...prev, tag_ids: customer.tags.map((t: any) => t.id) })); }} className="text-gray-500 hover:text-[#C1FF72] opacity-0 group-hover:opacity-100 transition-opacity" title="Quick Edit Tags">
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </h3>
                                {(isEditing || isEditingTags) && (
                                    <button onClick={() => setIsTagModalOpen(true)} className="text-xs font-bold text-[#C1FF72] flex items-center gap-1 hover:underline bg-[#C1FF72]/10 px-2 py-1 rounded">
                                        <FiSettings /> Manage Available Tags
                                    </button>
                                )}
                            </div>

                            {(isEditing || isEditingTags) ? (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {availableTags.length === 0 ? <p className="text-gray-500 italic text-sm">No tags available.</p> : availableTags.map(tag => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => {
                                                    setEditFormData((prev: any) => {
                                                        const tagIds = prev.tag_ids || [];
                                                        if (tagIds.includes(tag.id)) {
                                                            return { ...prev, tag_ids: tagIds.filter((id: number) => id !== tag.id) };
                                                        } else {
                                                            return { ...prev, tag_ids: [...tagIds, tag.id] };
                                                        }
                                                    });
                                                }}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${editFormData.tag_ids?.includes(tag.id) ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-100'}`}
                                                style={{
                                                    borderColor: tag.color,
                                                    color: editFormData.tag_ids?.includes(tag.id) ? '#000' : tag.color,
                                                    backgroundColor: editFormData.tag_ids?.includes(tag.id) ? tag.color : 'transparent'
                                                }}
                                            >
                                                {tag.name}
                                            </button>
                                        ))}
                                    </div>
                                    {isEditingTags && !isEditing && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsEditingTags(false)} className="px-3 py-1.5 rounded-lg bg-[#721C97]/20 hover:bg-[#721C97]/40 text-white font-bold text-xs transition-colors">Cancel</button>
                                            <button onClick={() => handleQuickTagsSave(editFormData.tag_ids)} className="px-3 py-1.5 rounded-lg bg-[#C1FF72] text-[#070308] hover:bg-[#aef556] font-bold text-xs shadow-[0_0_10px_rgba(193,255,114,0.3)] transition-colors">Save Tags</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {customer.tags.length === 0 ? <p className="text-gray-500 italic text-sm">No tags assigned.</p> : customer.tags.map((tag: any) => (
                                        <span key={tag.id} className="px-3 py-1 rounded-full text-xs font-bold border" style={{ borderColor: tag.color, color: tag.color, backgroundColor: `${tag.color}15` }}>
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Middle Column: Analytics & Notes */}
                    <div className="lg:col-span-2 space-y-6 print:w-full">
                        {/* Highlights Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-[#721C97]/20 to-[#070308] border border-[#721C97]/50 rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center">
                                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Last Contact</span>
                                <h4 className="text-xl font-black text-white mt-1">{customer.last_contact_date || '-'}</h4>
                            </div>
                            <div className="bg-gradient-to-br from-[#C1FF72]/10 to-[#070308] border border-[#C1FF72]/30 rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center relative group">
                                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Follow Up</span>
                                {isEditingFollowUp ? (
                                    <input
                                        type="date"
                                        autoFocus
                                        className="mt-1 bg-[#070308] border border-[#C1FF72] rounded px-2 py-1 text-[#C1FF72] text-xs outline-none shadow-[0_0_10px_rgba(193,255,114,0.3)]"
                                        defaultValue={customer.next_followup_date || ''}
                                        onChange={(e) => handleQuickFollowUpChange(e.target.value)}
                                        onBlur={() => setIsEditingFollowUp(false)}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 mt-1">
                                        <h4 className="text-xl font-black text-[#C1FF72]">{customer.next_followup_date || '-'}</h4>
                                        <button onClick={() => setIsEditingFollowUp(true)} className="text-[#C1FF72]/50 hover:text-[#C1FF72] transition-colors opacity-0 group-hover:opacity-100" title="Quick Reschedule">
                                            <FiCalendar className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="bg-gradient-to-br from-blue-900/20 to-[#070308] border border-blue-500/30 rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center">
                                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Attachments</span>
                                <h4 className="text-2xl font-black text-white mt-1">{customer.attachments?.length || 0}</h4>
                            </div>
                            <div className="bg-gradient-to-br from-pink-900/20 to-[#070308] border border-pink-500/30 rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center">
                                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Health Score</span>
                                <h4 className="text-2xl font-black text-pink-400 mt-1">A+</h4>
                            </div>
                        </div>

                        {/* CRM Analytics Chart */}
                        <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-6 shadow-[0_8px_32px_rgba(114,28,151,0.1)] pdf-fix print:hidden">
                            <h3 className="text-xl font-bold text-white mb-6 border-b border-[#721C97]/30 pb-2 flex justify-between items-center">
                                <span>Interaction Analytics (6 Months)</span>
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={interactionActivity} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2a1a3a" />
                                        <XAxis dataKey="month" stroke="#888" tick={{ fill: '#aaa' }} />
                                        <YAxis stroke="#888" tick={{ fill: '#aaa' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#070308', borderColor: '#721C97', color: '#fff', borderRadius: '8px' }} />
                                        <Legend wrapperStyle={{ color: '#fff' }} />
                                        <Line type="monotone" dataKey="interactions" stroke="#C1FF72" strokeWidth={3} activeDot={{ r: 8, fill: '#721C97', stroke: '#C1FF72' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Attachments Section */}
                        <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-6 shadow-[0_8px_32px_rgba(114,28,151,0.1)] relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C1FF72]/5 blur-[80px] pointer-events-none rounded-full"></div>

                            <div className="flex justify-between items-center mb-6 border-b border-[#721C97]/30 pb-2 relative z-10">
                                <h3 className="text-xl font-bold text-white">Files & Documents</h3>
                                <span className="text-gray-400 text-sm">{customer.attachments?.length || 0} / 20 Limit</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                {/* Upload Box */}
                                <div className="print:hidden">
                                    <div className="relative border-2 border-dashed border-[#721C97]/50 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#C1FF72] hover:bg-[#C1FF72]/5 transition-all group">
                                        <FiUploadCloud className="w-10 h-10 text-gray-500 group-hover:text-[#C1FF72] mb-3 transition-colors" />
                                        <p className="text-sm text-gray-300 font-medium mb-1">Click or drag file to this area</p>
                                        <p className="text-xs text-gray-500">Max size 5MB. PDF, JPG, PNG, DOCX</p>
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleFileUpload}
                                            disabled={isUploading || customer.attachments?.length >= 20}
                                        />
                                        {isUploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl backdrop-blur-sm"><span className="text-[#C1FF72] font-bold">Uploading...</span></div>}
                                    </div>
                                </div>

                                {/* File List */}
                                <div className="bg-white/5 rounded-xl p-4 max-h-[200px] overflow-y-auto space-y-2">
                                    {customer.attachments && customer.attachments.length > 0 ? (
                                        customer.attachments.map((file: any) => (
                                            <div key={file.id} className="flex items-center justify-between p-3 bg-[#070308] border border-[#721C97]/30 rounded-lg group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-[#721C97]/20 text-[#C1FF72] rounded-lg">
                                                        <FiFileText />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <a href={file.file} target="_blank" rel="noreferrer" className="text-sm font-medium text-white hover:text-[#C1FF72] hover:underline truncate" title={file.file.split('/').pop()}>
                                                            {file.file.split('/').pop()}
                                                        </a>
                                                        <span className="text-[10px] text-gray-500">{new Date(file.uploaded_at).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteAttachment(file.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-sm text-gray-500 italic">No files attached yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-6 shadow-[0_8px_32px_rgba(114,28,151,0.1)] group">
                            <div className="flex justify-between items-center mb-4 border-b border-[#721C97]/30 pb-2">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    Internal Notes
                                    {!isEditing && !isEditingNotes && (
                                        <button onClick={() => { setIsEditingNotes(true); setEditFormData((prev: any) => ({ ...prev, notes: customer.notes })); }} className="text-gray-500 hover:text-[#C1FF72] opacity-0 group-hover:opacity-100 transition-opacity" title="Quick Edit Notes">
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </h3>
                                {isEditingNotes && !isEditing && (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditingNotes(false)} className="px-3 py-1 rounded bg-[#721C97]/20 hover:bg-[#721C97]/40 text-white font-bold text-xs transition-colors">Cancel</button>
                                        <button onClick={handleQuickNotesSave} className="px-3 py-1 rounded bg-[#C1FF72] text-[#070308] hover:bg-[#aef556] font-bold text-xs shadow-[0_0_10px_rgba(193,255,114,0.3)] transition-colors">Save</button>
                                    </div>
                                )}
                            </div>
                            {(isEditing || isEditingNotes) ? (
                                <textarea
                                    className="w-full h-32 bg-[#070308]/80 border border-[#721C97]/50 rounded-xl p-4 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-colors resize-none custom-scrollbar"
                                    value={editFormData.notes || ''}
                                    onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                                    placeholder="Add background context, important notes, etc..."
                                />
                            ) : (
                                <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed min-h-[100px] bg-white/5 p-4 rounded-xl border border-white/5 h-32 overflow-y-auto custom-scrollbar cursor-pointer" onClick={() => { setIsEditingNotes(true); setEditFormData((prev: any) => ({ ...prev, notes: customer.notes })); }}>
                                    {customer.notes ? customer.notes : <span className="text-gray-600 italic">No notes provided. Click to add.</span>}
                                </div>
                            )}
                        </div>

                        {/* Active Projects Selection */}
                        <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-6 shadow-[0_8px_32px_rgba(114,28,151,0.1)] group print:hidden">
                            <div className="flex justify-between items-center mb-6 border-b border-[#721C97]/30 pb-2">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FiBriefcase className="text-blue-400" /> Client Projects
                                </h3>
                                <Link href="/dashboard/projects/new" className="text-xs font-bold text-[#C1FF72] flex items-center gap-1 hover:underline bg-[#C1FF72]/10 px-2 py-1 rounded">
                                    <FiPlusCircle /> New Project
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {customer.projects && customer.projects.length > 0 ? (
                                    customer.projects.map((project: any) => (
                                        <Link href={`/dashboard/projects/${project.id}`} key={project.id} className="block group/card">
                                            <div className="bg-[#110915] border border-white/5 group-hover/card:border-blue-400/50 p-4 rounded-xl transition-all h-full flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-white font-bold text-base line-clamp-1 group-hover/card:text-blue-400 transition-colors">{project.name}</h4>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded tracking-wider ${project.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                                                        project.status === 'Active' ? 'bg-blue-500/10 text-blue-400' :
                                                            'bg-gray-500/10 text-gray-400'
                                                        }`}>
                                                        {project.status}
                                                    </span>
                                                </div>

                                                <div className="mt-auto pt-4">
                                                    <div className="flex justify-between text-xs mb-1.5">
                                                        <span className="text-gray-400">Completion</span>
                                                        <span className={project.progress === 100 ? "text-green-400 font-bold" : "text-blue-400 font-bold"}>
                                                            {project.progress}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${project.progress === 100 ? 'bg-green-400' : 'bg-blue-400'}`}
                                                            style={{ width: `${project.progress}%` }}
                                                        />
                                                    </div>
                                                    {project.deadline && (
                                                        <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                                                            <FiCalendar /> Deadline: <span className="text-gray-300">{new Date(project.deadline).toLocaleDateString()}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="col-span-full py-8 text-center text-gray-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                        <div className="flex justify-center mb-2">
                                            <FiBriefcase className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-sm">No active projects linked to this client yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
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

            <RecordInteractionModal
                isOpen={isInteractionModalOpen}
                onClose={() => setIsInteractionModalOpen(false)}
                customerId={id}
                onSaved={fetchCustomer}
            />
        </div>
    );
}
