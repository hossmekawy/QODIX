'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    FiArrowLeft, FiCalendar, FiUser, FiTrash2, FiPlus,
    FiClock, FiTrendingUp, FiTarget, FiShield, FiUsers, FiBox, FiGrid,
    FiSave, FiX, FiAlertCircle, FiCheckCircle, FiZap, FiMapPin,
    FiUserPlus, FiMonitor, FiHome, FiDollarSign
} from 'react-icons/fi';
import api from '@/lib/api';

const PlanBoard = dynamic(() => import('@/components/planning/PlanBoard'), { ssr: false });

type TabKey = 'board' | 'marketing' | 'product' | 'market' | 'risk' | 'resource';

const TABS: { key: TabKey; label: string; icon: any; color: string }[] = [
    { key: 'board', label: 'Board', icon: FiGrid, color: 'text-purple-400' },
    { key: 'marketing', label: 'Marketing', icon: FiTrendingUp, color: 'text-pink-400' },
    { key: 'product', label: 'Product/Service', icon: FiBox, color: 'text-blue-400' },
    { key: 'market', label: 'Market Expansion', icon: FiTarget, color: 'text-[#C1FF72]' },
    { key: 'risk', label: 'Risk Management', icon: FiShield, color: 'text-red-400' },
    { key: 'resource', label: 'Resources', icon: FiUsers, color: 'text-yellow-400' },
];

