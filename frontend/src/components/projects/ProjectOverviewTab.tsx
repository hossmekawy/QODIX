import { useState } from 'react';
import { FiClock, FiDollarSign, FiCheckCircle, FiActivity, FiTarget, FiAlertCircle, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface ProjectOverviewTabProps {
    project: any;
    onUpdate?: () => void;
}

export default function ProjectOverviewTab({ project, onUpdate }: ProjectOverviewTabProps) {
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form logic for scope editor
    const [editForm, setEditForm] = useState({
        description: project?.description || '',
        scope: project?.scope || '',
        start_date: project?.start_date || '',
        deadline: project?.deadline || '',
        payment_terms: project?.payment_terms || ''
    });

    const handleSaveInfo = async () => {
        setIsSaving(true);
        try {
            await api.patch(`/projects/projects/${project.id}/`, editForm);
            setIsEditing(false);
            if (onUpdate) onUpdate();
            toast.success("Project information updated successfully.");
        } catch (error) {
            toast.error("Failed to update project information.");
        } finally {
            setIsSaving(false);
        }
    };
    const totalTasks = project.tasks?.length || 0;
    const completedTasks = project.tasks?.filter((t: any) => t.status === 'Completed').length || 0;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalEstimatedHours = project.tasks?.reduce((sum: number, task: any) => sum + parseFloat(task.estimated_hours || 0), 0) || 0;
    const totalActualHours = project.tasks?.reduce((sum: number, task: any) => sum + parseFloat(task.actual_hours || 0), 0) || 0;

    const paidAmount = project.payments?.filter((p: any) => p.status === 'Paid').reduce((sum: number, pay: any) => sum + parseFloat(pay.amount || 0), 0) || 0;
    const budgetQuoted = parseFloat(project.budget_quoted || 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#070308] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#C1FF72]/10 rounded-full group-hover:scale-150 transition-transform"></div>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Project Progress</p>
                        <FiActivity className="text-[#C1FF72]" />
                    </div>
                    <h3 className="text-3xl font-black text-white">{progressPercent}%</h3>
                    <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden border border-white/5">
                        <div className="bg-[#C1FF72] h-full rounded-full" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{completedTasks} of {totalTasks} tasks completed</p>
                </div>

                <div className="bg-[#070308] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform"></div>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Time Tracking</p>
                        <FiClock className="text-blue-500" />
                    </div>
                    <h3 className="text-3xl font-black text-white">{totalActualHours}<span className="text-base text-gray-500 font-normal"> / {totalEstimatedHours}h</span></h3>
                    <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden border border-white/5">
                        <div className={`h-full rounded-full ${totalActualHours > totalEstimatedHours ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((totalActualHours / (totalEstimatedHours || 1)) * 100, 100)}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Logged vs Estimated Hours</p>
                </div>

                <div className="bg-[#070308] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform"></div>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Financials (Received)</p>
                        <FiDollarSign className="text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-white">${paidAmount.toLocaleString()}</h3>
                    <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden border border-white/5">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min((paidAmount / (budgetQuoted || 1)) * 100, 100)}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Of ${budgetQuoted.toLocaleString()} Total Quoted Budget</p>
                </div>

                <div className="bg-[#070308] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full group-hover:scale-150 transition-transform"></div>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Open Bugs</p>
                        <FiAlertCircle className="text-amber-500" />
                    </div>
                    <h3 className="text-3xl font-black text-white">{project.bugs?.filter((b: any) => b.status === 'Open' || b.status === 'In-Progress').length || 0}</h3>
                    <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">Requires Attention</p>
                </div>
            </div>

            {/* Content Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Scope & Details */}
                <div className="bg-[#070308] border border-white/10 rounded-2xl p-6 shadow-lg relative print-break-avoid">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-purple-500 rounded-full"></div> Project Scope Definition
                        </h3>
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold">
                                <FiEdit2 /> Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button disabled={isSaving} onClick={handleSaveInfo} className="text-[#070308] bg-[#C1FF72] hover:bg-[#aef05f] p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold shadow-[0_0_10px_rgba(193,255,114,0.2)]">
                                    <FiCheck /> {isSaving ? 'Saving' : 'Save'}
                                </button>
                                <button disabled={isSaving} onClick={() => {
                                    setIsEditing(false);
                                    setEditForm({
                                        description: project?.description || '',
                                        scope: project?.scope || '',
                                        start_date: project?.start_date || '',
                                        deadline: project?.deadline || '',
                                        payment_terms: project?.payment_terms || ''
                                    });
                                }} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold">
                                    <FiX /> Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Brief Description</p>
                            {isEditing ? (
                                <textarea rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 custom-scrollbar text-sm" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                            ) : (
                                <p className="text-gray-300 text-sm leading-relaxed">{project.description || 'No description provided.'}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Technical Scope</p>
                            {isEditing ? (
                                <textarea rows={5} className="w-full bg-[#070308] border border-white/10 rounded-lg px-3 py-2 text-gray-300 outline-none focus:border-purple-500 custom-scrollbar text-sm font-mono" value={editForm.scope} onChange={e => setEditForm({ ...editForm, scope: e.target.value })} />
                            ) : (
                                <div className="bg-white/5 border border-white/10 p-4 rounded-xl max-h-64 overflow-y-auto custom-scrollbar">
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{project.scope || 'No technical scope defined.'}</p>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Start Date</p>
                                {isEditing ? (
                                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 text-sm" value={editForm.start_date || ''} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} />
                                ) : (
                                    <p className="text-white font-bold">{project.start_date || 'TBD'}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Deadline</p>
                                {isEditing ? (
                                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 text-sm" value={editForm.deadline || ''} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} />
                                ) : (
                                    <p className={new Date(project.deadline) < new Date() && project.status !== 'Completed' ? 'text-red-500 font-bold' : 'text-white font-bold'}>
                                        {project.deadline || 'TBD'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Milestones / Payment Terms */}
                <div className="bg-[#070308] border border-white/10 rounded-2xl p-6 shadow-lg print-break-avoid">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div> Deliverables & Milestones
                    </h3>

                    <div className="space-y-4">
                        {project.deliverables?.length === 0 ? (
                            <div className="text-center py-6 bg-white/5 border border-dashed border-white/10 rounded-xl px-4 text-sm text-gray-400">
                                No specific deliverables or milestones tracked yet. Head to "Docs & Deliverables" to add them.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {project.deliverables?.slice(0, 4).map((deliverable: any) => (
                                    <div key={deliverable.id} className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {deliverable.status === 'Completed' ? (
                                                <FiCheckCircle className="text-[#C1FF72]" />
                                            ) : (
                                                <FiTarget className="text-gray-500" />
                                            )}
                                            <span className="text-sm text-gray-300 font-bold">{deliverable.title}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{deliverable.expected_date || 'TBD'}</span>
                                    </div>
                                ))}
                                {project.deliverables?.length > 4 && (
                                    <p className="text-xs text-center text-gray-500 pt-2">+ {project.deliverables.length - 4} more deliverables</p>
                                )}
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/10 mt-6 relative">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Contract / Payment Terms</p>
                                {isEditing && <span className="text-xs text-purple-400 animate-pulse">Editable</span>}
                            </div>

                            {isEditing ? (
                                <textarea rows={4} className="w-full bg-[#070308] border border-amber-500/50 rounded-lg px-3 py-2 text-amber-500 outline-none focus:border-amber-500 custom-scrollbar text-sm" value={editForm.payment_terms} onChange={e => setEditForm({ ...editForm, payment_terms: e.target.value })} />
                            ) : (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-sm whitespace-pre-wrap text-amber-500 max-h-32 overflow-y-auto custom-scrollbar">
                                    {project.payment_terms || 'No payment terms documented.'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
