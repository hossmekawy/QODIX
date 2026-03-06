'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FiEdit2, FiTrash2, FiPlus, FiCopy, FiMessageSquare } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';

export default function PromptsTab() {
    const [prompts, setPrompts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        title: '', content: '', category: '', notes: ''
    });

    const toast = useToast();

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = () => {
        setIsLoading(true);
        api.get('/infrastructure/prompts/')
            .then(res => setPrompts(res.data))
            .catch(err => toast.error('Failed to load Prompts'))
            .finally(() => setIsLoading(false));
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success('Prompt copied to clipboard');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentId) {
                await api.patch(`/infrastructure/prompts/${currentId}/`, formData);
                toast.success('Prompt updated successfully');
            } else {
                await api.post('/infrastructure/prompts/', formData);
                toast.success('Prompt saved');
            }
            setIsModalOpen(false);
            fetchPrompts();
        } catch (error) {
            toast.error('Failed to save Prompt');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this AI Prompt?')) return;
        try {
            await api.delete(`/infrastructure/prompts/${id}/`);
            toast.success('Prompt deleted');
            fetchPrompts();
        } catch (error) {
            toast.error('Failed to delete Prompt');
        }
    };

    const openEditModal = (promptEntry: any) => {
        setFormData({
            title: promptEntry.title,
            content: promptEntry.content,
            category: promptEntry.category || '',
            notes: promptEntry.notes || ''
        });
        setCurrentId(promptEntry.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setFormData({ title: '', content: '', category: '', notes: '' });
        setIsEditing(false);
        setCurrentId(null);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-[#070308] border border-pink-500/30 rounded-2xl p-6 shadow-lg animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">AI Prompts Library</h2>
                <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 text-pink-400 rounded-xl hover:bg-pink-500/40 transition-colors border border-pink-500/50 font-bold">
                    <FiPlus /> New Prompt
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading prompts...</div>
            ) : prompts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-pink-500/30 rounded-2xl bg-white/5">
                    <FiMessageSquare className="w-12 h-12 text-pink-500/50 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-300">No Prompts Saved</h3>
                    <p className="text-gray-500 mt-2">Store your reusable AI prompts here for quick access.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prompts.map(prompt => (
                        <div key={prompt.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-pink-500/30 transition-all flex flex-col hover:shadow-[0_0_20px_rgba(236,72,153,0.1)] group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-white text-lg leading-tight">{prompt.title}</h3>
                                    {prompt.category && (
                                        <span className="inline-block px-2 py-0.5 bg-pink-500/10 text-pink-400 text-xs rounded-full mt-1.5 border border-pink-500/20">
                                            {prompt.category}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(prompt)} className="p-1.5 text-gray-400 hover:text-white rounded bg-white/5 hover:bg-white/10"><FiEdit2 size={14} /></button>
                                    <button onClick={() => handleDelete(prompt.id)} className="p-1.5 text-red-500/70 hover:text-red-400 rounded bg-red-900/10 hover:bg-red-900/30"><FiTrash2 size={14} /></button>
                                </div>
                            </div>

                            <div className="bg-[#070308] border border-white/5 rounded-xl p-3 mb-4 flex-1 relative group/copy">
                                <p className="text-sm text-gray-300 font-mono whitespace-pre-wrap line-clamp-5">
                                    {prompt.content}
                                </p>
                                <button
                                    onClick={() => copyToClipboard(prompt.content)}
                                    className="absolute inset-0 bg-[#070308]/80 backdrop-blur-[2px] rounded-xl flex items-center justify-center opacity-0 group-hover/copy:opacity-100 transition-opacity text-pink-400 font-bold gap-2"
                                >
                                    <FiCopy /> Copy Prompt
                                </button>
                            </div>

                            {prompt.notes && (
                                <p className="text-xs text-gray-500 italic mt-auto border-t border-white/5 pt-3">
                                    {prompt.notes}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#070308] border border-pink-500/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[0_0_40px_rgba(236,72,153,0.2)]">
                        <div className="p-6 border-b border-pink-500/20 flex justify-between items-center sticky top-0 bg-[#070308] z-10">
                            <h2 className="text-2xl font-bold text-white tracking-tight">{isEditing ? 'Edit Prompt' : 'Create New Prompt'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-pink-400 uppercase tracking-widest mb-1">Prompt Title*</label>
                                    <input required type="text" className="w-full bg-[#070308] border border-pink-500/30 rounded-lg px-3 py-2 text-white outline-none focus:border-pink-500 transition-colors" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Code Review Assistant" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Category</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-pink-500 transition-colors" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Development" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-pink-400 uppercase tracking-widest mb-1">Prompt Content*</label>
                                <textarea required rows={8} className="w-full bg-[#070308] border border-pink-500/30 rounded-lg px-3 py-3 text-white outline-none focus:border-pink-500 transition-colors font-mono text-sm custom-scrollbar" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="You are an expert software engineer..."></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Notes & Context</label>
                                <textarea rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-pink-500 transition-colors text-sm custom-scrollbar" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="When to use this prompt, variables to replace, etc..."></textarea>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-pink-500/20 mt-6 sticky bottom-0 bg-[#070308] py-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-400 transition-colors shadow-[0_0_15px_rgba(236,72,153,0.3)]">{isEditing ? 'Save Changes' : 'Save Prompt'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
