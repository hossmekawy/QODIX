'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { FiPlus, FiCheckSquare, FiClock, FiX, FiCheck } from 'react-icons/fi';

interface ProjectTasksTabProps {
    projectId: string;
}

export default function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        project: projectId, title: '', description: '', status: 'To-Do', priority: 'Medium', due_date: '', estimated_hours: ''
    });

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    const fetchTasks = () => {
        setIsLoading(true);
        api.get(`/projects/tasks/?project=${projectId}`)
            .then(res => setTasks(res.data))
            .catch(() => toast.error('Failed to load tasks'))
            .finally(() => setIsLoading(false));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/projects/tasks/', formData);
            toast.success('Task created successfully');
            setIsModalOpen(false);
            setFormData({ project: projectId, title: '', description: '', status: 'To-Do', priority: 'Medium', due_date: '', estimated_hours: '' });
            fetchTasks();
        } catch (error) {
            toast.error('Failed to create task');
        }
    };

    const updateTaskStatus = async (taskId: number, newStatus: string) => {
        try {
            await api.patch(`/projects/tasks/${taskId}/`, { status: newStatus });
            toast.success('Task status updated');
            fetchTasks();
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const columns = ['To-Do', 'In-Progress', 'Review', 'Completed'];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'Low': return 'text-green-500 bg-green-500/10 border-green-500/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-[#070308] border border-white/10 p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                    <FiCheckSquare className="text-blue-500 w-6 h-6" />
                    <h3 className="text-lg font-bold text-white">Work Breakdown Structure (Kanban)</h3>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <FiPlus /> New Task
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading tasks...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {columns.map(status => (
                        <div key={status} className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[300px] flex flex-col max-h-[70vh]">
                            <h4 className="font-bold text-gray-300 uppercase tracking-widest text-xs mb-4 flex justify-between items-center border-b border-white/10 pb-2">
                                <span>{status}</span>
                                <span className="bg-[#070308] px-2 py-0.5 rounded-full text-white">{tasks.filter(t => t.status === status).length}</span>
                            </h4>

                            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                                {tasks.filter(t => t.status === status).map(task => (
                                    <div key={task.id} className="bg-[#070308] border border-white/10 p-4 rounded-xl hover:border-blue-500/50 transition-colors group cursor-pointer shadow-lg">

                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                        </div>

                                        <h5 className="font-bold text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors">{task.title}</h5>

                                        <div className="flex justify-between items-center text-xs mt-4 pt-3 border-t border-white/5">
                                            <span className={new Date(task.due_date) < new Date() && task.status !== 'Completed' ? 'text-red-500 flex items-center gap-1 font-bold' : 'text-gray-500 flex items-center gap-1'}>
                                                <FiClock /> {task.due_date || 'No Date'}
                                            </span>
                                            <span className="text-gray-500 font-mono">{task.estimated_hours}h est</span>
                                        </div>

                                        {/* Status quick actions */}
                                        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {status !== 'Completed' && (
                                                <button onClick={() => updateTaskStatus(task.id, 'Completed')} className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded py-1 text-xs font-bold hover:bg-emerald-500/40 flex justify-center items-center gap-1">
                                                    <FiCheck /> Finish
                                                </button>
                                            )}
                                            {status !== 'In-Progress' && status !== 'Completed' && (
                                                <button onClick={() => updateTaskStatus(task.id, 'In-Progress')} className="flex-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded py-1 text-xs font-bold hover:bg-blue-500/40">
                                                    Start
                                                </button>
                                            )}
                                            {status === 'In-Progress' && (
                                                <button onClick={() => updateTaskStatus(task.id, 'Review')} className="flex-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded py-1 text-xs font-bold hover:bg-amber-500/40">
                                                    Review
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {tasks.filter(t => t.status === status).length === 0 && (
                                    <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-white/10 rounded-xl">No tasks here</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#070308] border border-blue-500/50 rounded-2xl w-full max-w-xl shadow-[0_0_40px_rgba(59,130,246,0.2)]">
                        <div className="p-6 border-b border-blue-500/20 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Create New Task</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors"><FiX /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Task Title*</label>
                                <input required type="text" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Implement Login API" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</label>
                                    <select className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="To-Do">To-Do</option>
                                        <option value="In-Progress">In-Progress</option>
                                        <option value="Review">Review</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Priority</label>
                                    <select className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                        <option value="Critical">Critical</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Due Date</label>
                                    <input type="date" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Hours</label>
                                    <input type="number" step="0.5" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" value={formData.estimated_hours} onChange={e => setFormData({ ...formData, estimated_hours: e.target.value })} placeholder="e.g. 4.5" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Detailed Description</label>
                                <textarea rows={4} className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-3 text-white outline-none focus:border-blue-500 transition-colors text-sm custom-scrollbar" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Task specifications..."></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-400 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
