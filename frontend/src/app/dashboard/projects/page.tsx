'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { FiActivity, FiPlus, FiBriefcase, FiClock, FiCheckCircle } from 'react-icons/fi';
import CreateProjectModal from '@/components/projects/CreateProjectModal';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = () => {
        setIsLoading(true);
        api.get('/projects/projects/')
            .then(res => setProjects(res.data))
            .catch(() => toast.error('Failed to load projects'))
            .finally(() => setIsLoading(false));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Lead': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'Proposal': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'In-Progress': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
            case 'Testing': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'Completed': return 'bg-[#C1FF72]/20 text-[#C1FF72] border-[#C1FF72]/30';
            case 'On-Hold': return 'bg-red-500/20 text-red-500 border-red-500/30';
            default: return 'bg-white/10 text-white border-white/20';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Critical': return 'text-red-500 border-red-500/50 bg-red-500/10';
            case 'High': return 'text-orange-500 border-orange-500/50 bg-orange-500/10';
            case 'Medium': return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
            case 'Low': return 'text-green-500 border-green-500/50 bg-green-500/10';
            default: return 'text-gray-400 border-gray-400/50 bg-gray-400/10';
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20 px-4 md:px-0 pt-4 md:pt-0">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#721C97]/30 pb-6 relative">
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#721C97]/20 blur-[60px] pointer-events-none rounded-full"></div>
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#C1FF72] tracking-tight">Active Projects</h1>
                    <p className="text-gray-400 mt-1">Manage deliverables, track time, and assign tasks</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#C1FF72] text-[#070308] font-bold rounded-xl shadow-[0_0_20px_rgba(193,255,114,0.3)] hover:bg-[#aef05f] hover:scale-105 transition-all w-full md:w-auto justify-center"
                >
                    <FiPlus className="w-5 h-5" /> Start New Project
                </button>
            </div>

            {/* Dashboard / Analytics (Simplified for listing) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#070308] border border-[#721C97]/30 rounded-2xl p-5 shadow-lg">
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Total</p>
                    <h3 className="text-3xl font-black text-white">{projects.length}</h3>
                </div>
                <div className="bg-[#070308] border border-amber-500/30 rounded-2xl p-5 shadow-lg">
                    <p className="text-amber-500 text-xs uppercase font-bold tracking-wider mb-1">In Progress</p>
                    <h3 className="text-3xl font-black text-amber-500">{projects.filter(p => p.status === 'In-Progress').length}</h3>
                </div>
                <div className="bg-[#070308] border border-purple-500/30 rounded-2xl p-5 shadow-lg">
                    <p className="text-purple-400 text-xs uppercase font-bold tracking-wider mb-1">Testing</p>
                    <h3 className="text-3xl font-black text-purple-400">{projects.filter(p => p.status === 'Testing').length}</h3>
                </div>
                <div className="bg-[#070308] border border-[#C1FF72]/30 rounded-2xl p-5 shadow-lg">
                    <p className="text-[#C1FF72] text-xs uppercase font-bold tracking-wider mb-1">Completed</p>
                    <h3 className="text-3xl font-black text-[#C1FF72]">{projects.filter(p => p.status === 'Completed').length}</h3>
                </div>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading projects...</div>
            ) : projects.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[#721C97]/30 rounded-3xl bg-[#070308]/50">
                    <FiActivity className="w-16 h-16 text-[#721C97]/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Projects Found</h3>
                    <p className="text-gray-400 mt-2 max-w-md mx-auto">Click "Start New Project" above to create your first client project and set up tasks.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <a
                            key={project.id}
                            href={`/dashboard/projects/${project.id}`}
                            className="bg-[#070308] border border-white/10 rounded-2xl p-5 hover:border-[#C1FF72]/50 transition-all flex flex-col group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-white text-xl group-hover:text-[#C1FF72] transition-colors">{project.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <FiBriefcase className="text-gray-500 text-xs" />
                                        <p className="text-sm text-gray-400 truncate">{project.customer_details?.name}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                            </div>

                            <div className="flex gap-2 mb-5">
                                <span className={`px-2 py-0.5 rounded text-xs border ${getPriorityColor(project.priority)}`}>
                                    {project.priority} priority
                                </span>
                                <span className="px-2 py-0.5 rounded text-xs border border-white/10 bg-white/5 text-gray-400">
                                    {project.project_type}
                                </span>
                            </div>

                            <div className="mt-auto space-y-3 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-1.5"><FiClock /> Deadline</span>
                                    <span className={new Date(project.deadline) < new Date() && project.status !== 'Completed' ? 'text-red-500 font-bold' : 'text-gray-300'}>
                                        {project.deadline || 'No deadline'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-1.5"><FiCheckCircle /> Tasks</span>
                                    <span className="text-gray-300 font-bold">{project.tasks?.filter((t: any) => t.status === 'Completed').length || 0} / {project.tasks?.length || 0}</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}

            {isCreateModalOpen && (
                <CreateProjectModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        fetchProjects();
                    }}
                />
            )}
        </div>
    );
}
