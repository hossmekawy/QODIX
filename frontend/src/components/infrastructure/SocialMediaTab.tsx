'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FiEye, FiEyeOff, FiEdit2, FiTrash2, FiPlus, FiShare2, FiExternalLink } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';

export default function SocialMediaTab() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [revealedPasswords, setRevealedPasswords] = useState<{ [key: number]: string }>({});

    // Form Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        platform: '', username: '', email: '', password: '',
        login_url: '', recovery_email: '', recovery_phone: '', security_questions: ''
    });

    const toast = useToast();

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = () => {
        setIsLoading(true);
        api.get('/infrastructure/social-accounts/')
            .then(res => setAccounts(res.data))
            .catch(err => toast.error('Failed to load social accounts'))
            .finally(() => setIsLoading(false));
    };

    const handleRevealPassword = async (id: number) => {
        if (revealedPasswords[id]) {
            // Hide it
            const newRevealed = { ...revealedPasswords };
            delete newRevealed[id];
            setRevealedPasswords(newRevealed);
            return;
        }

        try {
            // Actually call the log endpoint, which also returns the account or we just log it and fetch the password from the existing state
            // But realistically, the password might not be sent in list view. Assuming it is for this MVP.
            await api.post(`/infrastructure/social-accounts/${id}/access_log/`);
            const account = accounts.find(a => a.id === id);
            setRevealedPasswords(prev => ({ ...prev, [id]: account.password }));
            toast.info('Access logged.');
        } catch (error) {
            toast.error('Failed to reveal password.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentId) {
                await api.patch(`/infrastructure/social-accounts/${currentId}/`, formData);
                toast.success('Account updated successfully');
            } else {
                await api.post('/infrastructure/social-accounts/', formData);
                toast.success('Account created successfully');
            }
            setIsModalOpen(false);
            fetchAccounts();
        } catch (error) {
            toast.error('Failed to save account');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this credentials record?')) return;
        try {
            await api.delete(`/infrastructure/social-accounts/${id}/`);
            toast.success('Account deleted');
            fetchAccounts();
        } catch (error) {
            toast.error('Failed to delete account');
        }
    };

    const openEditModal = (account: any) => {
        setFormData({
            platform: account.platform, username: account.username,
            email: account.email || '', password: '', // require re-entry or keep blank to not update
            login_url: account.login_url || '', recovery_email: account.recovery_email || '',
            recovery_phone: account.recovery_phone || '', security_questions: account.security_questions || ''
        });
        setCurrentId(account.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setFormData({ platform: '', username: '', email: '', password: '', login_url: '', recovery_email: '', recovery_phone: '', security_questions: '' });
        setIsEditing(false);
        setCurrentId(null);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-6 shadow-lg animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Social Media Credentials</h2>
                <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-[#721C97]/20 text-white rounded-xl hover:bg-[#721C97]/40 transition-colors border border-[#721C97]/50 font-bold">
                    <FiPlus /> Add Account
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs uppercase bg-[#721C97]/10 text-gray-300 border-b border-[#721C97]/30">
                        <tr>
                            <th className="px-4 py-3 font-bold">Platform / URL</th>
                            <th className="px-4 py-3 font-bold">Username / Email</th>
                            <th className="px-4 py-3 font-bold">Password</th>
                            <th className="px-4 py-3 font-bold">Last Changed</th>
                            <th className="px-4 py-3 font-bold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                        ) : accounts.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 italic text-gray-500">No social accounts stored.</td></tr>
                        ) : (
                            accounts.map(acc => (
                                <tr key={acc.id} className="border-b border-[#721C97]/10 hover:bg-[#721C97]/5">
                                    <td className="px-4 py-4">
                                        <div className="font-bold text-white text-base">{acc.platform}</div>
                                        {acc.login_url && <a href={acc.login_url} target="_blank" rel="noreferrer" className="text-xs text-[#C1FF72] hover:underline flex items-center gap-1"><FiExternalLink /> Login URL</a>}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-white">{acc.username}</div>
                                        {acc.email && <div className="text-xs text-gray-500">{acc.email}</div>}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono bg-white/5 px-2 py-1 rounded">
                                                {revealedPasswords[acc.id] ? revealedPasswords[acc.id] : '••••••••••••'}
                                            </span>
                                            <button onClick={() => handleRevealPassword(acc.id)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded transition-colors" title="Reveal & Log Access">
                                                {revealedPasswords[acc.id] ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-xs">
                                        {acc.last_password_change ? new Date(acc.last_password_change).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => openEditModal(acc)} className="p-2 text-gray-400 hover:text-white rounded hover:bg-white/10" title="Edit"><FiEdit2 /></button>
                                            <button onClick={() => handleDelete(acc.id)} className="p-2 text-red-400 hover:text-red-300 rounded hover:bg-red-900/20" title="Delete"><FiTrash2 /></button>
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
                    <div className="bg-[#070308] border border-[#721C97]/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[0_0_40px_rgba(114,28,151,0.3)]">
                        <div className="p-6 border-b border-[#721C97]/30 flex justify-between items-center sticky top-0 bg-[#070308] z-10">
                            <h2 className="text-2xl font-bold text-white tracking-tight">{isEditing ? 'Edit Credentials' : 'Add New Credentials'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-1">Platform Name*</label><input required type="text" className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72] transition-colors" value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })} placeholder="e.g. Facebook, X, Instagram" /></div>
                                <div><label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-1">Login URL</label><input type="url" className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72] transition-colors" value={formData.login_url} onChange={e => setFormData({ ...formData, login_url: e.target.value })} placeholder="https://" /></div>
                                <div><label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-1">Username*</label><input required type="text" className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72] transition-colors" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} /></div>
                                <div><label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-1">Registered Email</label><input type="email" className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72] transition-colors" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                                <div className="md:col-span-2"><label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-1">{isEditing ? 'New Password (leave blank to keep current)' : 'Password*'}</label><input required={!isEditing} type="text" className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72] transition-colors font-mono" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-[#721C97]/30">
                                <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Recovery & Security Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Recovery Email</label><input type="email" className="w-full bg-white/5 border border-[#721C97]/30 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72] transition-colors" value={formData.recovery_email} onChange={e => setFormData({ ...formData, recovery_email: e.target.value })} /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Recovery Phone</label><input type="text" className="w-full bg-white/5 border border-[#721C97]/30 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72] transition-colors" value={formData.recovery_phone} onChange={e => setFormData({ ...formData, recovery_phone: e.target.value })} /></div>
                                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Security Questions/Answers</label><textarea rows={3} className="w-full bg-white/5 border border-[#721C97]/30 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72] transition-colors custom-scrollbar" value={formData.security_questions} onChange={e => setFormData({ ...formData, security_questions: e.target.value })} placeholder="e.g. Q: First pet? A: Max" /></div>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-[#721C97]/30 mt-6 sticky bottom-0 bg-[#070308] py-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-[#721C97]/50 text-white font-bold hover:bg-[#721C97]/20 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#C1FF72] text-[#070308] font-bold hover:bg-[#aef556] transition-colors shadow-[0_0_15px_rgba(193,255,114,0.3)]">{isEditing ? 'Save Changes' : 'Create Account'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
