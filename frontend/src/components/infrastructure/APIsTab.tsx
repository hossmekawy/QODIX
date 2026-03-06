'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FiEye, FiEyeOff, FiEdit2, FiTrash2, FiPlus, FiCopy, FiExternalLink } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';

export default function APIsTab() {
    const [apikeys, setApiKeys] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [revealedKeys, setRevealedKeys] = useState<{ [key: string]: string }>({});

    // Form Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        provider_name: '', api_key: '', secret_key: '', endpoint_url: '', notes: ''
    });

    const toast = useToast();

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = () => {
        setIsLoading(true);
        api.get('/infrastructure/api-keys/')
            .then(res => setApiKeys(res.data))
            .catch(err => toast.error('Failed to load API keys'))
            .finally(() => setIsLoading(false));
    };

    const handleReveal = (id: number, type: 'api' | 'secret') => {
        const keyMapId = `${id}-${type}`;
        if (revealedKeys[keyMapId]) {
            const newRevealed = { ...revealedKeys };
            delete newRevealed[keyMapId];
            setRevealedKeys(newRevealed);
            return;
        }

        const account = apikeys.find(a => a.id === id);
        if (account) {
            setRevealedKeys(prev => ({ ...prev, [keyMapId]: type === 'api' ? account.api_key : account.secret_key }));
        }
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentId) {
                await api.patch(`/infrastructure/api-keys/${currentId}/`, formData);
                toast.success('API Key updated successfully');
            } else {
                await api.post('/infrastructure/api-keys/', formData);
                toast.success('API Key securely stored');
            }
            setIsModalOpen(false);
            fetchKeys();
        } catch (error) {
            toast.error('Failed to save API Key');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this API Key?')) return;
        try {
            await api.delete(`/infrastructure/api-keys/${id}/`);
            toast.success('API Key deleted completely');
            fetchKeys();
        } catch (error) {
            toast.error('Failed to delete API Key');
        }
    };

    const openEditModal = (keyEntry: any) => {
        setFormData({
            provider_name: keyEntry.provider_name,
            api_key: keyEntry.api_key,
            secret_key: keyEntry.secret_key || '',
            endpoint_url: keyEntry.endpoint_url || '',
            notes: keyEntry.notes || ''
        });
        setCurrentId(keyEntry.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setFormData({ provider_name: '', api_key: '', secret_key: '', endpoint_url: '', notes: '' });
        setIsEditing(false);
        setCurrentId(null);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-[#070308] border border-amber-500/30 rounded-2xl p-6 shadow-lg animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Third-Party API Credentials</h2>
                <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-500 rounded-xl hover:bg-amber-500/40 transition-colors border border-amber-500/50 font-bold">
                    <FiPlus /> Add API Key
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs uppercase bg-amber-500/10 text-gray-300 border-b border-amber-500/30">
                        <tr>
                            <th className="px-4 py-3 font-bold">Provider / Endpoint</th>
                            <th className="px-4 py-3 font-bold">API Key</th>
                            <th className="px-4 py-3 font-bold">Secret Key</th>
                            <th className="px-4 py-3 font-bold">Notes</th>
                            <th className="px-4 py-3 font-bold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-8">Loading vaults...</td></tr>
                        ) : apikeys.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 italic text-gray-500">No API keys securely stored yet.</td></tr>
                        ) : (
                            apikeys.map(acc => (
                                <tr key={acc.id} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                                    <td className="px-4 py-4">
                                        <div className="font-bold text-white text-base">{acc.provider_name}</div>
                                        {acc.endpoint_url && <a href={acc.endpoint_url} target="_blank" rel="noreferrer" className="text-xs text-amber-400 hover:underline flex items-center gap-1 mt-0.5"><FiExternalLink /> API Endpoint</a>}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono bg-white/5 px-2 py-1 rounded text-xs w-48 truncate">
                                                {revealedKeys[`${acc.id}-api`] ? revealedKeys[`${acc.id}-api`] : '••••••••••••••••••••••••••••'}
                                            </span>
                                            <button onClick={() => handleReveal(acc.id, 'api')} className="p-1.5 text-gray-400 hover:text-amber-400 bg-white/5 rounded transition-colors">
                                                {revealedKeys[`${acc.id}-api`] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                                            </button>
                                            <button onClick={() => copyToClipboard(acc.api_key)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded transition-colors" title="Copy Key">
                                                <FiCopy size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {acc.secret_key ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono bg-white/5 px-2 py-1 rounded text-xs w-24 truncate">
                                                    {revealedKeys[`${acc.id}-secret`] ? revealedKeys[`${acc.id}-secret`] : '••••••••••••••••'}
                                                </span>
                                                <button onClick={() => handleReveal(acc.id, 'secret')} className="p-1.5 text-gray-400 hover:text-amber-400 bg-white/5 rounded transition-colors">
                                                    {revealedKeys[`${acc.id}-secret`] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                                                </button>
                                                <button onClick={() => copyToClipboard(acc.secret_key)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded transition-colors" title="Copy Secret">
                                                    <FiCopy size={14} />
                                                </button>
                                            </div>
                                        ) : <span className="text-xs text-gray-500 italic">None</span>}
                                    </td>
                                    <td className="px-4 py-4 text-xs max-w-[150px] truncate text-gray-500" title={acc.notes}>
                                        {acc.notes || '-'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => openEditModal(acc)} className="p-2 text-gray-400 hover:text-white rounded hover:bg-white/10" title="Edit"><FiEdit2 size={16} /></button>
                                            <button onClick={() => handleDelete(acc.id)} className="p-2 text-red-500/70 hover:text-red-400 rounded hover:bg-red-900/20" title="Delete"><FiTrash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#070308] border border-amber-500/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                        <div className="p-6 border-b border-amber-500/20 flex justify-between items-center sticky top-0 bg-[#070308] z-10">
                            <h2 className="text-2xl font-bold text-white tracking-tight">{isEditing ? 'Edit API Key' : 'Store New API Key'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Provider Name*</label>
                                <input required type="text" className="w-full bg-[#070308] border border-amber-500/30 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 transition-colors" value={formData.provider_name} onChange={e => setFormData({ ...formData, provider_name: e.target.value })} placeholder="e.g. OpenAI, Stripe, AWS" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">API Key*</label>
                                <input required type="password" placeholder="sk-..." className="w-full bg-[#070308] border border-amber-500/30 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 transition-colors font-mono" value={formData.api_key} onChange={e => setFormData({ ...formData, api_key: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Secret Key (Optional)</label>
                                    <input type="password" placeholder="Client Secret / Token" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 transition-colors font-mono" value={formData.secret_key} onChange={e => setFormData({ ...formData, secret_key: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Endpoint URL</label>
                                    <input type="url" placeholder="https://api.example.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 transition-colors" value={formData.endpoint_url} onChange={e => setFormData({ ...formData, endpoint_url: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Notes / Instructions</label>
                                <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 transition-colors custom-scrollbar" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Usage instructions, limits, associated email..."></textarea>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-amber-500/20 mt-6 sticky bottom-0 bg-[#070308] py-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl bg-amber-500 text-[#070308] font-bold hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]">{isEditing ? 'Save Details' : 'Secure API Key'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
