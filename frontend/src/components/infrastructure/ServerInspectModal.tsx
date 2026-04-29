'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
    FiX, FiRefreshCw, FiActivity, FiGlobe, FiLayers,
    FiCopy, FiExternalLink, FiWifi, FiLock, FiAlertTriangle,
    FiTag, FiCheck
} from 'react-icons/fi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PortEntry {
    port: number;
    process: string;
    pid: string;
    state: string;
    local_address: string;
    label: string;
    notes: string;
    label_id: number | null;
}

interface VHost {
    server_name: string;
    all_names: string[];
    listen_ports: number[];
    proxy_pass: string | null;
    root: string | null;
    ssl: boolean;
    filename: string;
    enabled: boolean;
}

interface Props {
    server: any;
    onClose: () => void;
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="border-b border-white/5 animate-pulse">
            {[1, 2, 3, 4].map(i => (
                <td key={i} className="px-4 py-3">
                    <div className="h-3 bg-white/10 rounded w-3/4" />
                </td>
            ))}
        </tr>
    );
}

// ─── Inline label editor ─────────────────────────────────────────────────────

function LabelCell({ serverId, port, initialLabel, initialNotes }: {
    serverId: number; port: number; initialLabel: string; initialNotes: string;
}) {
    const [editing, setEditing] = useState(false);
    const [label, setLabel] = useState(initialLabel);
    const [notes, setNotes] = useState(initialNotes);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            await api.put(`/infrastructure/servers/${serverId}/ports/${port}/label/`, { label, notes });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch { }
        setSaving(false);
        setEditing(false);
    };

    if (editing) {
        return (
            <td className="px-4 py-2 min-w-[200px]">
                <div className="flex flex-col gap-1">
                    <input
                        autoFocus
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                        placeholder="Label…"
                        className="bg-[#070308] border border-[#C1FF72]/60 text-white text-xs px-2 py-1 rounded outline-none w-full font-mono"
                    />
                    <input
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                        placeholder="Notes (optional)…"
                        className="bg-[#070308] border border-white/10 text-gray-400 text-xs px-2 py-1 rounded outline-none w-full"
                    />
                    <div className="flex gap-1">
                        <button onClick={save} disabled={saving}
                            className="flex-1 text-[10px] py-1 bg-[#C1FF72]/20 text-[#C1FF72] rounded hover:bg-[#C1FF72]/30 transition-colors font-bold">
                            {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(false)}
                            className="flex-1 text-[10px] py-1 bg-white/5 text-gray-400 rounded hover:bg-white/10 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </td>
        );
    }

    return (
        <td className="px-4 py-3 cursor-pointer group/label" onDoubleClick={() => setEditing(true)}
            title="Double-click to edit">
            <div className="flex items-center gap-2">
                {saved && <FiCheck className="w-3 h-3 text-[#C1FF72] shrink-0" />}
                {label ? (
                    <span className="text-xs font-mono text-[#C1FF72] bg-[#C1FF72]/10 px-2 py-0.5 rounded border border-[#C1FF72]/20">
                        {label}
                    </span>
                ) : (
                    <span className="text-xs text-gray-600 italic group-hover/label:text-gray-400 flex items-center gap-1">
                        <FiTag className="w-3 h-3" /> add label…
                    </span>
                )}
            </div>
            {notes && <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[180px]">{notes}</p>}
        </td>
    );
}

// ─── Tab: Active Ports ───────────────────────────────────────────────────────

