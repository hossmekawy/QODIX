'use client';
import { useState, useEffect } from 'react';
import {
    FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers,
    FiActivity, FiFileText, FiBriefcase, FiAperture,
    FiPlusCircle, FiSettings, FiGrid, FiList, FiCheckCircle, FiDownload
} from 'react-icons/fi';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

// Note: Ensure `recharts` is installed in package.json.
// Run: npm install recharts 
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function GlobalDashboardPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(true);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    // Listen for the browser's install prompt event
    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        // Hide banner if already installed as standalone
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowInstallBanner(false);
        }
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setShowInstallBanner(false);
            setDeferredPrompt(null);
        } else {
            // Fallback: guide user to browser's add to home screen
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isAndroid = /Android/.test(navigator.userAgent);
            if (isIOS) {
                alert('To install QODIX:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add"');
            } else if (isAndroid) {
                alert('To install QODIX:\n\n1. Tap the ⋮ menu (three dots)\n2. Tap "Add to Home screen"\n3. Tap "Add"');
            } else {
                alert('To install QODIX:\n\n1. Click the install icon in your browser\'s address bar\n\nOr use your browser\'s menu → "Install app" or "Add to Home screen"');
            }
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/settings/system-analytics/overview/');
                setData(response.data);
            } catch (error) {
                toast.error("Failed to load global system analytics.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-white/10 border-t-[#C1FF72] rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 font-medium">Synchronizing Mission Control...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount || 0);
    };

    // Use the real trailing 6-month revenue history from the backend aggregation API
    const revenueData = data.finance.revenue_history || [];

    const projectData = [
        { name: 'Healthy', value: data.projects.active_projects || 1, color: '#C1FF72' },
        { name: 'At Risk', value: 2, color: '#F87171' },
        { name: 'Completed', value: 14, color: '#60A5FA' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/10 pb-4 md:pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <FiAperture className="text-[#C1FF72] animate-pulse shrink-0" />
                        Mission Control
                    </h1>
                    <p className="text-sm md:text-base text-gray-400 mt-2">Welcome back. Here is your global system overview.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                    {showInstallBanner && (
                        <button
                            onClick={handleInstallClick}
                            className="flex items-center justify-center gap-2 bg-[#721C97]/20 border border-[#721C97]/50 hover:bg-[#721C97]/40 px-4 py-2.5 rounded-xl transition-all w-full sm:w-auto text-[#C1FF72]"
                        >
                            <FiDownload className="w-4 h-4" />
                            <span className="text-xs md:text-sm font-bold uppercase tracking-wider">Install App</span>
                        </button>
                    )}
                    <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl w-full sm:w-auto">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">{data.system.status}</span>
                        <span className="text-xs text-gray-400 ml-2">({data.system.active_users} Users Active)</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Finance Stats */}
                <div className="bg-[#110915] p-5 md:p-6 rounded-2xl border border-white/10 flex flex-col relative overflow-hidden group hover:border-[#C1FF72]/50 transition-colors">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#C1FF72]/10 rounded-full blur-2xl group-hover:bg-[#C1FF72]/20 transition-all"></div>
                    <p className="text-xs md:text-sm text-gray-400 font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
                        <FiDollarSign className="text-[#C1FF72]" /> This Month
                    </p>
                    <h3 className="text-3xl font-black text-white mt-2">{formatCurrency(data.finance.revenue_this_month)}</h3>
                    <p className="text-sm mt-3 flex items-center gap-1 text-[#C1FF72]">
                        <FiTrendingUp /> +14.5% <span className="text-gray-500">vs last month</span>
                    </p>
                </div>

                <div className="bg-[#110915] p-6 rounded-2xl border border-white/10 flex flex-col relative overflow-hidden group hover:border-red-500/50 transition-colors">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
                    <p className="text-sm text-gray-400 font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
                        <FiActivity className="text-red-400" /> Outstanding A/R
                    </p>
                    <h3 className="text-2xl font-black text-white mt-2">{formatCurrency(data.finance.outstanding_ar)}</h3>
                    {data.finance.outstanding_ar > 0 ? (
                        <p className="text-sm mt-3 flex items-center gap-1 text-red-400">
                            Requires Follow-up
                        </p>
                    ) : (
                        <p className="text-sm mt-3 flex items-center gap-1 text-[#C1FF72]">
                            <FiCheckCircle /> All cleared!
                        </p>
                    )}
                </div>

                {/* Project Stats */}
                <div className="bg-[#110915] p-6 rounded-2xl border border-white/10 flex flex-col relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                    <p className="text-sm text-gray-400 font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
                        <FiBriefcase className="text-blue-400" /> Active Projects
                    </p>
                    <h3 className="text-3xl font-black text-white mt-2">{data.projects.active_projects}</h3>
                    <p className="text-sm mt-3 flex items-center gap-1 text-gray-400">
                        In production pipeline
                    </p>
                </div>

                {/* CRM Stats */}
                <div className="bg-[#110915] p-6 rounded-2xl border border-white/10 flex flex-col relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                    <p className="text-sm text-gray-400 font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
                        <FiUsers className="text-purple-400" /> Total Customers
                    </p>
                    <h3 className="text-3xl font-black text-white mt-2">{data.crm.total_customers}</h3>
                    <p className="text-sm mt-3 flex items-center gap-1 text-[#C1FF72]">
                        <FiTrendingUp /> Steadily growing
                    </p>
                </div>
            </div>

            {/* Charts & Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

                {/* Main Area Chart */}
                <div className="lg:col-span-2 bg-[#070308] border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                        <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                            <FiTrendingUp className="text-[#C1FF72]" /> Revenue Growth
                        </h3>
                        <div className="bg-white/5 px-2 py-1 md:px-3 rounded-lg text-[10px] md:text-xs font-bold text-gray-400 border border-white/10">Year to Date</div>
                    </div>
                    <div className="h-[200px] md:h-[300px] w-full flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#C1FF72" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#C1FF72" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#110915', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#C1FF72', fontWeight: 'bold' }}
                                    formatter={(value: any) => formatCurrency(value)}
                                />
                                <Area type="monotone" dataKey="value" stroke="#C1FF72" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Project Health & Alerts */}
                <div className="flex flex-col gap-6">
                    {/* Donut Chart (Project Health) */}
                    <div className="bg-[#070308] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col pt-8">
                        <h3 className="text-lg font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                            <FiActivity className="text-blue-400" /> Project Health
                        </h3>
                        <div className="h-[180px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={projectData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {projectData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#110915', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-white">{data.projects.active_projects}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Active</span>
                            </div>
                        </div>
                    </div>

                    {/* System Alerts */}
                    <div className="bg-[#070308] border border-white/10 rounded-3xl p-6 shadow-2xl flex-grow flex flex-col h-full max-h-[400px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                System Alerts
                            </h3>
                            <Link href="/dashboard/notifications" className="text-xs text-blue-400 hover:text-white transition-colors">View All</Link>
                        </div>
                        <div className="overflow-y-auto pr-2 space-y-3 flex-grow custom-scrollbar">
                            {data.system.alerts && data.system.alerts.length > 0 ? (
                                data.system.alerts.map((alert: any) => (
                                    <div key={alert.id} className="p-3 bg-[#110915] rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                                        <p className="text-sm font-bold text-white mb-1">{alert.title}</p>
                                        <p className="text-xs text-gray-400 line-clamp-2">{alert.message}</p>
                                        <p className="text-[10px] text-gray-500 mt-2 font-mono">{new Date(alert.time).toLocaleString()}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-4">
                                    <FiCheckCircle className="w-8 h-8 mb-2 opacity-50 text-[#C1FF72]" />
                                    <p className="text-sm">No new alerts.<br />All systems nominal.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Projects Live Progress Row */}
            <div className="bg-[#070308] border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                        <FiBriefcase className="text-blue-400" /> Active Projects Progress
                    </h3>
                    <Link href="/dashboard/projects" className="text-xs md:text-sm text-blue-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg w-full sm:w-auto text-center border border-white/10">Manage Pipeline</Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4 overflow-x-hidden">
                    {data.projects.recent_progress && data.projects.recent_progress.length > 0 ? (
                        data.projects.recent_progress.map((project: any) => (
                            <Link href={`/dashboard/projects/${project.id}`} key={project.id} className="block group">
                                <div className="bg-[#110915] border border-white/5 group-hover:border-[#C1FF72]/30 p-4 rounded-2xl transition-all h-full flex flex-col">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 line-clamp-1">{project.customer}</p>
                                    <h4 className="text-white font-bold text-base mb-4 line-clamp-1">{project.name}</h4>

                                    <div className="mt-auto">
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-gray-400">Task Completion</span>
                                            <span className="text-[#C1FF72] font-bold">{project.progress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#C1FF72] rounded-full transition-all duration-1000"
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                        {project.due_date && (
                                            <p className="text-[10px] text-gray-500 mt-3 text-right">
                                                Due: <span className="text-gray-300">{new Date(project.due_date).toLocaleDateString()}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-8 text-center text-gray-500">
                            <p>No active projects in the pipeline.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Navigation / Action Bar */}
            <div className="pt-4 md:pt-6">
                <h3 className="text-base md:text-lg font-bold text-white mb-4">Quick Navigation</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">

                    <Link href="/dashboard/finance/invoices/new" className="bg-[#C1FF72] text-[#070308] hover:bg-white p-4 rounded-2xl transition-all shadow-lg hover:shadow-[#C1FF72]/20 group flex flex-col items-center justify-center text-center gap-2">
                        <FiPlusCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-sm">New Invoice</span>
                    </Link>

                    <Link href="/dashboard/finance/invoices" className="bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 p-4 rounded-2xl text-white transition-all group flex flex-col items-center justify-center text-center gap-2">
                        <FiFileText className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                        <span className="font-bold text-sm">All Invoices</span>
                    </Link>

                    <Link href="/dashboard/projects" className="bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 p-4 rounded-2xl text-white transition-all group flex flex-col items-center justify-center text-center gap-2">
                        <FiList className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors" />
                        <span className="font-bold text-sm">Projects List</span>
                    </Link>

                    <Link href="/dashboard/crm" className="bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 p-4 rounded-2xl text-white transition-all group flex flex-col items-center justify-center text-center gap-2">
                        <FiUsers className="w-6 h-6 text-purple-400 group-hover:text-white transition-colors" />
                        <span className="font-bold text-sm">CRM / Clients</span>
                    </Link>

                    <Link href="/dashboard/planning" className="bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 p-4 rounded-2xl text-white transition-all group flex flex-col items-center justify-center text-center gap-2">
                        <FiGrid className="w-6 h-6 text-orange-400 group-hover:text-white transition-colors" />
                        <span className="font-bold text-sm">Business Plan</span>
                    </Link>

                    <Link href="/dashboard/settings" className="bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 p-4 rounded-2xl text-white transition-all group flex flex-col items-center justify-center text-center gap-2">
                        <FiSettings className="w-6 h-6 text-gray-400 hover:rotate-90 transition-transform duration-500" />
                        <span className="font-bold text-sm">Settings</span>
                    </Link>

                </div>
            </div>

        </div>
    );
}
