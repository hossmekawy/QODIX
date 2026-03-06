'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FiEdit2, FiTrash2, FiEye, FiShieldOff, FiShield, FiUpload } from 'react-icons/fi';
import Link from 'next/link';
import { useRef } from 'react';

interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
    last_signin: string | null;
    picture?: string;
}

export default function AccountsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<User>>({});
    const [editPreview, setEditPreview] = useState<string | null>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/accounts/users/');
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load accounts. You may not have permission.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleStatus = async (userId: number, currentStatus: boolean) => {
        try {
            await api.patch(`/accounts/users/${userId}/update/`, {
                is_active: !currentStatus
            });
            fetchUsers(); // Refresh list
        } catch (err) {
            alert('Failed to update account status.');
        }
    };

    const handleDelete = async (userId: number, userName: string) => {
        if (window.confirm(`Are you absolutely sure you want to permanently delete user ${userName}?`)) {
            try {
                await api.delete(`/accounts/users/${userId}/delete/`);
                fetchUsers(); // Refresh list
            } catch (err) {
                alert('Failed to delete account.');
            }
        }
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setEditFormData({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            username: user.username,
            role: user.role,
        });
        setEditPreview(user.picture ? `data:image/jpeg;base64,${user.picture}` : null);
    };

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setEditPreview(base64String);
                const rawBase64 = base64String.split(',')[1];
                setEditFormData({ ...editFormData, picture: rawBase64 });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            await api.patch(`/accounts/users/${editingUser.id}/update/`, editFormData);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            alert('Failed to update user.');
        }
    };

    if (loading) return <div className="p-8"><div className="animate-pulse h-8 bg-[#721C97]/30 rounded w-1/4 mb-6"></div><div className="animate-pulse h-64 bg-[#721C97]/20 rounded border border-[#721C97]/30"></div></div>;

    if (error) return <div className="p-8 text-red-400 font-medium">{error}</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-8 border-b border-[#721C97]/30 pb-4">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#C1FF72] to-[#721C97]">
                    Account Management
                </h1>
                <Link
                    href="/dashboard/accounts/new"
                    className="bg-[#721C97] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#8e23bc] transition shadow-[0_0_15px_rgba(114,28,151,0.4)] border border-[#721C97]/50"
                >
                    + Register New User
                </Link>
            </div>

            <div className="bg-[#070308] rounded-xl shadow-2xl overflow-hidden border border-[#721C97]/30 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C1FF72] rounded-full mix-blend-overlay filter blur-[100px] opacity-10 pointer-events-none"></div>

                <div className="overflow-x-auto relative z-10 p-1">
                    <table className="min-w-full divide-y divide-[#721C97]/30">
                        <thead className="bg-[#721C97]/10">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#C1FF72] uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#C1FF72] uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#C1FF72] uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#C1FF72] uppercase tracking-wider">Last Login</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-[#C1FF72] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#721C97]/20">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-[#721C97]/20 rounded-full flex items-center justify-center text-[#C1FF72] font-bold border border-[#721C97]/50 shadow-[inset_0_0_10px_rgba(193,255,114,0.1)]">
                                                {user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-white group-hover:text-[#C1FF72] transition-colors">
                                                    {user.first_name} {user.last_name}
                                                </div>
                                                <div className="text-sm text-gray-400">@{user.username} • {user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full 
                                            ${user.role === 'admin' || user.role === 'superuser' ? 'bg-[#721C97]/30 text-[#C1FF72] border border-[#721C97]' :
                                                user.role === 'manager' ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/50' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${user.is_active ? 'bg-[#C1FF72]/10 text-[#C1FF72] border-[#C1FF72]/30' : 'bg-red-900/30 text-red-400 border-red-500/30'}`}>
                                            {user.is_active ? 'Active' : 'Blocked'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                                        {user.last_signin ? new Date(user.last_signin).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/dashboard/accounts/${user.id}`} title="View Details" className="text-gray-400 hover:text-white transition-colors">
                                                <FiEye size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                title="Edit User"
                                                className="text-gray-400 hover:text-[#C1FF72] transition-colors"
                                            >
                                                <FiEdit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(user.id, user.is_active)}
                                                title={user.is_active ? "Block User" : "Unblock User"}
                                                className={`${user.is_active ? 'text-gray-400 hover:text-orange-400' : 'text-gray-400 hover:text-green-400'} transition-colors`}
                                            >
                                                {user.is_active ? <FiShieldOff size={18} /> : <FiShield size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id, user.username)}
                                                title="Delete User"
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && !loading && (
                        <div className="text-center py-12 text-gray-500">No users found.</div>
                    )}
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070308]/80 backdrop-blur-sm">
                    <div className="bg-[#070308] border border-[#721C97]/50 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_40px_rgba(114,28,151,0.2)] animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6 border-b border-[#721C97]/30 pb-4">
                            <h2 className="text-xl font-bold text-white">Edit User: <span className="text-[#C1FF72]">{editingUser.username}</span></h2>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="flex flex-col items-center mb-4">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#C1FF72] to-[#721C97] rounded-full blur group-hover:blur-md transition-all duration-300 opacity-50"></div>
                                    <div
                                        onClick={() => editFileInputRef.current?.click()}
                                        className="relative h-24 w-24 rounded-full border-2 border-[#721C97]/50 bg-[#070308] flex items-center justify-center cursor-pointer hover:border-[#C1FF72] transition-colors overflow-hidden z-10 shadow-lg"
                                    >
                                        {editPreview ? (
                                            <>
                                                <img src={editPreview} alt="Preview" className="h-full w-full object-cover" />
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                    <FiUpload className="text-[#C1FF72] text-xl mb-1" />
                                                    <span className="text-[9px] text-white font-bold tracking-widest uppercase">Change</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-[#C1FF72] transition-colors">
                                                <FiUpload className="text-2xl mb-1" />
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-center leading-tight">Upload<br />Photo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={editFileInputRef}
                                    onChange={handleEditFileChange}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.first_name || ''}
                                        onChange={e => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                        className="w-full bg-[#070308] border border-[#721C97]/30 rounded-lg px-3 py-2 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.last_name || ''}
                                        onChange={e => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                        className="w-full bg-[#070308] border border-[#721C97]/30 rounded-lg px-3 py-2 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Username</label>
                                <input
                                    type="text"
                                    value={editFormData.username || ''}
                                    onChange={e => setEditFormData({ ...editFormData, username: e.target.value })}
                                    className="w-full bg-[#070308] border border-[#721C97]/30 rounded-lg px-3 py-2 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editFormData.email || ''}
                                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="w-full bg-[#070308] border border-[#721C97]/30 rounded-lg px-3 py-2 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Role</label>
                                <select
                                    value={editFormData.role || 'user'}
                                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                                    className="w-full bg-[#070308] border border-[#721C97]/30 rounded-lg px-3 py-2 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-colors"
                                >
                                    <option value="user">Standard User</option>
                                    <option value="hr">HR</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Administrator</option>
                                    <option value="superuser">Superuser</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-[#C1FF72] text-[#070308] font-bold shadow-[0_0_15px_rgba(193,255,114,0.3)] hover:bg-[#aef556] transition-colors">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
