'use client';

import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import api from '@/lib/api';

interface CreatePlanModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreatePlanModal({ onClose, onSuccess }: CreatePlanModalProps) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        description: '',
        plan_type: 'Annual',
        category: 'General',
        status: 'Planning',
        start_date: '',
        end_date: '',
    });

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/planning/plans/', form);
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to create plan.');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#0c0810] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Create New Plan</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Plan Name *</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#721C97] transition-colors"
                            placeholder="e.g. Q2 2026 Marketing Campaign"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#721C97] transition-colors resize-none"
                            placeholder="Brief description of the plan..."
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Plan Type</label>
                            <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#721C97]" value={form.plan_type} onChange={e => set('plan_type', e.target.value)}>
                                <option value="Annual">Annual</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="ProductLaunch">Product Launch</option>
                                <option value="MarketExpansion">Market Expansion</option>
                                <option value="Custom">Custom</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                            <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#721C97]" value={form.category} onChange={e => set('category', e.target.value)}>
                                <option value="Marketing">Marketing</option>
                                <option value="Product">Product/Service</option>
                                <option value="MarketExpansion">Market Expansion</option>
                                <option value="Risk">Risk Management</option>
                                <option value="Resource">Resource Planning</option>
                                <option value="General">General</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                            <input type="date" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#721C97]" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                            <input type="date" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#721C97]" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-7 py-2.5 bg-gradient-to-r from-[#721C97] to-[#C1FF72] text-[#070308] font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
