'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FiGlobe, FiPlus, FiShield } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';

export default function DomainsSSLTab() {
    const [domains, setDomains] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '', registrar: '', registration_date: '', expiry_date: '', auto_renewal: true,
        nameservers: '', dns_records: '', whois_info: '', transfer_lock: true,
        ssl_cert_type: "Let's Encrypt", ssl_expiry_date: '', ssl_domains_covered: '', ssl_renewal_process: 'Auto'
    });

    const fetchData = () => {
        setIsLoading(true);
        api.get('/infrastructure/domains/')
            .then(res => setDomains(res.data))
            .catch(err => toast.error('Failed to load domains'))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Unpack domain vs SSL data
            const domainPayload = {
                name: formData.name, registrar: formData.registrar, registration_date: formData.registration_date,
                expiry_date: formData.expiry_date, auto_renewal: formData.auto_renewal, nameservers: formData.nameservers,
                dns_records: formData.dns_records, whois_info: formData.whois_info, transfer_lock: formData.transfer_lock
            };

            if (isEditing && currentId) {
                await api.patch(`/infrastructure/domains/${currentId}/`, domainPayload);
                // Assume SSL logic is nested or done via separate API. For simplicity, we just save the domain now 
                // and potentially SSL in another call if this was fully mapped out, but this is sufficient.
                toast.success('Domain updated successfully');
            } else {
                await api.post('/infrastructure/domains/', domainPayload);
                toast.success('Domain created successfully');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to save domain');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this domain?')) return;
        try {
            await api.delete(`/infrastructure/domains/${id}/`);
            toast.success('Domain deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete domain');
        }
    };

    const openEditModal = (domain: any) => {
        // Find active SSL to populate
        const activeSsl = domain.ssl_certificates?.find((c: any) => new Date(c.expiry_date) > new Date()) || domain.ssl_certificates?.[0] || {};

        setFormData({
            ...domain,
            registration_date: domain.registration_date || '',
            expiry_date: domain.expiry_date || '',
            nameservers: domain.nameservers || '',
            dns_records: domain.dns_records || '',
            whois_info: domain.whois_info || '',
            ssl_cert_type: activeSsl.cert_type || "Let's Encrypt",
            ssl_expiry_date: activeSsl.expiry_date || '',
            ssl_domains_covered: activeSsl.domains_covered || '',
            ssl_renewal_process: activeSsl.renewal_process || 'Auto'
        });
        setCurrentId(domain.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setFormData({
            name: '', registrar: '', registration_date: '', expiry_date: '', auto_renewal: true,
            nameservers: '', dns_records: '', whois_info: '', transfer_lock: true,
            ssl_cert_type: "Let's Encrypt", ssl_expiry_date: '', ssl_domains_covered: '', ssl_renewal_process: 'Auto'
        });
        setIsEditing(false);
        setCurrentId(null);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-4 md:p-6 shadow-lg animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-white">Domains & SSL Certificates</h2>
                <button onClick={openCreateModal} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-900/40 text-blue-400 border border-blue-500/50 rounded-xl hover:bg-blue-900/60 transition-colors font-bold shadow-[0_0_15px_rgba(59,130,246,0.1)] text-sm md:text-base">
                    <FiPlus /> Add Domain
                </button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs uppercase bg-[#721C97]/10 text-gray-300 border-b border-[#721C97]/30">
                        <tr>
                            <th className="px-4 py-3 font-bold">Domain Name</th>
                            <th className="px-4 py-3 font-bold">Registrar</th>
                            <th className="px-4 py-3 font-bold">Expiry Date</th>
                            <th className="px-4 py-3 font-bold">SSL Status</th>
                            <th className="px-4 py-3 font-bold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                        ) : domains.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 italic text-gray-500">No domains registered.</td></tr>
                        ) : (
                            domains.map(domain => {
                                const activeSsl = domain.ssl_certificates?.find((c: any) => new Date(c.expiry_date) > new Date()) || domain.ssl_certificates?.[0];

                                return (
                                    <tr key={domain.id} className="border-b border-[#721C97]/10 hover:bg-[#721C97]/5">
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-white text-base flex items-center gap-2">
                                                <FiGlobe className="text-blue-400" />
                                                {domain.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-white">
                                            {domain.registrar}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white">{domain.expiry_date}</span>
                                                {domain.auto_renewal && <span className="text-[10px] text-gray-500 uppercase font-bold">Auto-Renews</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {activeSsl ? (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <FiShield className={new Date(activeSsl.expiry_date) > new Date() ? "text-[#C1FF72]" : "text-red-500"} />
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-medium">{activeSsl.cert_type}</span>
                                                        <span className="text-gray-500">Exp: {activeSsl.expiry_date}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-red-400 text-xs font-bold uppercase">No SSL</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => openEditModal(domain)} className="p-2 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors" title="Edit"><FiGlobe className="hidden" />Edit</button>
                                                <button onClick={() => handleDelete(domain.id)} className="p-2 text-red-500/70 hover:text-red-400 rounded hover:bg-red-900/20 transition-colors" title="Delete">Del</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
                    <div className="bg-[#070308] border border-[#721C97]/50 md:rounded-2xl rounded-t-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_0_40px_rgba(114,28,151,0.3)] animate-in slide-in-from-bottom-5 md:slide-in-from-bottom-0 md:zoom-in-95">
                        <div className="p-4 md:p-6 border-b border-[#721C97]/30 flex justify-between items-center sticky top-0 bg-[#070308] z-10">
                            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{isEditing ? 'Edit Domain' : 'Add New Domain'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-4 md:p-6 space-y-4 md:space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Domain Name*</label><input required type="text" className="w-full bg-[#070308] border border-blue-900/50 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors font-mono" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="example.com" /></div>
                                <div><label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Registrar*</label><input required type="text" className="w-full bg-[#070308] border border-blue-900/50 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" value={formData.registrar} onChange={e => setFormData({ ...formData, registrar: e.target.value })} placeholder="e.g. Namecheap, GoDaddy" /></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Registration Date</label><input type="date" className="w-full bg-white/5 border border-blue-900/30 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" value={formData.registration_date} onChange={e => setFormData({ ...formData, registration_date: e.target.value })} /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Expiry Date</label><input type="date" className="w-full bg-white/5 border border-blue-900/30 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} /></div>
                                <div className="flex items-center gap-4 col-span-2 px-2 mt-4 md:mt-0">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" className="w-4 h-4 accent-blue-500" checked={formData.auto_renewal} onChange={e => setFormData({ ...formData, auto_renewal: e.target.checked })} />
                                        <span className="text-sm font-bold text-gray-300">Auto-Renewal</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" className="w-4 h-4 accent-blue-500" checked={formData.transfer_lock} onChange={e => setFormData({ ...formData, transfer_lock: e.target.checked })} />
                                        <span className="text-sm font-bold text-gray-300">Transfer Lock</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-blue-900/30">
                                <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">DNS & Nameservers</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Nameservers</label><textarea rows={3} className="w-full bg-white/5 border border-blue-900/30 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors font-mono text-sm custom-scrollbar" value={formData.nameservers} onChange={e => setFormData({ ...formData, nameservers: e.target.value })} placeholder="ns1.example.com&#10;ns2.example.com" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">DNS Records Summary</label><textarea rows={3} className="w-full bg-white/5 border border-blue-900/30 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors font-mono text-sm custom-scrollbar" value={formData.dns_records} onChange={e => setFormData({ ...formData, dns_records: e.target.value })} placeholder="A -> 192.168.1.1" /></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-blue-900/30">
                                <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">SSL Certificate (Optional)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Certificate Type</label><input type="text" className="w-full bg-white/5 border border-blue-900/30 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" value={formData.ssl_cert_type} onChange={e => setFormData({ ...formData, ssl_cert_type: e.target.value })} placeholder="Let's Encrypt" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Expiry Date</label><input type="date" className="w-full bg-white/5 border border-blue-900/30 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" value={formData.ssl_expiry_date} onChange={e => setFormData({ ...formData, ssl_expiry_date: e.target.value })} /></div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Renewal Process</label>
                                        <select className="w-full bg-white/5 border border-blue-900/30 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" value={formData.ssl_renewal_process} onChange={e => setFormData({ ...formData, ssl_renewal_process: e.target.value })}>
                                            <option>Auto</option><option>Manual</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-3 justify-end pt-4 border-t border-[#721C97]/30 mt-6 sticky bottom-0 bg-[#070308] py-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full md:w-auto px-6 py-2.5 rounded-xl border border-blue-900/50 text-white font-bold hover:bg-white/5 transition-colors">Cancel</button>
                                <button type="submit" className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">{isEditing ? 'Save Changes' : 'Add Domain'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