function PortsTab({ server }: { server: any }) {
    const [data, setData] = useState<{ ports: PortEntry[]; cached_at: number | null; error: string | null } | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetch = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true); else setLoading(true);
        try {
            const url = refresh
                ? `/infrastructure/servers/${server.id}/ports/refresh/`
                : `/infrastructure/servers/${server.id}/ports/`;
            const method = refresh ? 'post' : 'get';
            const res = await (method === 'post' ? api.post(url) : api.get(url));
            setData(res.data);
        } catch (e: any) {
            setData({ ports: [], cached_at: null, error: e.message || 'Failed to connect' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [server.id]);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">
                        {data?.ports.length ?? 0} listening ports
                    </span>
                    {data?.cached_at && (
                        <span className="text-xs text-gray-600">
                            scanned {new Date(data.cached_at * 1000).toLocaleTimeString()}
                        </span>
                    )}
                </div>
                <button onClick={() => fetch(true)} disabled={refreshing}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#C1FF72]/10 text-[#C1FF72] border border-[#C1FF72]/20 rounded-lg hover:bg-[#C1FF72]/20 transition-colors font-bold disabled:opacity-50">
                    <FiRefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Scanning…' : 'Refresh'}
                </button>
            </div>

            {data?.error && (
                <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    <FiAlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{data.error}</span>
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#0d0d1a] text-left text-xs text-gray-500 uppercase tracking-widest">
                            <th className="px-4 py-3 font-bold">Port</th>
                            <th className="px-4 py-3 font-bold">Process</th>
                            <th className="px-4 py-3 font-bold">PID</th>
                            <th className="px-4 py-3 font-bold">Label <span className="text-gray-700 normal-case">(dbl-click to edit)</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : data?.ports.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-10 text-gray-600 italic">No listening ports found</td></tr>
                        ) : (
                            data?.ports.map(p => (
                                <tr key={p.port} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3">
                                        <span className="font-mono font-bold text-[#C1FF72] text-base">{p.port}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-white text-xs bg-white/5 px-2 py-1 rounded">{p.process}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.pid}</td>
                                    <LabelCell
                                        serverId={server.id}
                                        port={p.port}
                                        initialLabel={p.label}
                                        initialNotes={p.notes}
                                    />
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Tab: Nginx Sites ────────────────────────────────────────────────────────

function NginxTab({ server }: { server: any }) {
    const [data, setData] = useState<{ vhosts: VHost[]; cached_at: number | null; error: string | null } | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetch = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true); else setLoading(true);
        try {
            const url = refresh
                ? `/infrastructure/servers/${server.id}/nginx/refresh/`
                : `/infrastructure/servers/${server.id}/nginx/`;
            const method = refresh ? 'post' : 'get';
            const res = await (method === 'post' ? api.post(url) : api.get(url));
            setData(res.data);
        } catch (e: any) {
            setData({ vhosts: [], cached_at: null, error: e.message || 'Failed to connect' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [server.id]);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{data?.vhosts.length ?? 0} virtual hosts</span>
                <button onClick={() => fetch(true)} disabled={refreshing}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#C1FF72]/10 text-[#C1FF72] border border-[#C1FF72]/20 rounded-lg hover:bg-[#C1FF72]/20 transition-colors font-bold disabled:opacity-50">
                    <FiRefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Scanning…' : 'Refresh'}
                </button>
            </div>

            {data?.error && (
                <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    <FiAlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{data.error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-white/5 rounded-xl h-28 border border-white/5" />
                    ))
                ) : data?.vhosts.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-600 italic">No Nginx virtual hosts found</div>
                ) : (
                    data?.vhosts.map((vh, i) => (
                        <div key={i} className="bg-[#0d0d1a] border border-[#721C97]/20 rounded-xl p-4 space-y-2.5 hover:border-[#721C97]/40 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-white text-sm">{vh.server_name}</span>
                                    {vh.ssl && (
                                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                                            <FiLock className="w-2.5 h-2.5" /> SSL
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-0.5 rounded shrink-0">{vh.filename}</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {vh.listen_ports.map(p => (
                                    <span key={p} className="font-mono text-[10px] text-[#C1FF72] bg-[#C1FF72]/10 px-2 py-0.5 rounded border border-[#C1FF72]/20">
                                        :{p}
                                    </span>
                                ))}
                            </div>

                            {vh.proxy_pass && (
                                <div className="flex items-center gap-1.5 text-xs text-blue-400">
                                    <FiActivity className="w-3 h-3 shrink-0" />
                                    <span className="font-mono truncate">{vh.proxy_pass}</span>
                                </div>
                            )}
                            {vh.root && !vh.proxy_pass && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <FiLayers className="w-3 h-3 shrink-0" />
                                    <span className="font-mono truncate">{vh.root}</span>
                                </div>
                            )}

                            {vh.all_names.length > 1 && (
                                <div className="text-[10px] text-gray-600">
                                    Also: {vh.all_names.slice(1).join(', ')}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Tab: Active Websites ────────────────────────────────────────────────────

function WebsitesTab({ server }: { server: any }) {
    const [ports, setPorts] = useState<PortEntry[]>([]);
    const [vhosts, setVhosts] = useState<VHost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBoth = async () => {
            try {
                const [pRes, nRes] = await Promise.all([
                    api.get(`/infrastructure/servers/${server.id}/ports/`),
                    api.get(`/infrastructure/servers/${server.id}/nginx/`),
                ]);
                setPorts(pRes.data.ports || []);
                setVhosts(nRes.data.vhosts || []);
            } catch { }
            setLoading(false);
        };
        fetchBoth();
    }, [server.id]);

    // Build unified website list: nginx vhosts enriched with port data
    const websites = vhosts.map(vh => {
        const matchedPorts = vh.listen_ports.map(lp => {
            const portEntry = ports.find(p => p.port === lp);
            return { port: lp, process: portEntry?.process || null, label: portEntry?.label || '' };
        });
        const mainPort = matchedPorts[0];
        const scheme = vh.ssl ? 'https' : 'http';
        const portSuffix = (vh.ssl && mainPort?.port === 443) || (!vh.ssl && mainPort?.port === 80) ? '' : `:${mainPort?.port}`;
        const url = vh.server_name !== '_' ? `${scheme}://${vh.server_name}${portSuffix}` : null;
        return { vh, matchedPorts, url, mainPort };
    }).filter(w => w.vh.server_name !== '_');

    const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

    return (
        <div className="space-y-3">
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white/5 rounded-xl h-16 border border-white/5" />
                ))
            ) : websites.length === 0 ? (
                <div className="text-center py-10 text-gray-600 italic">No websites detected</div>
            ) : (
                websites.map((w, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0d0d1a] border border-[#721C97]/20 rounded-xl p-4 hover:border-[#721C97]/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${w.vh.ssl ? 'bg-emerald-400' : 'bg-yellow-500'}`} />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-white text-sm truncate">{w.vh.server_name}</span>
                                    {w.vh.ssl && <FiLock className="w-3 h-3 text-emerald-400 shrink-0" />}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {w.matchedPorts.map(mp => (
                                        <span key={mp.port} className="text-[10px] font-mono text-gray-500">
                                            :{mp.port} {mp.process && <span className="text-[#C1FF72]/70">({mp.process})</span>}
                                            {mp.label && <span className="text-[#C1FF72] ml-1">— {mp.label}</span>}
                                        </span>
                                    ))}
                                    {w.vh.proxy_pass && (
                                        <span className="text-[10px] text-blue-400">→ {w.vh.proxy_pass}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {w.url && (
                                <>
                                    <button onClick={() => copyToClipboard(w.url!)}
                                        className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                                        <FiCopy className="w-3 h-3" /> Copy
                                    </button>
                                    <a href={w.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 bg-[#C1FF72]/10 text-[#C1FF72] border border-[#C1FF72]/20 rounded-lg hover:bg-[#C1FF72]/20 transition-colors font-bold">
                                        <FiExternalLink className="w-3 h-3" /> Open
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

type Tab = 'ports' | 'nginx' | 'websites';

export default function ServerInspectModal({ server, onClose }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('ports');

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'ports', label: 'Active Ports', icon: FiActivity },
        { id: 'nginx', label: 'Nginx Sites', icon: FiGlobe },
        { id: 'websites', label: 'Active Websites', icon: FiWifi },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-[#070308] border border-[#721C97]/50 md:rounded-2xl rounded-t-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[0_0_60px_rgba(114,28,151,0.3)] animate-in slide-in-from-bottom-5">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#721C97]/30 shrink-0">
                    <div>
                        <h2 className="font-bold text-white text-lg flex items-center gap-2">
                            <FiActivity className="text-[#C1FF72]" />
                            Inspect — {server.name}
                        </h2>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">{server.ip_address} · {server.provider}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-4 pt-3 border-b border-[#721C97]/20 shrink-0">
                    {tabs.map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.id} onClick={() => setActiveTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === t.id
                                    ? 'text-[#C1FF72] border-[#C1FF72] bg-[#C1FF72]/5'
                                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>
                                <Icon className="w-4 h-4" />
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    {activeTab === 'ports' && <PortsTab server={server} />}
                    {activeTab === 'nginx' && <NginxTab server={server} />}
                    {activeTab === 'websites' && <WebsitesTab server={server} />}
                </div>
            </div>
        </div>
    );
}
