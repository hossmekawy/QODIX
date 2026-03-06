'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiTarget, FiCalendar, FiUser, FiMoreVertical, FiSearch, FiTrendingUp, FiShield, FiUsers, FiBox } from 'react-icons/fi';
import api from '@/lib/api';
import CreatePlanModal from '@/components/planning/CreatePlanModal';

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
    Marketing: { label: 'Marketing', icon: FiTrendingUp, color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
    Product: { label: 'Product/Service', icon: FiBox, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    MarketExpansion: { label: 'Market Expansion', icon: FiTarget, color: 'text-[#C1FF72] bg-[#C1FF72]/10 border-[#C1FF72]/20' },
    Risk: { label: 'Risk Management', icon: FiShield, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
    Resource: { label: 'Resource Planning', icon: FiUsers, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
    General: { label: 'General', icon: FiTarget, color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
    Planning: { label: 'Planning', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
    InProgress: { label: 'In Progress', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    Completed: { label: 'Completed', color: 'text-[#C1FF72] bg-[#C1FF72]/10 border-[#C1FF72]/20' },
    OnHold: { label: 'On Hold', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
};

export default function PlanningPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    useEffect(() => { fetchPlans(); }, [search, filterStatus, filterCategory]);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (search) params.search = search;
            if (filterStatus) params.status = filterStatus;
            if (filterCategory) params.category = filterCategory;
            const res = await api.get('/planning/plans/', { params });
            setPlans(res.data.results || res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const stats = {
        total: plans.length,
        inProgress: plans.filter(p => p.status === 'InProgress').length,
        completed: plans.filter(p => p.status === 'Completed').length,
        planning: plans.filter(p => p.status === 'Planning').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Strategic Planning</h1>
                    <p className="text-gray-400 mt-1">Manage your marketing plans, goals, and strategic roadmaps.</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-[#C1FF72] text-[#070308] px-6 py-3 rounded-xl hover:bg-[#aee661] font-bold shadow-[0_0_20px_rgba(193,255,114,0.25)] transition-all"
                >
                    <FiPlus className="w-5 h-5" /> New Plan
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Plans', value: stats.total, color: 'from-[#721C97]/30 to-transparent' },
                    { label: 'In Progress', value: stats.inProgress, color: 'from-blue-500/20 to-transparent' },
                    { label: 'Completed', value: stats.completed, color: 'from-[#C1FF72]/20 to-transparent' },
                    { label: 'Planning', value: stats.planning, color: 'from-yellow-500/20 to-transparent' },
                ].map(stat => (
                    <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border border-white/10 rounded-2xl p-5 backdrop-blur-sm`}>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{stat.label}</p>
                        <p className="text-4xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search plans..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#721C97]"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-gray-300 text-sm focus:outline-none focus:border-[#721C97]"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="Planning">Planning</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="OnHold">On Hold</option>
                </select>
                <select
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-gray-300 text-sm focus:outline-none focus:border-[#721C97]"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Product">Product/Service</option>
                    <option value="MarketExpansion">Market Expansion</option>
                    <option value="Risk">Risk Management</option>
                    <option value="Resource">Resource Planning</option>
                </select>
            </div>

            {/* Plans Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse h-48" />
                    ))}
                </div>
            ) : plans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#721C97]/20 border border-[#721C97]/30 flex items-center justify-center mb-4">
                        <FiTarget className="w-8 h-8 text-[#C1FF72]" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No plans yet</h3>
                    <p className="text-gray-400 max-w-sm mb-6">Create your first strategic plan — marketing campaigns, annual goals, product roadmaps and more.</p>
                    <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-[#C1FF72] text-[#070308] px-6 py-2.5 rounded-xl font-bold">
                        <FiPlus /> Create First Plan
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {plans.map(plan => {
                        const catMeta = CATEGORY_META[plan.category] || CATEGORY_META['General'];
                        const statMeta = STATUS_META[plan.status] || STATUS_META['Planning'];
                        const CatIcon = catMeta.icon;
                        return (
                            <Link
                                key={plan.id}
                                href={`/dashboard/planning/${plan.id}`}
                                className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#721C97]/50 hover:bg-white/8 transition-all overflow-hidden relative cursor-pointer"
                            >
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#721C97] to-[#C1FF72] opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-start justify-between mb-4">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${catMeta.color}`}>
                                        <CatIcon className="w-3.5 h-3.5" />
                                        {catMeta.label}
                                    </div>
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statMeta.color}`}>
                                        {statMeta.label}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#C1FF72] transition-colors">{plan.name}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-5">{plan.description || 'No description.'}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <FiCalendar className="w-3.5 h-3.5" />
                                        {plan.start_date ? new Date(plan.start_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'No date'}
                                        {plan.end_date ? ` → ${new Date(plan.end_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : ''}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <FiUser className="w-3.5 h-3.5" />
                                        {plan.owner_name || 'Unassigned'}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {isCreateOpen && (
                <CreatePlanModal
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={() => { setIsCreateOpen(false); fetchPlans(); }}
                />
            )}
        </div>
    );
}
