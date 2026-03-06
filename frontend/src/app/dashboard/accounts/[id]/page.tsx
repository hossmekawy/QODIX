'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

interface UserDetail {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    role: string;
    picture: string;
    is_active: boolean;
    last_signin: string | null;
    avg_signin: string;
}

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get(`/accounts/users/${id}/`);
                setUser(res.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load user details.');
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

    if (loading) return <div className="p-8"><div className="animate-pulse h-64 bg-gray-200 rounded"></div></div>;
    if (error || !user) return <div className="p-8 text-red-500 font-medium">{error || 'User not found'}</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="mb-6 flex items-center justify-between">
                <Link href="/dashboard/accounts" className="text-[#C1FF72] hover:text-[#aef556] font-bold tracking-wide transition-colors flex items-center gap-2">
                    &larr; Back to Accounts
                </Link>
                <div className="text-sm font-mono text-[#721C97] font-bold tracking-widest">
                    ID: {user.id}
                </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#721C97]/30 bg-[#070308] shadow-[0_8px_32px_rgba(114,28,151,0.15)]">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#721C97] rounded-full mix-blend-screen filter blur-[80px] opacity-20 pointer-events-none"></div>

                <div className="p-8 border-b border-[#721C97]/30 flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#C1FF72] to-[#721C97] rounded-full blur group-hover:blur-md transition-all duration-300 opacity-70"></div>
                        {user.picture ? (
                            <img
                                src={`data:image/jpeg;base64,${user.picture}`}
                                alt={`${user.username}'s profile`}
                                className="relative w-32 h-32 rounded-full object-cover shadow-2xl border-2 border-[#070308] z-10"
                            />
                        ) : (
                            <div className="relative flex w-32 h-32 items-center justify-center rounded-full bg-[#070308] text-5xl font-bold text-[#C1FF72] shadow-2xl border-2 border-[#721C97] z-10">
                                {user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">{user.first_name} {user.last_name}</h1>
                        <p className="text-lg text-gray-400 font-mono">@{user.username}</p>

                        <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                            <span className="px-4 py-1 border border-[#721C97]/50 bg-[#721C97]/20 text-[#C1FF72] shadow-[inset_0_0_10px_rgba(114,28,151,0.2)] rounded-full text-sm font-bold uppercase tracking-wider">
                                Role: {user.role}
                            </span>
                            <span className={`px-4 py-1 border rounded-full text-sm font-bold uppercase tracking-wider shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] ${user.is_active ? 'bg-[#C1FF72]/10 text-[#C1FF72] border-[#C1FF72]/30' : 'bg-red-900/30 text-red-400 border-red-500/30'}`}>
                                Status: {user.is_active ? 'Active' : 'Blocked'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8 relative z-10">
                    <h3 className="text-lg font-bold text-[#C1FF72] uppercase tracking-widest mb-6 flex items-center gap-3">
                        <span className="w-8 h-px bg-[#721C97]"></span>
                        Contact Information
                        <span className="flex-1 h-px bg-[#721C97]/30"></span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="rounded-xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Email Address</p>
                            <p className="text-lg text-white font-medium">{user.email}</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Phone Number</p>
                            <p className="text-lg text-white font-medium">{user.phone_number || 'N/A'}</p>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#C1FF72] uppercase tracking-widest mb-6 flex items-center gap-3">
                        <span className="w-8 h-px bg-[#721C97]"></span>
                        Security & Telemetry
                        <span className="flex-1 h-px bg-[#721C97]/30"></span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Last Sign-in</p>
                            <p className="text-lg font-medium text-white">
                                {user.last_signin ? new Date(user.last_signin).toLocaleString() : 'Never'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#721C97]/10 p-5 backdrop-blur-sm">
                            <p className="text-xs text-[#C1FF72] font-bold uppercase tracking-wider mb-1">Avg Time Between Logins</p>
                            <p className="text-2xl font-bold text-white tracking-widest">
                                {user.avg_signin}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
