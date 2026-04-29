'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import {
    FiActivity, FiRefreshCw, FiSearch, FiFilter,
    FiAlertTriangle, FiTag, FiCheck, FiServer, FiChevronDown, FiChevronRight
} from 'react-icons/fi';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface ServerResult {
    server_id: number;
    server_name: string;
    ip_address: string;
    provider: string;
    ports: PortEntry[];
    cached_at: number | null;
    error: string | null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock() {
    return (
        <div className="animate-pulse space-y-2 bg-[#070308] border border-white/5 rounded-xl p-4">
            <div className="h-4 bg-white/10 rounded w-1/3" />
            <div className="space-y-2 mt-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-10 bg-white/5 rounded" />
                ))}
            </div>
        </div>
    );
}

// ─── Inline Label Editor ──────────────────────────────────────────────────────

function LabelCell({ serverId, port, initialLabel, initialNotes, onSaved }: {
    serverId: number; port: number; initialLabel: string; initialNotes: string;
    onSaved: (label: string, notes: string) => void;
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
            onSaved(label, notes);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch { }
        setSaving(false);
        setEditing(false);
    };

    if (editing) {
        return (
            <td className="px-4 py-2 min-w-[220px]">
                <div className="space-y-1">
                    <input autoFocus value={label} onChange={e => setLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                        placeholder="Label…"
                        className="w-full bg-[#0a0a14] border border-[#C1FF72]/50 text-white text-xs px-2 py-1.5 rounded outline-none font-mono" />
                    <input value={notes} onChange={e => setNotes(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                        placeholder="Notes…"
                        className="w-full bg-[#0a0a14] border border-white/10 text-gray-400 text-xs px-2 py-1 rounded outline-none" />
                    <div className="flex gap-1">
                        <button onClick={save} disabled={saving}
                            className="flex-1 text-[10px] py-1 bg-[#C1FF72]/20 text-[#C1FF72] rounded hover:bg-[#C1FF72]/30 font-bold transition-colors">
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
        <td className="px-4 py-3 cursor-pointer group/lc" onDoubleClick={() => setEditing(true)} title="Double-click to edit label">
            <div className="flex items-center gap-2">
                {saved && <FiCheck className="w-3 h-3 text-[#C1FF72] shrink-0" />}
                {label ? (
                    <span className="text-xs font-mono text-[#C1FF72] bg-[#C1FF72]/10 border border-[#C1FF72]/20 px-2 py-0.5 rounded">
                        {label}
                    </span>
                ) : (
                    <span className="text-xs text-gray-700 italic group-hover/lc:text-gray-500 flex items-center gap-1">
                        <FiTag className="w-3 h-3" /> add label…
                    </span>
                )}
            </div>
            {notes && <p className="text-[10px] text-gray-600 mt-0.5 truncate max-w-[180px]">{notes}</p>}
        </td>
    );
}

// ─── Server Group ─────────────────────────────────────────────────────────────

function ServerGroup({ result, filterPort, filterProcess, filterLabeled, onPortUpdated }: {
    result: ServerResult;
    filterPort: string;
    filterProcess: string;
    filterLabeled: 'all' | 'labeled' | 'unlabeled';
    onPortUpdated: (serverId: number, port: number, label: string, notes: string) => void;
}) {
    const [collapsed, setCollapsed] = useState(false);

    const filteredPorts = useMemo(() => {
        return result.ports.filter(p => {
            if (filterPort) {
                const range = filterPort.split('-').map(Number);
                if (range.length === 2) {
                    if (p.port < range[0] || p.port > range[1]) return false;
                } else {
                    if (!String(p.port).includes(filterPort)) return false;
                }
            }
            if (filterProcess && !p.process.toLowerCase().includes(filterProcess.toLowerCase())) return false;
            if (filterLabeled === 'labeled' && !p.label) return false;
            if (filterLabeled === 'unlabeled' && p.label) return false;
            return true;
        });
    }, [result.ports, filterPort, filterProcess, filterLabeled]);

    const labeledCount = result.ports.filter(p => p.label).length;
    const totalCount = result.ports.length;

    return (
        <div className="bg-[#070308] border border-[#721C97]/30 rounded-xl overflow-hidden">
            {/* Server header */}
            <button onClick={() => setCollapsed(c => !c)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left">
                <div className="flex items-center gap-3">
                    {collapsed ? <FiChevronRight className="w-4 h-4 text-gray-500 shrink-0" /> : <FiChevronDown className="w-4 h-4 text-[#C1FF72] shrink-0" />}
                    <FiServer className="w-4 h-4 text-[#721C97] shrink-0" />
                    <div>
                        <span className="font-bold text-white text-sm">{result.server_name}</span>
                        <span className="font-mono text-xs text-gray-500 ml-2">{result.ip_address}</span>
                        <span className="text-xs text-gray-600 ml-2">· {result.provider}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {result.error ? (
                        <span className="flex items-center gap-1 text-xs text-red-400 bg-red-900/20 border border-red-500/20 px-2 py-0.5 rounded">
                            <FiAlertTriangle className="w-3 h-3" /> Unreachable
                        </span>
                    ) : (
                        <>
                            <span className="text-xs text-gray-500">{filteredPorts.length}/{totalCount} ports</span>
                            <span className={`text-xs px-2 py-0.5 rounded border font-mono ${labeledCount === totalCount && totalCount > 0
                                ? 'text-[#C1FF72] bg-[#C1FF72]/10 border-[#C1FF72]/20'
                                : 'text-gray-500 bg-white/5 border-white/10'}`}>
                                {labeledCount}/{totalCount} labeled
                            </span>
                        </>
                    )}
                    {result.cached_at && (
                        <span className="text-[10px] text-gray-700 hidden md:block">
                            {new Date(result.cached_at * 1000).toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </button>

            {!collapsed && (
                <>
                    {result.error && (
                        <div className="mx-4 mb-4 flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            <FiAlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{result.error}</span>
                        </div>
                    )}
                    {!result.error && (
                        <div className="overflow-x-auto border-t border-white/5">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#0a0a14] text-xs text-gray-600 uppercase tracking-widest text-left">
                                        <th className="px-4 py-2.5 font-bold">Port</th>
                                        <th className="px-4 py-2.5 font-bold">Process</th>
                                        <th className="px-4 py-2.5 font-bold hidden md:table-cell">PID</th>
                                        <th className="px-4 py-2.5 font-bold hidden md:table-cell">Address</th>
                                        <th className="px-4 py-2.5 font-bold">Label <span className="normal-case text-gray-700">(dbl-click)</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPorts.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-6 text-gray-700 italic text-xs">No ports match filters</td></tr>
                                    ) : filteredPorts.map(p => (
                                        <tr key={p.port} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-mono font-bold text-[#C1FF72] text-base">{p.port}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-white bg-white/5 px-2 py-1 rounded">{p.process}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 font-mono text-xs hidden md:table-cell">{p.pid}</td>
                                            <td className="px-4 py-3 text-gray-600 font-mono text-xs hidden md:table-cell">{p.local_address}</td>
                                            <LabelCell
                                                serverId={result.server_id}
                                                port={p.port}
                                                initialLabel={p.label}
                                                initialNotes={p.notes}
                                                onSaved={(label, notes) => onPortUpdated(result.server_id, p.port, label, notes)}
                                            />
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PortMapPage() {
    const [results, setResults] = useState<ServerResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    // Filters
    const [filterServer, setFilterServer] = useState('');
    const [filterPort, setFilterPort] = useState('');
    const [filterProcess, setFilterProcess] = useState('');
    const [filterLabeled, setFilterLabeled] = useState<'all' | 'labeled' | 'unlabeled'>('all');

    const fetchAll = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await api.get(`/infrastructure/ports/all/${refresh ? '?refresh=1' : ''}`);
            setResults(res.data);
            setLastRefresh(new Date());
        } catch (e) {
            console.error('Failed to load port data', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handlePortUpdated = useCallback((serverId: number, port: number, label: string, notes: string) => {
        setResults(prev => prev.map(r => {
            if (r.server_id !== serverId) return r;
            return {
                ...r,
                ports: r.ports.map(p => p.port === port ? { ...p, label, notes } : p)
            };
        }));
    }, []);

    const filteredResults = useMemo(() =>
        results.filter(r => !filterServer || r.server_name.toLowerCase().includes(filterServer.toLowerCase())),
        [results, filterServer]
    );

    // Stats
    const totalPorts = results.reduce((s, r) => s + r.ports.length, 0);
    const labeledPorts = results.reduce((s, r) => s + r.ports.filter(p => p.label).length, 0);
    const unreachable = results.filter(r => r.error).length;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-10 px-4 md:px-0 mt-4 md:mt-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#721C97]/30 pb-4 md:pb-6 relative">
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#C1FF72]/5 blur-[80px] pointer-events-none rounded-full" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#C1FF72] tracking-tight flex items-center gap-3">
                        <FiActivity className="text-[#C1FF72] text-2xl" />
                        Port Map
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Live port intelligence across all active servers
                        {lastRefresh && (
                            <span className="ml-2 text-gray-700">· last scan {lastRefresh.toLocaleTimeString()}</span>
                        )}
                    </p>
                </div>
                <button onClick={() => fetchAll(true)} disabled={loading || refreshing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#C1FF72] text-[#070308] rounded-xl hover:bg-[#aef552] transition-colors font-bold shadow-[0_0_20px_rgba(193,255,114,0.2)] disabled:opacity-50 shrink-0">
                    <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Scanning…' : 'Refresh All'}
                </button>
            </div>

            {/* Stats row */}
            {!loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Active Servers', value: results.length, color: 'text-white' },
                        { label: 'Total Ports', value: totalPorts, color: 'text-[#C1FF72]' },
                        { label: 'Labeled', value: labeledPorts, color: 'text-blue-400' },
                        { label: 'Unlabeled', value: totalPorts - labeledPorts, color: 'text-yellow-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-[#070308] border border-[#721C97]/20 rounded-xl p-4 text-center">
                            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                            <div className="text-xs text-gray-600 mt-1 font-bold uppercase tracking-widest">{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2 bg-[#070308] border border-[#721C97]/20 rounded-xl p-3">
                <div className="relative flex-1 min-w-[140px]">
                    <FiServer className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 w-3.5 h-3.5" />
                    <input value={filterServer} onChange={e => setFilterServer(e.target.value)}
                        placeholder="Filter server…"
                        className="w-full bg-[#0a0a14] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-[#721C97]/50 placeholder-gray-700" />
                </div>
                <div className="relative flex-1 min-w-[120px]">
                    <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 w-3.5 h-3.5" />
                    <input value={filterPort} onChange={e => setFilterPort(e.target.value)}
                        placeholder="Port / range (e.g. 8000-9000)"
                        className="w-full bg-[#0a0a14] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white font-mono outline-none focus:border-[#721C97]/50 placeholder-gray-700" />
                </div>
                <div className="relative flex-1 min-w-[120px]">
                    <FiFilter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 w-3.5 h-3.5" />
                    <input value={filterProcess} onChange={e => setFilterProcess(e.target.value)}
                        placeholder="Filter process…"
                        className="w-full bg-[#0a0a14] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-[#721C97]/50 placeholder-gray-700" />
                </div>
                <div className="flex rounded-lg overflow-hidden border border-white/10 shrink-0">
                    {(['all', 'labeled', 'unlabeled'] as const).map(v => (
                        <button key={v} onClick={() => setFilterLabeled(v)}
                            className={`px-3 py-2 text-xs font-bold capitalize transition-colors ${filterLabeled === v
                                ? 'bg-[#C1FF72]/20 text-[#C1FF72]'
                                : 'bg-[#0a0a14] text-gray-500 hover:text-gray-300'}`}>
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
                {loading ? (
                    Array.from({ length: 2 }).map((_, i) => <SkeletonBlock key={i} />)
                ) : filteredResults.length === 0 ? (
                    <div className="text-center py-16 text-gray-600">
                        <FiActivity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No active servers found. Add servers in Infrastructure first.</p>
                    </div>
                ) : (
                    filteredResults.map(result => (
                        <ServerGroup
                            key={result.server_id}
                            result={result}
                            filterPort={filterPort}
                            filterProcess={filterProcess}
                            filterLabeled={filterLabeled}
                            onPortUpdated={handlePortUpdated}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
