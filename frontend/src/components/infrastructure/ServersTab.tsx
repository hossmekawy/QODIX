'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FiServer, FiPlus, FiTerminal, FiCreditCard, FiTrash2, FiEdit2, FiActivity } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useToast } from '@/contexts/ToastContext';
import ServerInspectModal from './ServerInspectModal';

export default function ServersTab() {
    const [servers, setServers] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [inspectingServer, setInspectingServer] = useState<any>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '', ip_address: '', server_type: 'VPS', provider: '', portal_url: '',
        storage: '', ram: '', bandwidth: '', location: '', status: 'Active',
        payment_method: '', ssh_details: '', purchase_date: '', renewal_date: '',
        cost: '', billing_cycle: 'Monthly', auto_renewal: true
    });

    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [serversRes, metricsRes] = await Promise.all([
                api.get('/infrastructure/servers/'),
                api.get('/infrastructure/servers/metrics/')
            ]);
            setServers(serversRes.data);
            setMetrics(metricsRes.data);
        } catch (error) {
            toast.error('Failed to load server data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentId) {
                await api.patch(`/infrastructure/servers/${currentId}/`, formData);
                toast.success('Server updated successfully');
            } else {
                await api.post('/infrastructure/servers/', formData);
                toast.success('Server created successfully');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to save server');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this server?')) return;
        try {
            await api.delete(`/infrastructure/servers/${id}/`);
            toast.success('Server deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete server');
        }
    };

    const openEditModal = (server: any) => {
        setFormData({
            ...server,
            purchase_date: server.purchase_date || '',
            renewal_date: server.renewal_date || '',
            ip_address: server.ip_address || '',
            portal_url: server.portal_url || '',
            location: server.location || '',
            payment_method: server.payment_method || '',
            ssh_details: server.ssh_details || '',
        });
        setCurrentId(server.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setFormData({
            name: '', ip_address: '', server_type: 'VPS', provider: '', portal_url: '',
            storage: '', ram: '', bandwidth: '', location: '', status: 'Active',
            payment_method: '', ssh_details: '', purchase_date: '', renewal_date: '',
            cost: '', billing_cycle: 'Monthly', auto_renewal: true
        });
        setIsEditing(false);
        setCurrentId(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in">
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 bg-[#070308] border border-[#721C97]/30 rounded-2xl p-4 md:p-6 shadow-lg flex flex-col md:flex-row gap-4 md:gap-6">
                        <div className="flex-1 space-y-4 flex flex-row md:flex-col justify-between md:justify-start">
                            <div className="text-center md:text-left">
                                <p className="text-gray-400 text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">Total Servers</p>
                                <h3 className="text-2xl md:text-4xl font-black text-white">{metrics.total_servers}</h3>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-gray-400 text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">Monthly Cost</p>
                                <h3 className="text-2xl md:text-4xl font-black text-[#C1FF72]">${metrics.total_monthly_usd}</h3>
                            </div>
                        </div>
                        <div className="flex-[2] h-32 md:h-40 mt-4 md:mt-0">
                            <p className="text-gray-400 text-[10px] md:text-xs uppercase font-bold tracking-wider mb-2 text-center">Upcoming Renewals Alert</p>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: '< 7 Days', renewals: metrics.renewals_within_7_days, color: '#ef4444' },
                                    { name: '< 15 Days', renewals: metrics.renewals_within_15_days, color: '#eab308' },
                                    { name: '< 30 Days', renewals: metrics.renewals_within_30_days, color: '#3b82f6' }
                                ]}>
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#070308', border: '1px solid #721C97', borderRadius: '8px' }} />
                                    <Bar dataKey="renewals" radius={[4, 4, 0, 0]}>
                                        {
                                            [
                                                { name: '< 7 Days', renewals: metrics.renewals_within_7_days, color: '#ef4444' },
                                                { name: '< 15 Days', renewals: metrics.renewals_within_15_days, color: '#eab308' },
                                                { name: '< 30 Days', renewals: metrics.renewals_within_30_days, color: '#3b82f6' }
                                            ].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-[#070308] border border-red-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-center items-center text-center">
                        <p className="text-red-400 text-xs uppercase font-bold tracking-wider mb-2">Critical Action</p>
                        <h3 className="text-5xl font-black text-red-500 mb-2">{metrics.renewals_within_7_days}</h3>
                        <p className="text-sm text-gray-400">Servers expiring within 7 days</p>
                    </div>
                </div>
            )}

            <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-4 md:p-6 shadow-lg relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-6">
                    <h2 className="text-lg md:text-xl font-bold text-white">Servers & Hosting</h2>
                    <button onClick={openCreateModal} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#C1FF72] text-[#070308] rounded-xl hover:bg-[#aef556] transition-colors font-bold shadow-[0_0_15px_rgba(193,255,114,0.2)] text-sm md:text-base">
                        <FiPlus /> Add Server
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {isLoading ? (
                        <div className="col-span-full text-center py-8 text-gray-500">Loading servers...</div>
                    ) : servers.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-500 italic">No servers found.</div>
                    ) : (
                        servers.map(server => (
                            <div key={server.id} className="border border-[#721C97]/40 rounded-xl p-5 bg-white/5 hover:bg-white/10 transition-colors group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#C1FF72]/10 blur-[40px] pointer-events-none rounded-full"></div>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            {server.name}
                                            <span className={`w-2 h-2 rounded-full ${server.status === 'Active' ? 'bg-[#C1FF72]' : 'bg-red-500'}`}></span>
                                        </h3>
                                        <p className="text-xs font-mono text-gray-400 mt-1">{server.ip_address}</p>
                                    </div>
                                    <span className="text-xs font-bold bg-[#721C97]/30 text-[#C1FF72] px-2 py-1 rounded">{server.provider}</span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 my-4">
                                    <div className="bg-[#070308] p-2 rounded text-center">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">RAM</div>
                                        <div className="text-sm text-white font-medium">{server.ram}</div>
                                    </div>
                                    <div className="bg-[#070308] p-2 rounded text-center">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Storage</div>
                                        <div className="text-sm text-white font-medium">{server.storage}</div>
                                    </div>
                                    <div className="bg-[#070308] p-2 rounded text-center">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Cost</div>
                                        <div className="text-sm text-[#C1FF72] font-medium">${server.cost}/{server.billing_cycle[0]}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-xs text-gray-400 border-t border-[#721C97]/20 pt-3 mt-2">
                                    <span>Renews: <span className="text-white font-medium">{server.renewal_date}</span></span>
                                    <span>{server.projects?.length || 0} Projects</span>
                                </div>

                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                                    <button onClick={() => setInspectingServer(server)} title="Inspect server" className="p-1.5 bg-[#C1FF72]/10 hover:bg-[#C1FF72]/30 text-[#C1FF72] rounded transition-colors"><FiActivity size={12} /></button>
                                    <button onClick={() => openEditModal(server)} className="p-1.5 bg-black/50 hover:bg-[#721C97]/50 text-white rounded transition-colors"><FiEdit2 size={12} /></button>
                                    <button onClick={() => handleDelete(server.id)} className="p-1.5 bg-black/50 hover:bg-red-900/50 text-red-400 rounded transition-colors"><FiTrash2 size={12} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Inspect Modal */}
            {inspectingServer && (
                <ServerInspectModal server={inspectingServer} onClose={() => setInspectingServer(null)} />
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
                    <div className="bg-[#070308] border border-[#721C97]/50 md:rounded-2xl rounded-t-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_0_40px_rgba(114,28,151,0.3)] animate-in slide-in-from-bottom-5 md:slide-in-from-bottom-0 md:zoom-in-95">
                        <div className="p-4 md:p-6 border-b border-[#721C97]/30 flex justify-between items-center sticky top-0 bg-[#070308] z-10">
                            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{isEditing ? 'Edit Server' : 'Add New Server'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors"><FiTrash2 className="hidden" /> ✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-4 md:p-6 space-y-4 md:space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-1">Server Name*</label><input required type="text" className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div><label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-1">Provider*</label><input required type="text" className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72]" value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })} placeholder="e.g. AWS, Contabo" /></div>
                                <div><label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-1">IP Address</label><input type="text" className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-[#C1FF72]" value={formData.ip_address} onChange={e => setFormData({ ...formData, ip_address: e.target.value })} /></div>

                                <div>
                                    <label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-1">Server Type*</label>
                                    <select className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72]" value={formData.server_type} onChange={e => setFormData({ ...formData, server_type: e.target.value })}>
                                        <option>VPS</option><option>Dedicated</option><option>Cloud</option><option>Shared</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-1">Status</label>
                                    <select className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72]" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option>Active</option><option>Suspended</option><option>Cancelled</option>
                                    </select>
                                </div>
                                <div><label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest mb-1">Location</label><input type="text" className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72]" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Frankfurt, DE" /></div>
                            </div>

                            <div className="pt-4 border-t border-[#721C97]/30">
                                <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Specifications</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">RAM</label><input type="text" className="w-full bg-white/5 border border-[#721C97]/30 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72]" value={formData.ram} onChange={e => setFormData({ ...formData, ram: e.target.value })} placeholder="e.g. 16 GB" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Storage</label><input type="text" className="w-full bg-white/5 border border-[#721C97]/30 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72]" value={formData.storage} onChange={e => setFormData({ ...formData, storage: e.target.value })} placeholder="e.g. 400 GB NVMe" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Bandwidth</label><input type="text" className="w-full bg-white/5 border border-[#721C97]/30 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72]" value={formData.bandwidth} onChange={e => setFormData({ ...formData, bandwidth: e.target.value })} placeholder="e.g. 32 TB" /></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#721C97]/30">
                                <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Billing details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Cost (USD)*</label><input required type="number" step="0.01" className="w-full bg-white/5 border border-[#721C97]/30 rounded-lg px-3 py-2 text-[#C1FF72] outline-none focus:border-[#C1FF72] font-bold" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} /></div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Billing Cycle</label>
                                        <select className="w-full bg-white/5 border border-[#721C97]/30 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72]" value={formData.billing_cycle} onChange={e => setFormData({ ...formData, billing_cycle: e.target.value })}>
                                            <option>Monthly</option><option>Yearly</option>
                                        </select>
                                    </div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Renewal Date</label><input type="date" className="w-full bg-white/5 border border-[#721C97]/30 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72]" value={formData.renewal_date} onChange={e => setFormData({ ...formData, renewal_date: e.target.value })} /></div>
                                    <div className="flex items-end pb-2">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input type="checkbox" className="w-4 h-4 accent-[#C1FF72]" checked={formData.auto_renewal} onChange={e => setFormData({ ...formData, auto_renewal: e.target.checked })} />
                                            <span className="text-sm font-bold text-gray-300">Auto-Renewal</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#721C97]/30">
                                <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Access Info</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Portal URL</label><input type="url" className="w-full bg-white/5 border border-[#721C97]/30 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72]" value={formData.portal_url} onChange={e => setFormData({ ...formData, portal_url: e.target.value })} placeholder="https://" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">SSH Info & Root Pass</label><input type="text" className="w-full bg-white/5 border border-[#721C97]/30 rounded-lg px-3 py-2 text-white outline-none focus:border-[#C1FF72] font-mono" value={formData.ssh_details} onChange={e => setFormData({ ...formData, ssh_details: e.target.value })} placeholder="root@ip / pass..." /></div>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-3 justify-end pt-4 border-t border-[#721C97]/30 mt-6 sticky bottom-0 bg-[#070308] py-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full md:w-auto px-6 py-2.5 rounded-xl border border-[#721C97]/50 text-white font-bold hover:bg-[#721C97]/20 transition-colors">Cancel</button>
                                <button type="submit" className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-[#C1FF72] text-[#070308] font-bold hover:bg-[#aef556] transition-colors shadow-[0_0_15px_rgba(193,255,114,0.3)]">{isEditing ? 'Save Changes' : 'Add Server'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
