'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { FiUsers, FiUserPlus, FiTrash2, FiClock, FiX } from 'react-icons/fi';

interface ProjectTeamTabProps {
    projectId: string;
}

export default function ProjectTeamTab({ projectId }: ProjectTeamTabProps) {
    const [team, setTeam] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        project: projectId, user: '', role: '', allocation_hours: ''
    });

    useEffect(() => {
        fetchTeam();
        fetchAllUsers();
    }, [projectId]);

    const fetchTeam = () => {
        setIsLoading(true);
        api.get(`/projects/team-members/?project=${projectId}`)
            .then(res => setTeam(res.data))
            .catch(() => toast.error('Failed to load team assignment'))
            .finally(() => setIsLoading(false));
    };

    const fetchAllUsers = () => {
        api.get('/accounts/users/')
            .then(res => setAllUsers(res.data.results || res.data))
            .catch(() => { });
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/projects/team-members/', formData);
            toast.success('Team member assigned');
            setIsModalOpen(false);
            setFormData({ project: projectId, user: '', role: '', allocation_hours: '' });
            fetchTeam();
        } catch (error: any) {
            toast.error(error.response?.data?.non_field_errors?.[0] || 'Failed to assign team member');
        }
    };

    const handleRemove = async (id: number) => {
        if (!confirm('Remove this member from the project?')) return;
        try {
            await api.delete(`/projects/team-members/${id}/`);
            toast.success('Member removed');
            fetchTeam();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#070308] border border-white/10 p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                    <FiUsers className="text-purple-500 w-6 h-6" />
                    <div>
                        <h3 className="text-lg font-bold text-white">Project Team</h3>
                        <p className="text-xs text-gray-400">Manage resource allocation and roles</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto justify-center px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/50 font-bold rounded-lg hover:bg-purple-500/40 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    <FiUserPlus /> Assign Member
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading team...</div>
            ) : team.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl bg-[#070308]/50">
                    <FiUsers className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Team Assigned</h3>
                    <p className="text-gray-400 mt-2">Click "Assign Member" to add users to this project.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {team.map(member => (
                        <div key={member.id} className="bg-[#070308] border border-white/10 p-5 rounded-2xl flex items-center gap-4 relative group hover:border-purple-500/50 transition-colors shadow-lg">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                                {member.user_details?.picture ? (
                                    <img src={member.user_details.picture} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <FiUsers className="text-gray-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white text-lg truncate">
                                    {member.user_details?.first_name} {member.user_details?.last_name}
                                </h4>
                                <p className="text-sm text-purple-400 font-bold truncate">{member.role || 'Unspecified Role'}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <FiClock /> {member.allocation_hours}h allocated
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemove(member.id)}
                                className="absolute top-4 right-4 p-2 text-red-500/50 hover:text-red-400 bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
                    <div className="bg-[#070308] border border-purple-500/30 md:rounded-2xl rounded-t-2xl w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_0_40px_rgba(168,85,247,0.15)] animate-in slide-in-from-bottom-5 md:slide-in-from-bottom-0 md:zoom-in-95">
                        <div className="p-4 md:p-6 border-b border-purple-500/20 flex justify-between items-center bg-purple-500/5 sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-white">Assign Team Member</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 p-1.5 rounded-lg"><FiX /></button>
                        </div>
                        <form onSubmit={handleAssign} className="p-4 md:p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Select User*</label>
                                <select required className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500" value={formData.user} onChange={e => setFormData({ ...formData, user: e.target.value })}>
                                    <option value="" disabled>-- Select System User --</option>
                                    {allUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Project Role</label>
                                <input type="text" required className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="e.g. Lead Designer" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Time Allocation (Hours)</label>
                                <input type="number" step="0.5" className="w-full bg-[#070308] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500" value={formData.allocation_hours} onChange={e => setFormData({ ...formData, allocation_hours: e.target.value })} placeholder="0.0" />
                            </div>
                            <div className="pt-4 flex flex-col justify-end sticky bottom-0 bg-[#070308] pb-4 md:pb-0">
                                <button type="submit" className="px-6 py-2.5 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400 transition-colors w-full shadow-[0_0_15px_rgba(168,85,247,0.3)]">Add to Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
