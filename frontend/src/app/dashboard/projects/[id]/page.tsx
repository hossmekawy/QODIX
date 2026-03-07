'use client';
import { useState, useEffect, use } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { FiHome, FiUsers, FiCheckSquare, FiFileText, FiMessageCircle, FiDollarSign, FiClock, FiActivity } from 'react-icons/fi';
import ProjectOverviewTab from '@/components/projects/ProjectOverviewTab';
import ProjectTasksTab from '@/components/projects/ProjectTasksTab';
import ProjectTeamTab from '@/components/projects/ProjectTeamTab';
import ProjectDocsTab from '@/components/projects/ProjectDocsTab';
import ProjectFinancialsTab from '@/components/projects/ProjectFinancialsTab';
import ProjectReportTab from '@/components/projects/ProjectReportTab';
import Link from 'next/link';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const projectId = unwrappedParams.id;

    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'report' | 'overview' | 'tasks' | 'team' | 'docs' | 'financials'>('report');
    const toast = useToast();

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    const fetchProject = () => {
        setIsLoading(true);
        api.get(`/projects/projects/${projectId}/`)
            .then(res => setProject(res.data))
            .catch(() => toast.error('Failed to load project details'))
            .finally(() => setIsLoading(false));
    };

    if (isLoading) return <div className="text-center py-12 text-gray-500">Loading project data...</div>;
    if (!project) return <div className="text-center py-12 text-red-500">Project not found</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Lead': return 'text-gray-400 border-gray-500/30';
            case 'Proposal': return 'text-blue-400 border-blue-500/30';
            case 'In-Progress': return 'text-amber-500 border-amber-500/30';
            case 'Testing': return 'text-purple-400 border-purple-500/30';
            case 'Completed': return 'text-[#C1FF72] border-[#C1FF72]/30';
            default: return 'text-white border-white/20';
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20 px-4 md:px-0 pt-4 md:pt-0">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#070308] border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg relative overflow-hidden print-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] pointer-events-none rounded-full ${getStatusColor(project.status).split(' ')[0].replace('text-', 'bg-')}/10`}></div>

                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 font-bold uppercase tracking-wider">
                        <Link href="/dashboard/projects" className="hover:text-white transition-colors">Projects</Link>
                        <span>/</span>
                        <span className="text-white">{project.name}</span>
                    </div>
                    <h1 className="text-3xl font-black text-white">{project.name}</h1>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        Client: <span className="text-white font-bold">{project.customer_details?.name}</span>
                        <span className="mx-2 text-gray-700">•</span>
                        Type: <span className="text-white">{project.project_type}</span>
                    </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2 text-sm mt-4 md:mt-0 w-full md:w-auto border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
                    <span className={`px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-dashed ${getStatusColor(project.status)}`}>
                        {project.status}
                    </span>
                    <span className="text-gray-500 flex items-center gap-1 mt-1 md:mt-0"><FiClock /> Deadline: <span className="text-white">{project.deadline || 'N/A'}</span></span>
                </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex overflow-x-auto pb-2 no-scrollbar gap-2 max-w-full print-hidden">
                <button
                    onClick={() => setActiveTab('report')}
                    className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-bold transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'report' ? 'bg-[#721C97] text-white shadow-[0_0_15px_rgba(114,28,151,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5 bg-[#070308] border border-white/5'}`}
                >
                    <FiFileText className="w-4 h-4" /> Reports
                </button>
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-bold transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'overview' ? 'bg-[#C1FF72] text-[#070308] shadow-[0_0_15px_rgba(193,255,114,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5 bg-[#070308] border border-white/5'}`}
                >
                    <FiActivity className="w-4 h-4" /> Overview
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-bold transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'tasks' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5 bg-[#070308] border border-white/5'}`}
                >
                    <FiCheckSquare className="w-4 h-4" /> Tasks
                </button>
                <button
                    onClick={() => setActiveTab('team')}
                    className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-bold transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'team' ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5 bg-[#070308] border border-white/5'}`}
                >
                    <FiUsers className="w-4 h-4" /> Team
                </button>
                <button
                    onClick={() => setActiveTab('docs')}
                    className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-bold transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'docs' ? 'bg-amber-500 text-[#070308] shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5 bg-[#070308] border border-white/5'}`}
                >
                    <FiFileText className="w-4 h-4" /> Docs
                </button>
                <button
                    onClick={() => setActiveTab('financials')}
                    className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-bold transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'financials' ? 'bg-emerald-500 text-[#070308] shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5 bg-[#070308] border border-white/5'}`}
                >
                    <FiDollarSign className="w-4 h-4" /> Financials
                </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-6">
                {activeTab === 'report' && <ProjectReportTab project={project} />}
                {activeTab === 'overview' && <ProjectOverviewTab project={project} onUpdate={fetchProject} />}
                {activeTab === 'tasks' && <ProjectTasksTab projectId={project.id} />}
                {activeTab === 'team' && <ProjectTeamTab projectId={project.id} />}
                {activeTab === 'docs' && <ProjectDocsTab projectId={project.id} />}
                {activeTab === 'financials' && <ProjectFinancialsTab projectId={project.id} projectBudget={project.budget_quoted} />}
            </div>
        </div>
    );
}
