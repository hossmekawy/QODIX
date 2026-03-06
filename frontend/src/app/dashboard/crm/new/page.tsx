'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { FiSave, FiX, FiTag, FiSettings } from 'react-icons/fi';
import Link from 'next/link';
import TagManagerModal from '@/components/crm/TagManagerModal';
import { useToast } from '@/contexts/ToastContext';

interface Tag {
    id: number;
    name: string;
    color: string;
}

export default function NewCustomerPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);

    const handleTagAdded = (newTag: Tag) => {
        setAvailableTags(prev => [...prev, newTag]);
        setFormData(prev => ({ ...prev, tag_ids: [...prev.tag_ids, newTag.id] }));
    };

    const [formData, setFormData] = useState({
        name: '',
        company_name: '',
        industry: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        last_contact_date: '',
        next_followup_date: '',
        notes: '',
        tag_ids: [] as number[],
    });

    useEffect(() => {
        api.get('/crm/tags/')
            .then(res => setAvailableTags(res.data))
            .catch(err => console.error("Failed to load tags", err));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTagToggle = (tagId: number) => {
        setFormData(prev => {
            if (prev.tag_ids.includes(tagId)) {
                return { ...prev, tag_ids: prev.tag_ids.filter(id => id !== tagId) };
            } else {
                return { ...prev, tag_ids: [...prev.tag_ids, tagId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const dataToSubmit = { ...formData };
            // Clean up empty strings for optional dates so Django doesn't complain about invalid format
            if (!dataToSubmit.last_contact_date) delete (dataToSubmit as any).last_contact_date;
            if (!dataToSubmit.next_followup_date) delete (dataToSubmit as any).next_followup_date;

            await api.post('/crm/customers/', dataToSubmit);
            toast.success('Customer created successfully!');
            router.push('/dashboard/crm');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to create customer. Please check the fields.');
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#721C97]/30">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#C1FF72] tracking-tight">
                        Register New Customer
                    </h1>
                    <p className="text-gray-400 mt-1">Add a new client to your CRM database</p>
                </div>
                <Link href="/dashboard/crm" className="px-4 py-2 text-gray-400 hover:text-white flex items-center gap-2 font-bold transition-colors hover:bg-white/5 rounded-xl">
                    <FiX /> Cancel
                </Link>
            </div>

            <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-8 relative overflow-hidden shadow-[0_8px_32px_rgba(114,28,151,0.15)]">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C1FF72]/10 blur-[80px] pointer-events-none"></div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-[#C1FF72] flex items-center gap-2 border-b border-[#C1FF72]/20 pb-2">
                                Basic Information
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Customer Name *</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-3 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Company Name</label>
                                <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-3 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Industry *</label>
                                <input required type="text" name="industry" value={formData.industry} onChange={handleChange} className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-3 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none" placeholder="e.g. Technology, Healthcare..." />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-[#C1FF72] flex items-center gap-2 border-b border-[#C1FF72]/20 pb-2">
                                Contact Details
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Email Address</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-3 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Phone Number</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-3 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Website</label>
                                <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-3 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none" placeholder="https://" />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-6 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#721C97]/20">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Last Contact Date</label>
                                <input type="date" name="last_contact_date" value={formData.last_contact_date} onChange={handleChange} className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-3 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none [color-scheme:dark]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Next Follow-up Date</label>
                                <input type="date" name="next_followup_date" value={formData.next_followup_date} onChange={handleChange} className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-3 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none [color-scheme:dark]" />
                            </div>
                        </div>

                        {/* Extended Info */}
                        <div className="space-y-6 md:col-span-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Physical Address</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-3 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Internal Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-3 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none resize-none" placeholder="Add any initial observation notes..." />
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-4 md:col-span-2 pt-4 border-t border-[#721C97]/20">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <FiTag /> Select Tags
                                </label>
                                <button type="button" onClick={() => setIsTagModalOpen(true)} className="text-xs flex items-center gap-1 font-bold text-[#C1FF72] hover:underline bg-[#C1FF72]/10 px-2 py-1 rounded">
                                    <FiSettings /> Manage Tags
                                </button>
                            </div>
                            {availableTags.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No tags available. Try creating some from the Tags manager later.</p>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {availableTags.map(tag => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => handleTagToggle(tag.id)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-all ${formData.tag_ids.includes(tag.id) ? 'scale-105 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                            style={{
                                                borderColor: tag.color,
                                                color: formData.tag_ids.includes(tag.id) ? '#000' : tag.color,
                                                backgroundColor: formData.tag_ids.includes(tag.id) ? tag.color : 'transparent'
                                            }}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-8 py-4 bg-[#C1FF72] text-[#070308] font-black text-lg rounded-xl hover:bg-[#aef556] transition-all shadow-[0_0_20px_rgba(193,255,114,0.3)] disabled:opacity-50"
                        >
                            {isLoading ? 'Creating...' : <><FiSave /> Save Customer</>}
                        </button>
                    </div>
                </form>
            </div>
            <TagManagerModal
                isOpen={isTagModalOpen}
                onClose={() => {
                    setIsTagModalOpen(false);
                    // Refresh tags in case they deleted some
                    api.get('/crm/tags/').then(res => setAvailableTags(res.data)).catch(() => { });
                }}
                onTagAdded={handleTagAdded}
            />
        </div >
    );
}
