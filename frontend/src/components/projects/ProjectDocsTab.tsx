'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { FiFileText, FiLink, FiPlus, FiTrash2, FiExternalLink, FiServer, FiDownload, FiX } from 'react-icons/fi';

interface ProjectDocsTabProps {
    projectId: string;
}

export default function ProjectDocsTab({ projectId }: ProjectDocsTabProps) {
    const [docs, setDocs] = useState<any[]>([]);
    const [deliverables, setDeliverables] = useState<any[]>([]);
    const [servers, setServers] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    // Modals
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);

    const [docData, setDocData] = useState({ project: projectId, title: '', category: 'Other' });
    const [docType, setDocType] = useState('link'); // 'link' or 'file'
    const [urlLinks, setUrlLinks] = useState<string[]>(['']);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [delivData, setDelivData] = useState({ project: projectId, title: '', expected_date: '', status: 'Pending', repo_link: '', live_link: '', associated_server: '' });

    useEffect(() => {
        fetchData();
        fetchServers();
    }, [projectId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [docRes, delivRes] = await Promise.all([
                api.get(`/projects/documents/?project=${projectId}`),
                api.get(`/projects/deliverables/?project=${projectId}`)
            ]);
            setDocs(docRes.data);
            setDeliverables(delivRes.data);
        } catch (error) {
            toast.error('Failed to load documents');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchServers = () => {
        api.get('/infrastructure/servers/')
            .then(res => setServers(res.data))
            .catch(() => { });
    };

    const handleSaveDoc = async (e: React.FormEvent) => {
        e.preventDefault();

        let successCount = 0;
        setIsSaving(true);

        try {
            if (docType === 'link') {
                const validLinks = urlLinks.filter(l => l.trim() !== '');
                if (validLinks.length === 0) {
                    setIsSaving(false);
                    return toast.error('Add at least one link');
                }
                if (validLinks.length > 20) {
                    setIsSaving(false);
                    return toast.error('Maximum 20 links allowed');
                }

                for (const link of validLinks) {
                    await api.post('/projects/documents/', { ...docData, url_link: link, title: `${docData.title} [-${successCount + 1}]` });
                    successCount++;
                }
            } else {
                if (uploadFiles.length === 0) {
                    setIsSaving(false);
                    return toast.error('Select at least one file');
                }
                if (uploadFiles.length > 20) {
                    setIsSaving(false);
                    return toast.error('Maximum 20 files allowed');
                }

                for (let i = 0; i < uploadFiles.length; i++) {
                    const formData = new FormData();
                    formData.append('project', projectId);
                    formData.append('title', `${docData.title} [-${successCount + 1}]`);
                    formData.append('category', docData.category);
                    formData.append('file', uploadFiles[i]);
                    await api.post('/projects/documents/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    successCount++;
                }
            }

            toast.success(`Successfully added ${successCount} references`);
            setIsDocModalOpen(false);
            setDocData({ project: projectId, title: '', category: 'Other' });
            setUrlLinks(['']);
            setUploadFiles([]);
            fetchData();
        } catch (error) {
            toast.error(`Error after saving ${successCount} items`);
            fetchData();
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDeliverable = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/projects/deliverables/', delivData);
            toast.success('Deliverable track created');
            setIsDeliverableModalOpen(false);
            setDelivData({ project: projectId, title: '', expected_date: '', status: 'Pending', repo_link: '', live_link: '', associated_server: '' });
            fetchData();
        } catch (error) {
            toast.error('Failed to save deliverable');
        }
    };

    const handleDeleteDoc = async (id: number) => {
        if (!confirm('Delete this document?')) return;
        await api.delete(`/projects/documents/${id}/`).then(() => { toast.success('Deleted'); fetchData(); }).catch(() => toast.error('Failed to delete'));
    };

    const handleDeleteDeliv = async (id: number) => {
        if (!confirm('Delete this deliverable?')) return;
        await api.delete(`/projects/deliverables/${id}/`).then(() => { toast.success('Deleted'); fetchData(); }).catch(() => toast.error('Failed to delete'));
    };

    const updateDelivStatus = async (id: number, status: string) => {
        await api.patch(`/projects/deliverables/${id}/`, { status }).then(() => fetchData()).catch(() => toast.error('Failed to update status'));
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

            {/* Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* References & Links Sector */}
                <div className="bg-[#070308] border border-white/10 rounded-2xl p-4 md:p-5 shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex items-center gap-2 text-amber-500">
                            <FiLink className="w-5 h-5" />
                            <h3 className="text-lg font-bold text-white">External Docs & Links</h3>
                        </div>
                        <button onClick={() => setIsDocModalOpen(true)} className="w-full md:w-auto justify-center px-3 py-1.5 bg-amber-500/20 text-amber-500 border border-amber-500/50 rounded-lg font-bold hover:bg-amber-500/40 text-xs flex gap-1 items-center">
                            <FiPlus /> Add Reference
                        </button>
                    </div>

                    {isLoading ? <div className="text-center py-4 text-gray-500 italic">Loading...</div> : docs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl text-sm">No external documents logged. Add Figma links, Google Docs, etc.</div>
                    ) : (
                        <div className="space-y-3">
                            {docs.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl group hover:border-amber-500/30 transition-colors">
                                    <div className="flex flex-col">
                                        <a href={doc.file || doc.url_link} target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-amber-500 transition-colors flex items-center gap-1.5 line-clamp-1">
                                            {doc.title} {doc.file ? <FiDownload className="w-3 h-3 text-emerald-500" /> : <FiExternalLink className="w-3 h-3 text-gray-500" />}
                                        </a>
                                        <span className="text-xs text-amber-500/70">{doc.category}</span>
                                    </div>
                                    <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 text-red-500/50 hover:text-red-400 bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"><FiTrash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Major Deliverables / Repo / Servers */}
                <div className="bg-[#070308] border border-white/10 rounded-2xl p-4 md:p-5 shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex items-center gap-2 text-cyan-400">
                            <FiFileText className="w-5 h-5" />
                            <h3 className="text-lg font-bold text-white">Track Deliverables & Repos</h3>
                        </div>
                        <button onClick={() => setIsDeliverableModalOpen(true)} className="w-full md:w-auto justify-center px-3 py-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-lg font-bold hover:bg-cyan-500/40 text-xs flex gap-1 items-center">
                            <FiPlus /> Track Milestone
                        </button>
                    </div>

                    {isLoading ? <div className="text-center py-4 text-gray-500 italic">Loading...</div> : deliverables.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl text-sm">No deliverables tracked. Track repositories and live site deployments here.</div>
                    ) : (
                        <div className="space-y-4">
                            {deliverables.map(deliv => (
                                <div key={deliv.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-cyan-500/30 transition-colors group relative">
                                    <button onClick={() => handleDeleteDeliv(deliv.id)} className="absolute top-4 right-4 p-1.5 text-red-500/50 hover:text-red-400 bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all z-10"><FiTrash2 size={14} /></button>

                                    <div className="flex justify-between items-start mb-2 pr-8">
                                        <h4 className="font-bold text-white text-lg">{deliv.title}</h4>
                                        <select
                                            className={`text-xs font-bold uppercase px-2 py-1 rounded bg-[#070308] border outline-none ${deliv.status === 'Completed' ? 'text-[#C1FF72] border-[#C1FF72]/30' : 'text-gray-400 border-white/20'}`}
                                            value={deliv.status}
                                            onChange={(e) => updateDelivStatus(deliv.id, e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In-Progress">In-Progress</option>
                                            <option value="Review">Review</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4">Target: {deliv.expected_date || 'TBD'}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                        {deliv.repo_link && (
                                            <a href={deliv.repo_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 border border-blue-500/20 transition-colors truncate">
                                                <FiLink /> Repository Link
                                            </a>
                                        )}
                                        {deliv.live_link && (
                                            <a href={deliv.live_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 border border-green-500/20 transition-colors truncate">
                                                <FiExternalLink /> Live Site URL
                                            </a>
                                        )}
                                        {deliv.associated_server_details && (
                                            <div className="col-span-2 flex justify-between items-center p-2 bg-[#070308] rounded-lg border border-white/10 mt-1">
                                                <span className="text-gray-400 flex items-center gap-1"><FiServer className="text-gray-500" /> Hosted On:</span>
                                                <span className="text-cyan-400 font-bold">{deliv.associated_server_details.name} ({deliv.associated_server_details.ip_address})</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Document Creation Modal */}
            {isDocModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
                    <div className="bg-[#070308] border border-amber-500/30 md:rounded-2xl rounded-t-2xl w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_0_40px_rgba(245,158,11,0.15)] animate-in slide-in-from-bottom-5 md:slide-in-from-bottom-0 md:zoom-in-95">
                        <div className="p-4 md:p-6 border-b border-amber-500/20 sticky top-0 bg-[#070308] z-10">
                            <h2 className="text-xl font-bold text-white">Add External Reference Link</h2>
                        </div>
                        <form onSubmit={handleSaveDoc} className="p-4 md:p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Title Fragment</label>
                                <input required type="text" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white" value={docData.title} onChange={e => setDocData({ ...docData, title: e.target.value })} placeholder="e.g. Prototype Figma File" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Category</label>
                                <select className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white" value={docData.category} onChange={e => setDocData({ ...docData, category: e.target.value })}>
                                    <option value="Requirements">Requirements</option>
                                    <option value="Specs">Technical Specs</option>
                                    <option value="Design">Design Files</option>
                                    <option value="API">API Documents</option>
                                    <option value="Meeting">Meeting Notes</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="pt-2 border-t border-white/10">
                                <label className="block text-xs font-bold text-gray-400 mb-2">Upload Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                        <input type="radio" name="doctype" value="link" checked={docType === 'link'} onChange={() => setDocType('link')} className="accent-amber-500" />
                                        URL Links
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                        <input type="radio" name="doctype" value="file" checked={docType === 'file'} onChange={() => setDocType('file')} className="accent-amber-500" />
                                        File Uploads
                                    </label>
                                </div>
                            </div>

                            {docType === 'link' ? (
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Full URL strings (max 20)</label>
                                    {urlLinks.map((link, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input required type="url" className="flex-1 bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-blue-400 text-sm" value={link} onChange={e => {
                                                const newLinks = [...urlLinks];
                                                newLinks[idx] = e.target.value;
                                                setUrlLinks(newLinks);
                                            }} placeholder="https://..." />
                                            {urlLinks.length > 1 && (
                                                <button type="button" onClick={() => setUrlLinks(urlLinks.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400 px-2 rounded-lg bg-red-500/10">
                                                    <FiTrash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {urlLinks.length < 20 && (
                                        <button type="button" onClick={() => setUrlLinks([...urlLinks, ''])} className="text-xs text-amber-500 hover:text-amber-400 font-bold flex gap-1 items-center bg-amber-500/10 px-3 py-1.5 rounded mt-2">
                                            <FiPlus /> Add another link
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Files (max 20)</label>
                                    <input required type="file" multiple className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-amber-500/20 file:text-amber-500 hover:file:bg-amber-500/30" onChange={e => {
                                        if (e.target.files) {
                                            const filesArray = Array.from(e.target.files);
                                            if (filesArray.length > 20) {
                                                toast.error('You can only select up to 20 files');
                                                e.target.value = '';
                                            } else {
                                                setUploadFiles(filesArray);
                                            }
                                        }
                                    }} />
                                    {uploadFiles.length > 0 && <p className="text-xs text-gray-500 mt-2">{uploadFiles.length} file(s) selected.</p>}
                                </div>
                            )}

                            <div className="flex flex-col-reverse md:flex-row justify-end gap-2 pt-4 border-t border-white/10 mt-6 sticky bottom-0 bg-[#070308] pb-4 md:pb-0 px-4 md:px-0 -mx-4 md:mx-0">
                                <button type="button" onClick={() => { setIsDocModalOpen(false); setUrlLinks(['']); setUploadFiles([]); }} className="px-4 py-2 border border-white/10 text-white flex-1 rounded-lg hover:bg-white/5">Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-amber-500 text-[#070308] font-bold rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:bg-amber-400 flex-1">
                                    {isSaving ? 'Uploading...' : 'Save Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Deliverable Modal */}
            {isDeliverableModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
                    <div className="bg-[#070308] border border-cyan-500/30 md:rounded-2xl rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_0_40px_rgba(34,211,238,0.15)] animate-in slide-in-from-bottom-5 md:slide-in-from-bottom-0 md:zoom-in-95">
                        <div className="p-4 md:p-6 border-b border-cyan-500/20 sticky top-0 bg-[#070308] z-10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Track Major Deliverable</h2>
                            <button onClick={() => setIsDeliverableModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors"><FiX /></button>
                        </div>
                        <form onSubmit={handleSaveDeliverable} className="p-4 md:p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Deliverable Title / Goal*</label>
                                <input required type="text" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white" value={delivData.title} onChange={e => setDelivData({ ...delivData, title: e.target.value })} placeholder="e.g. Alpha Release v1.0" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Expected Delivery Date</label>
                                    <input type="date" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white" value={delivData.expected_date} onChange={e => setDelivData({ ...delivData, expected_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Initial Status</label>
                                    <select className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white" value={delivData.status} onChange={e => setDelivData({ ...delivData, status: e.target.value })}>
                                        <option value="Pending">Pending</option>
                                        <option value="In-Progress">In-Progress</option>
                                        <option value="Review">Review</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-3 pt-3 border-t border-white/10">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Code Repository URL</label>
                                    <input type="url" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white" value={delivData.repo_link} onChange={e => setDelivData({ ...delivData, repo_link: e.target.value })} placeholder="e.g. GitHub link" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Live Site / Production URL</label>
                                    <input type="url" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white" value={delivData.live_link} onChange={e => setDelivData({ ...delivData, live_link: e.target.value })} placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-cyan-400 mb-1">Hook to Infrastructure Server (Optional)</label>
                                    <select className="w-full bg-cyan-500/5 text-cyan-400 border border-cyan-500/20 rounded-lg px-3 py-2 outline-none focus:border-cyan-500" value={delivData.associated_server} onChange={e => setDelivData({ ...delivData, associated_server: e.target.value })}>
                                        <option value="">-- No linked server --</option>
                                        {servers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.ip_address})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col-reverse md:flex-row justify-end gap-2 pt-4 mt-6 border-t border-white/10 sticky bottom-0 bg-[#070308] pb-4 md:pb-0 px-4 md:px-0 -mx-4 md:mx-0">
                                <button type="button" onClick={() => setIsDeliverableModalOpen(false)} className="w-full md:w-auto px-5 py-2 border border-white/10 text-white hover:bg-white/5 transition-colors rounded-lg">Cancel</button>
                                <button type="submit" className="w-full md:w-auto px-5 py-2 bg-cyan-500 text-[#070308] font-bold rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:bg-cyan-400 opacity-90">Save Milestone</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