const STATUS_COLORS: Record<string, string> = {
    Planning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    InProgress: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    Completed: 'text-[#C1FF72] bg-[#C1FF72]/10 border-[#C1FF72]/20',
    OnHold: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

const ITEM_STATUS_COLORS: Record<string, string> = {
    Pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    InProgress: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    Done: 'text-[#C1FF72] bg-[#C1FF72]/10 border-[#C1FF72]/20',
    Blocked: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const TAB_SECTIONS: Record<string, { primary: string; label: string; icon: any; description: string; placeholder: string }[]> = {
    marketing: [
        { primary: 'campaign', label: 'Campaigns', icon: FiZap, description: 'Plan and track your marketing campaigns', placeholder: 'e.g. Q2 Email Campaign' },
        { primary: 'content', label: 'Content Calendar', icon: FiCalendar, description: 'Blog posts, articles, videos', placeholder: 'e.g. Weekly blog post on AI trends' },
        { primary: 'social', label: 'Social Media', icon: FiTrendingUp, description: 'Posts, schedules, and platform targets', placeholder: 'e.g. LinkedIn 3x/week' },
        { primary: 'ad_budget', label: 'Advertising Budget', icon: FiDollarSign, description: 'Budget allocation per channel', placeholder: 'e.g. Google Ads – 5,000 EGP/mo' },
        { primary: 'lead_target', label: 'Lead Generation', icon: FiTarget, description: 'Lead acquisition goals and tactics', placeholder: 'e.g. 50 qualified leads/month' },
    ],
    product: [
        { primary: 'service', label: 'New Service Offerings', icon: FiBox, description: 'Services and products in the pipeline', placeholder: 'e.g. Mobile App Development Package' },
        { primary: 'feature', label: 'Feature Roadmap', icon: FiZap, description: 'Features and improvements planned', placeholder: 'e.g. Client portal v2.0' },
        { primary: 'tech', label: 'Tech Stack Upgrades', icon: FiMonitor, description: 'Technology and infrastructure upgrades', placeholder: 'e.g. Upgrade to Next.js 15' },
        { primary: 'training', label: 'Training Plans', icon: FiUsers, description: 'Team training and skill development', placeholder: 'e.g. React Native training for dev team' },
    ],
    market: [
        { primary: 'industry', label: 'Target Industries', icon: FiTarget, description: 'New industry verticals to penetrate', placeholder: 'e.g. Healthcare sector' },
        { primary: 'geo', label: 'Geographic Expansion', icon: FiMapPin, description: 'New regions and markets to enter', placeholder: 'e.g. KSA market expansion' },
        { primary: 'partnership', label: 'Partnership Opportunities', icon: FiUsers, description: 'Potential partners and alliances', placeholder: 'e.g. Partnership with AWS partner network' },
        { primary: 'competitor', label: 'Competitor Analysis', icon: FiAlertCircle, description: 'Track and analyze competitors', placeholder: 'e.g. Analyze competitor pricing model' },
    ],
    risk: [
        { primary: 'risk', label: 'Identified Risks', icon: FiAlertCircle, description: 'Known risks and threats', placeholder: 'e.g. Key developer dependency risk' },
        { primary: 'mitigation', label: 'Mitigation Strategies', icon: FiShield, description: 'Plans to reduce or eliminate risks', placeholder: 'e.g. Cross-train 2nd developer on all systems' },
        { primary: 'contingency', label: 'Contingency Plans', icon: FiCheckCircle, description: 'Fallback plans if risks materialize', placeholder: 'e.g. Emergency freelancer roster' },
    ],
    resource: [
        { primary: 'hire', label: 'Hiring Plan', icon: FiUserPlus, description: 'Planned hires with timelines and roles', placeholder: 'e.g. Senior React Developer – Q3 2026' },
        { primary: 'equipment', label: 'Equipment & Software', icon: FiMonitor, description: 'Hardware and software purchases', placeholder: 'e.g. MacBook Pro for new hire' },
        { primary: 'office', label: 'Office Expansion', icon: FiHome, description: 'Office space and infrastructure plans', placeholder: 'e.g. New office in Cairo – end of year' },
        { primary: 'budget', label: 'Budget Allocation', icon: FiDollarSign, description: 'Distribute budget across departments', placeholder: 'e.g. Development team – 60% of budget' },
    ],
};

interface AddItemFormProps {
    planId: number;
    defaultType: string;
    placeholder: string;
    onSave: () => void;
    onCancel: () => void;
}

function AddItemForm({ planId, defaultType, placeholder, onSave, onCancel }: AddItemFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [value, setValue] = useState('');
    const [due_date, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!title.trim()) return;
        setLoading(true);
        try {
            await api.post('/planning/items/', {
                plan: planId, item_type: defaultType,
                title, description, value,
                due_date: due_date || null, status: 'Pending',
            });
            onSave();
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div className="bg-[#721C97]/10 border border-[#721C97]/40 rounded-xl p-4 space-y-3">
            <input
                autoFocus
                type="text"
                placeholder={placeholder}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#721C97] placeholder:text-gray-600"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <input
                type="text"
                placeholder="Description (optional)"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-[#721C97] placeholder:text-gray-600"
                value={description}
                onChange={e => setDescription(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Value / Amount / Target"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-[#721C97] placeholder:text-gray-600"
                    value={value} onChange={e => setValue(e.target.value)} />
                <input type="date"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-[#721C97]"
                    value={due_date} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
                <button onClick={handleSave} disabled={loading || !title.trim()}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-[#C1FF72] text-[#070308] rounded-lg hover:bg-[#aee661] disabled:opacity-50 transition-colors">
                    <FiSave className="w-3.5 h-3.5" /> {loading ? 'Saving...' : 'Save Item'}
                </button>
                <button onClick={onCancel} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white px-3 py-2 transition-colors rounded-lg hover:bg-white/5">
                    <FiX className="w-3.5 h-3.5" /> Cancel
                </button>
            </div>
        </div>
    );
}

interface ItemCardProps {
    item: any;
    onDelete: (id: number) => void;
    onStatusChange: (id: number, status: string) => void;
}

function ItemCard({ item, onDelete, onStatusChange }: ItemCardProps) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 group hover:border-white/20 transition-all">
            <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{item.title}</p>
                    {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {item.value && (
                            <span className="text-xs font-mono text-[#C1FF72] bg-[#C1FF72]/5 border border-[#C1FF72]/10 px-2 py-0.5 rounded">
                                {item.value}
                            </span>
                        )}
                        {item.due_date && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <FiClock className="w-3 h-3" />
                                {new Date(item.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <select
                        value={item.status}
                        onChange={e => onStatusChange(item.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none bg-transparent transition-colors ${ITEM_STATUS_COLORS[item.status]}`}
                    >
                        <option value="Pending">Pending</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Done">Done</option>
                        <option value="Blocked">Blocked</option>
                    </select>
                    <button onClick={() => onDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                        <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

interface CategoryTabProps {
    planId: number;
    tabKey: string;
    items: any[];
    onRefresh: () => void;
}

function CategoryTabPanel({ planId, tabKey, items, onRefresh }: CategoryTabProps) {
    const [addingType, setAddingType] = useState<string | null>(null);
    const sections = TAB_SECTIONS[tabKey] || [];

    const handleDelete = async (id: number) => {
        try { await api.delete(`/planning/items/${id}/`); onRefresh(); } catch (e) { console.error(e); }
    };

    const handleStatusChange = async (id: number, status: string) => {
        try { await api.patch(`/planning/items/${id}/`, { status }); onRefresh(); } catch (e) { console.error(e); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sections.map(section => {
                const sectionItems = items.filter(i => i.item_type === section.primary);
                const isAdding = addingType === section.primary;
                const Icon = section.icon;
                return (
                    <div key={section.primary} className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
                        {/* Section header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-white/3 border-b border-white/8">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#721C97]/20 border border-[#721C97]/30 flex items-center justify-center">
                                    <Icon className="w-3.5 h-3.5 text-[#C1FF72]" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{section.label}</p>
                                    <p className="text-xs text-gray-600">{sectionItems.length} item{sectionItems.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAddingType(isAdding ? null : section.primary)}
                                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${isAdding ? 'bg-white/10 text-gray-300' : 'bg-[#721C97]/20 text-[#C1FF72] border border-[#721C97]/30 hover:bg-[#721C97]/30'}`}
                            >
                                <FiPlus className="w-3.5 h-3.5" />
                                Add
                            </button>
                        </div>

                        {/* Section body */}
                        <div className="p-3 space-y-2 min-h-[80px]">
                            {isAdding && (
                                <AddItemForm
                                    planId={planId}
                                    defaultType={section.primary}
                                    placeholder={section.placeholder}
                                    onSave={() => { setAddingType(null); onRefresh(); }}
                                    onCancel={() => setAddingType(null)}
                                />
                            )}
                            {sectionItems.length === 0 && !isAdding ? (
                                <div className="flex flex-col items-center justify-center py-5 text-center">
                                    <p className="text-xs text-gray-600">{section.description}</p>
                                    <button onClick={() => setAddingType(section.primary)}
                                        className="mt-2 text-xs text-[#721C97] hover:text-[#C1FF72] transition-colors">
                                        + Add first item
                                    </button>
                                </div>
                            ) : (
                                sectionItems.map(item => (
                                    <ItemCard key={item.id} item={item} onDelete={handleDelete} onStatusChange={handleStatusChange} />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function PlanDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<TabKey>('board');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) { fetchPlan(); fetchItems(); }
    }, [id]);

    const fetchPlan = async () => {
        try {
            const res = await api.get(`/planning/plans/${id}/`);
            setPlan(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchItems = async () => {
        try {
            const res = await api.get(`/planning/items/?plan=${id}`);
            setItems(res.data.results || res.data);
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this plan? This cannot be undone.')) return;
        try { await api.delete(`/planning/plans/${id}/`); router.push('/dashboard/planning'); }
        catch (e) { console.error(e); }
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-white/5 rounded-xl w-64" />
                <div className="h-48 bg-white/5 rounded-2xl" />
            </div>
        );
    }
    if (!plan) return <div className="text-gray-400">Plan not found.</div>;

    const statusColor = STATUS_COLORS[plan.status] || STATUS_COLORS['Planning'];

    return (
        /* Full viewport column layout so board can fill remaining height */
        <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>

            {/* ── Header ── */}
            <div className="flex items-start gap-4 pb-4 border-b border-white/10 shrink-0">
                <Link href="/dashboard/planning" className="mt-1 p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10 shrink-0">
                    <FiArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-white truncate">{plan.name}</h1>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${statusColor}`}>
                            {plan.status === 'InProgress' ? 'In Progress' : plan.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                        {(plan.start_date || plan.end_date) && (
                            <span className="flex items-center gap-1.5">
                                <FiCalendar className="w-3.5 h-3.5" />
                                {plan.start_date ? new Date(plan.start_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}
                                {' → '}
                                {plan.end_date ? new Date(plan.end_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <FiUser className="w-3.5 h-3.5" />
                            {plan.owner_name || 'Unassigned'}
                        </span>
                        <span className="capitalize bg-white/5 px-2 py-0.5 rounded">{plan.plan_type}</span>
                    </div>
                </div>
                <button onClick={handleDelete} className="shrink-0 p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all border border-transparent hover:border-red-400/20">
                    <FiTrash2 className="w-4 h-4" />
                </button>
            </div>

            {/* ── Tab Bar ── */}
            <div className="flex gap-1 overflow-x-auto py-3 shrink-0" style={{ scrollbarWidth: 'none' }}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border shrink-0 ${active
                                    ? 'bg-[#721C97]/20 border-[#721C97]/50 text-[#C1FF72]'
                                    : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${active ? 'text-[#C1FF72]' : tab.color}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Tab Content ── flex-1 so it fills all remaining height ── */}
            <div className="flex-1 min-h-0 overflow-hidden rounded-2xl">
                {activeTab === 'board' ? (
                    /* Board fills the remaining height exactly, no overflow */
                    <div className="w-full h-full">
                        <PlanBoard planId={Number(id)} initialState={plan.board_state || {}} />
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                        <div className="py-2">
                            <CategoryTabPanel
                                planId={Number(id)}
                                tabKey={activeTab}
                                items={items}
                                onRefresh={fetchItems}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
