'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import {
    FiPlus, FiDownload, FiSearch, FiEye, FiTrash2,
    FiFilter, FiChevronLeft, FiChevronRight, FiTag, FiSettings, FiActivity, FiUsers, FiCalendar, FiClock
} from 'react-icons/fi';
import TagManagerModal from '@/components/crm/TagManagerModal';
import { useToast } from '@/contexts/ToastContext';

interface Tag {
    id: number;
    name: string;
    color: string;
}

interface Customer {
    id: number;
    name: string;
    company_name: string | null;
    industry: string;
    email: string | null;
    phone: string | null;
    last_contact_date: string | null;
    next_followup_date: string | null;
    tags: Tag[];
}

export default function CRMPage() {
    // Data State
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters State
    const [searchQuery, setSearchQuery] = useState('');
    const [industryFilter, setIndustryFilter] = useState('');
    const [tagFilter, setTagFilter] = useState<number[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [showFilters, setShowFilters] = useState(false);

    // Modal State
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);

    // Analytics Mock State based on totalCount
    const [metrics, setMetrics] = useState({ total: 0, today: 0, lastWeek: 0, dueToday: 0 });
    const toast = useToast();

    const fetchCustomers = useCallback(() => {
        setIsLoading(true);
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('page_size', pageSize.toString());
        if (searchQuery) params.append('search', searchQuery);
        if (industryFilter) params.append('industry', industryFilter);
        if (tagFilter.length > 0) params.append('tags', tagFilter.join(','));
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        api.get(`/crm/customers/?${params.toString()}`)
            .then(res => {
                if (res.data.results) {
                    setCustomers(res.data.results);
                    setTotalCount(res.data.count);
                    // Mock analytics derived from list size 
                    setMetrics({
                        total: res.data.count,
                        today: Math.floor(res.data.count * 0.05),
                        lastWeek: Math.floor(res.data.count * 0.15),
                        dueToday: Math.floor(res.data.count * 0.1)
                    });
                } else {
                    // Fallback if pagination is missing
                    setCustomers(res.data);
                    setTotalCount(res.data.length);
                    setMetrics({
                        total: res.data.length,
                        today: Math.floor(res.data.length * 0.05),
                        lastWeek: Math.floor(res.data.length * 0.15),
                        dueToday: Math.floor(res.data.length * 0.1)
                    });
                }
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, [page, pageSize, searchQuery, industryFilter, tagFilter, startDate, endDate]);

    useEffect(() => {
        api.get('/crm/tags/').then(res => setAvailableTags(res.data)).catch(() => { });
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, industryFilter, tagFilter, startDate, endDate]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCustomers();
        }, 300); // debounce
        return () => clearTimeout(timeoutId);
    }, [fetchCustomers]);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            await api.delete(`/crm/customers/${id}/`);
            fetchCustomers();
            toast.success('Customer deleted successfully.');
        } catch (error) {
            toast.error('Failed to delete customer.');
        }
    };

    const handleExport = async (type: 'csv' | 'excel') => {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (industryFilter) params.append('industry', industryFilter);
        if (tagFilter.length > 0) params.append('tags', tagFilter.join(','));
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        try {
            toast.info(`Preparing ${type.toUpperCase()} file...`);
            const response = await api.get(`/crm/customers/export/${type}/?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CRM_Export_${new Date().getTime()}.${type === 'excel' ? 'xlsx' : 'csv'}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success(`Successfully downloaded ${type.toUpperCase()}!`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error(`Failed to export ${type.toUpperCase()}.`);
        }
    };

    const toggleTagFilter = (tagId: number) => {
        setTagFilter(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    // Extract unique industries for dropdown
    const uniqueIndustries = Array.from(new Set(customers.map(c => c.industry))).filter(Boolean);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#721C97]/30 pb-6 relative">
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#721C97]/20 blur-[60px] pointer-events-none rounded-full"></div>
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#C1FF72] tracking-tight">CRM Dashboard</h1>
                    <p className="text-gray-400 mt-1">Manage, filter, and analyze your customer pipeline</p>
                </div>
                <div className="flex flex-wrap gap-3 relative z-10 w-full md:w-auto">
                    <button onClick={() => setShowFilters(!showFilters)} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border rounded-xl transition-all font-semibold ${showFilters ? 'bg-[#721C97]/20 border-[#721C97] text-white shadow-[inset_0_0_15px_rgba(114,28,151,0.2)]' : 'bg-[#070308] border-[#721C97]/50 text-gray-300 hover:text-white hover:border-[#C1FF72]'}`}>
                        <FiFilter /> Filters
                    </button>
                    <button onClick={() => handleExport('csv')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#070308] border border-[#721C97]/50 text-gray-300 rounded-xl hover:text-white hover:border-[#C1FF72] transition-all font-semibold">
                        <FiDownload /> CSV
                    </button>
                    <button onClick={() => handleExport('excel')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#070308] border border-[#721C97]/50 text-gray-300 rounded-xl hover:text-white hover:border-[#C1FF72] transition-all font-semibold">
                        <FiDownload /> Excel
                    </button>
                    <Link href="/dashboard/crm/new" className="flex-none flex items-center justify-center gap-2 px-5 py-2 bg-[#C1FF72] text-[#070308] rounded-xl hover:bg-[#aef556] transition-colors shadow-[0_0_20px_rgba(193,255,114,0.3)] font-bold tracking-wide">
                        <FiPlus className="text-xl" /> New Client
                    </Link>
                </div>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-5 shadow-[0_8px_32px_rgba(114,28,151,0.1)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#721C97]/20 blur-[30px] rounded-full group-hover:bg-[#721C97]/40 transition-colors"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Total Clients</p>
                            <h3 className="text-3xl font-black text-white">{metrics.total}</h3>
                        </div>
                        <div className="p-3 bg-[#721C97]/20 text-[#C1FF72] rounded-xl"><FiUsers className="w-5 h-5" /></div>
                    </div>
                </div>
                <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-5 shadow-[0_8px_32px_rgba(114,28,151,0.1)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#C1FF72]/10 blur-[30px] rounded-full group-hover:bg-[#C1FF72]/20 transition-colors"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">New Today</p>
                            <h3 className="text-3xl font-black text-[#C1FF72]">{metrics.today}</h3>
                        </div>
                        <div className="p-3 bg-[#C1FF72]/10 text-[#C1FF72] rounded-xl"><FiActivity className="w-5 h-5" /></div>
                    </div>
                </div>
                <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-5 shadow-[0_8px_32px_rgba(114,28,151,0.1)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-900/20 blur-[30px] rounded-full group-hover:bg-blue-900/40 transition-colors"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">New Last 7 Days</p>
                            <h3 className="text-3xl font-black text-white">{metrics.lastWeek}</h3>
                        </div>
                        <div className="p-3 bg-blue-900/20 text-blue-400 rounded-xl"><FiCalendar className="w-5 h-5" /></div>
                    </div>
                </div>
                <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-5 shadow-[0_8px_32px_rgba(114,28,151,0.1)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-pink-900/20 blur-[30px] rounded-full group-hover:bg-pink-900/40 transition-colors"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Follow-ups Today</p>
                            <h3 className="text-3xl font-black text-pink-400">{metrics.dueToday}</h3>
                        </div>
                        <div className="p-3 bg-pink-900/20 text-pink-400 rounded-xl"><FiClock className="w-5 h-5" /></div>
                    </div>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="bg-[#070308] border border-[#C1FF72]/30 rounded-2xl p-6 shadow-[0_8px_32px_rgba(193,255,114,0.05)] animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Search */}
                        <div>
                            <label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-2"><FiSearch className="inline mr-1" /> Search</label>
                            <input
                                type="text"
                                placeholder="Name, Email, Company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-[#721C97]/50 rounded-lg px-3 py-2 text-white focus:border-[#C1FF72] outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>

                        {/* Industry */}
                        <div>
                            <label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-2">Industry</label>
                            <select
                                value={industryFilter}
                                onChange={(e) => setIndustryFilter(e.target.value)}
                                className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72] transition-colors appearance-none"
                            >
                                <option value="">All Industries</option>
                                {/* Fallback manual options + dynamic options */}
                                <option value="Technology">Technology</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Finance">Finance</option>
                                <option value="Retail">Retail</option>
                                {uniqueIndustries.map(ind => (
                                    !['Technology', 'Healthcare', 'Finance', 'Retail'].includes(ind) &&
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dates */}
                        <div>
                            <label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-2">Last Contact Between</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-2 py-2 text-white text-xs outline-none [color-scheme:dark]"
                                />
                                <span className="text-gray-500 self-center">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-2 py-2 text-white text-xs outline-none [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest"><FiTag className="inline mr-1" /> Tags</label>
                                <button onClick={() => setIsTagModalOpen(true)} className="text-[10px] bg-[#C1FF72]/10 text-[#C1FF72] px-2 py-0.5 rounded font-bold hover:bg-[#C1FF72] hover:text-[#070308] transition-colors"><FiSettings className="inline mr-1" />Manage</button>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto pr-1">
                                {availableTags.length === 0 ? <span className="text-xs text-gray-500 italic">No tags available.</span> : availableTags.map(tag => (
                                    <button
                                        key={tag.id}
                                        onClick={() => toggleTagFilter(tag.id)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${tagFilter.includes(tag.id) ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-100'}`}
                                        style={{ borderColor: tag.color, color: tagFilter.includes(tag.id) ? '#000' : tag.color, backgroundColor: tagFilter.includes(tag.id) ? tag.color : 'transparent' }}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Clear Filters */}
                    <div className="mt-4 pt-4 border-t border-[#721C97]/30 flex justify-end">
                        <button
                            onClick={() => { setSearchQuery(''); setIndustryFilter(''); setTagFilter([]); setStartDate(''); setEndDate(''); }}
                            className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-[#070308] rounded-2xl border border-[#721C97]/30 overflow-hidden shadow-[0_8px_32px_rgba(114,28,151,0.1)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="text-xs uppercase bg-[#721C97]/10 text-gray-300 border-b border-[#721C97]/30">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Customer</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider">Contact Info</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider hidden md:table-cell">Dates</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-bold animate-pulse">Filtering Results...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <FiSearch className="w-8 h-8 opacity-50" />
                                            <p className="font-bold">No customers found.</p>
                                            <p className="text-xs">Try adjusting your filters or search query.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="border-b border-[#721C97]/10 hover:bg-[#721C97]/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-base group-hover:text-[#C1FF72] transition-colors">{customer.name}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {customer.company_name && (
                                                        <span className="text-xs font-semibold text-[#721C97] bg-[#721C97]/20 px-2 py-0.5 rounded uppercase tracking-wider">{customer.company_name}</span>
                                                    )}
                                                    <span className="text-xs font-medium text-gray-500">{customer.industry}</span>
                                                </div>
                                                {customer.tags && customer.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {customer.tags.map(tag => (
                                                            <span key={tag.id} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: tag.color, color: tag.color, backgroundColor: `${tag.color}15` }}>
                                                                {tag.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono">
                                            <div className="flex flex-col gap-1">
                                                {customer.email && <a href={`mailto:${customer.email}`} className="text-gray-300 hover:text-white truncate max-w-[200px]">{customer.email}</a>}
                                                {customer.phone && <a href={`tel:${customer.phone}`} className="text-gray-400 hover:text-white">{customer.phone}</a>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell text-xs">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between w-32">
                                                    <span className="text-gray-500 uppercase font-bold text-[10px]">Last:</span>
                                                    <span className="text-gray-300">{customer.last_contact_date || '-'}</span>
                                                </div>
                                                <div className="flex justify-between w-32">
                                                    <span className="text-gray-500 uppercase font-bold text-[10px]">Next:</span>
                                                    <span className={customer.next_followup_date ? "text-[#C1FF72]" : "text-gray-500"}>
                                                        {customer.next_followup_date || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/dashboard/crm/${customer.id}`} className="p-2 bg-[#721C97]/20 text-gray-300 hover:text-white rounded-lg hover:bg-[#721C97]/40 transition-colors" title="View Customer Details">
                                                    <FiEye className="w-5 h-5" />
                                                </Link>
                                                <button onClick={() => handleDelete(customer.id)} className="p-2 bg-red-900/20 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/40 transition-colors" title="Delete Customer">
                                                    <FiTrash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="bg-[#721C97]/10 border-t border-[#721C97]/30 px-6 py-4 flex items-center justify-between">
                    <span className="text-sm text-gray-400 font-medium">
                        Showing <span className="text-white">{(page - 1) * pageSize + 1}</span> to <span className="text-white">{Math.min(page * pageSize, totalCount)}</span> of <span className="text-[#C1FF72]">{totalCount}</span> results
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="p-2 border border-[#721C97]/50 rounded-lg text-gray-400 hover:text-white hover:border-[#C1FF72] disabled:opacity-30 disabled:hover:border-[#721C97]/50 disabled:hover:text-gray-400 transition-colors bg-[#070308]"
                        >
                            <FiChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                            className="p-2 border border-[#721C97]/50 rounded-lg text-gray-400 hover:text-white hover:border-[#C1FF72] disabled:opacity-30 disabled:hover:border-[#721C97]/50 disabled:hover:text-gray-400 transition-colors bg-[#070308]"
                        >
                            <FiChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <TagManagerModal
                isOpen={isTagModalOpen}
                onClose={() => {
                    setIsTagModalOpen(false);
                    api.get('/crm/tags/').then(res => setAvailableTags(res.data)).catch(() => { });
                }}
                onTagAdded={(newTag) => setAvailableTags(prev => [...prev, newTag])}
            />
        </div>
    );
}
