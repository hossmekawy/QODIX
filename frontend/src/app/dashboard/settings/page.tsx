'use client';
import { useState, useEffect } from 'react';
import { FiSave, FiAlertCircle } from 'react-icons/fi';
import api from '@/lib/api';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';

export default function SettingsPage() {
    const { refreshSettings } = useSettings();
    const { success, error } = useToast();
    const [activeTab, setActiveTab] = useState('company');
    const [loading, setLoading] = useState(false);

    const [company, setCompany] = useState<any>({});
    const [email, setEmail] = useState<any>({});
    const [security, setSecurity] = useState<any>({});
    const [backup, setBackup] = useState<any>({});

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [c, e, s, b] = await Promise.all([
                    api.get('/settings/company/').catch(() => ({ data: {} })),
                    api.get('/settings/email/').catch(() => ({ data: {} })),
                    api.get('/settings/security/').catch(() => ({ data: {} })),
                    api.get('/settings/backup/').catch(() => ({ data: {} }))
                ]);
                setCompany(c.data);
                setEmail(e.data);
                setSecurity(s.data);
                setBackup(b.data);
            } catch (err) {
                console.error('Failed to fetch settings', err);
            }
        };
        fetchAll();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            if (activeTab === 'company') {
                await api.put('/settings/company/', company);
                refreshSettings();
            } else if (activeTab === 'email') {
                await api.put('/settings/email/', email);
            } else if (activeTab === 'security') {
                await api.put('/settings/security/', security);
            } else if (activeTab === 'backup') {
                await api.put('/settings/backup/', backup);
            }
            success('Settings saved successfully!');
        } catch (err: any) {
            error(err.response?.data?.detail || 'Failed to save settings. Make sure you have admin rights.');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'company', label: 'Profile' },
        { id: 'email', label: 'Email' },
        { id: 'security', label: 'Security' },
        { id: 'backup', label: 'Backup' },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6 animate-fade-in pb-10 px-4 md:px-0">
            <div className="mt-4 md:mt-0">
                <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#C1FF72] to-[#721C97]">
                    System Settings
                </h1>
                <p className="text-sm md:text-base text-gray-400 mt-1 md:mt-2">Manage your company details and global application parameters.</p>
            </div>

            {/* Responsive Tabs with scroll on mobile */}
            <div className="flex space-x-1 border-b border-[#721C97]/30 overflow-x-auto no-scrollbar scroll-smooth">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap px-4 md:px-6 py-3 text-xs md:text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-[#C1FF72] text-[#C1FF72]'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-[#110A15] border border-[#721C97]/30 rounded-xl p-4 md:p-6 shadow-xl relative">
                {activeTab === 'company' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Company Name</label>
                            <input
                                type="text"
                                value={company.name || ''}
                                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base focus:outline-none focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Default Currency</label>
                            <input
                                type="text"
                                value={company.currency || ''}
                                onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                                className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base focus:outline-none focus:border-[#C1FF72]"
                            />
                        </div>
                        <div className="space-y-4 md:col-span-2">
                            <label className="text-sm font-medium text-gray-300">Company Logo</label>
                            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 p-4 rounded-xl border border-[#721C97]/30 bg-[#070308]/50">
                                <div className="relative w-24 h-24 rounded-lg border border-[#721C97]/50 bg-[#070308] flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(114,28,151,0.2)]">
                                    {company.logo ? (
                                        <img src={company.logo} alt="Logo Preview" className="max-w-full max-h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-gray-500 text-xs text-center px-2">No Logo</span>
                                    )}
                                </div>
                                <div className="flex-1 w-full space-y-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setCompany({ ...company, logo: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="block w-full text-xs md:text-sm text-gray-400 file:mr-4 file:py-2 file:md:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs md:file:text-sm file:font-medium file:bg-[#721C97]/20 file:text-[#C1FF72] hover:file:bg-[#721C97]/40 transition-all cursor-pointer focus:outline-none"
                                    />
                                    <p className="text-[10px] md:text-xs text-gray-500">Upload a PNG, JPG, or SVG image. Image will be serialized locally as Base64.</p>
                                    {company.logo && (
                                        <button
                                            onClick={() => setCompany({ ...company, logo: null })}
                                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            Remove Logo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Phone Number</label>
                            <input type="text" value={company.phone_number || ''} onChange={(e) => setCompany({ ...company, phone_number: e.target.value })} className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base outline-none focus:border-[#C1FF72]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Email Address</label>
                            <input type="email" value={company.email || ''} onChange={(e) => setCompany({ ...company, email: e.target.value })} className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base outline-none focus:border-[#C1FF72]" />
                        </div>
                    </div>
                )}

                {activeTab === 'email' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">SMTP Host</label>
                            <input type="text" value={email.smtp_host || ''} onChange={(e) => setEmail({ ...email, smtp_host: e.target.value })} className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base outline-none focus:border-[#C1FF72]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">SMTP Port</label>
                            <input type="number" value={email.smtp_port || 587} onChange={(e) => setEmail({ ...email, smtp_port: e.target.value })} className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base outline-none focus:border-[#C1FF72]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">SMTP User</label>
                            <input type="text" value={email.smtp_user || ''} onChange={(e) => setEmail({ ...email, smtp_user: e.target.value })} className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base outline-none focus:border-[#C1FF72]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">SMTP Password</label>
                            <input type="password" value={email.smtp_password || ''} onChange={(e) => setEmail({ ...email, smtp_password: e.target.value })} className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base outline-none focus:border-[#C1FF72]" />
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="grid grid-cols-1 gap-4 md:gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">IP Whitelist (Comma Separated)</label>
                            <textarea value={security.ip_whitelist || ''} onChange={(e) => setSecurity({ ...security, ip_whitelist: e.target.value })} className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base outline-none focus:border-[#C1FF72] min-h-[100px]" placeholder="e.g. 192.168.1.1, 10.0.0.1" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Login Attempt Limits</label>
                                <input type="number" value={security.login_attempt_limits || 5} onChange={(e) => setSecurity({ ...security, login_attempt_limits: e.target.value })} className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base outline-none focus:border-[#C1FF72]" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Audit Log Retention (Days)</label>
                                <input type="number" value={security.audit_log_retention_days || 30} onChange={(e) => setSecurity({ ...security, audit_log_retention_days: e.target.value })} className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base outline-none focus:border-[#C1FF72]" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'backup' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Automated Backup Schedule (Cron)</label>
                            <input type="text" value={backup.automated_backup_schedule || ''} onChange={(e) => setBackup({ ...backup, automated_backup_schedule: e.target.value })} className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base outline-none focus:border-[#C1FF72]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Backup Storage Location</label>
                            <input type="text" value={backup.backup_storage_location || ''} onChange={(e) => setBackup({ ...backup, backup_storage_location: e.target.value })} className="w-full bg-[#070308] border border-[#721C97]/50 rounded-lg px-4 py-2 text-white text-sm md:text-base outline-none focus:border-[#C1FF72]" />
                        </div>
                    </div>
                )}

                <div className="mt-6 md:mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#721C97] hover:bg-[#5a157a] text-white px-6 py-2.5 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#C1FF72]"
                    >
                        <FiSave className="w-5 h-5" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
