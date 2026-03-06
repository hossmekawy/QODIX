'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { FiUpload } from 'react-icons/fi';

export default function RegisterPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        pin: '',
        picture: '',
        role: 'user',
    });

    const [error, setError] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Fetch user profile to check role
    React.useEffect(() => {
        setMounted(true);
        api.get('/accounts/profile/')
            .then((res) => {
                const role = res.data.role;
                if (['admin', 'superuser', 'manager', 'hr'].includes(role)) {
                    setHasPermission(true);
                }
            })
            .catch(() => {
                // If not authenticated or error, they don't have permission
                setHasPermission(false);
            })
            .finally(() => {
                setIsCheckingRole(false);
            });
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPreview(base64String);
                // Stripping the prefix to send raw base64 data to backend
                const rawBase64 = base64String.split(',')[1];
                setFormData({ ...formData, picture: rawBase64 });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await api.post('/accounts/register/', formData);

            // Auto login only if no one is currently logged in (not an admin creating an account)
            const tokenExists = localStorage.getItem('access_token');
            if (!tokenExists) {
                const res = await api.post('/accounts/login/', {
                    username_or_email: formData.username,
                    password: formData.password,
                });
                localStorage.setItem('access_token', res.data.access);
                router.push('/dashboard/profile');
            } else {
                alert('User account created successfully!');
                router.push('/dashboard/accounts'); // Return to accounts list
            }
        } catch (err: any) {
            setError(
                err.response?.data?.username?.[0] ||
                err.response?.data?.email?.[0] ||
                'Failed to register account'
            );
        }
    };

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="mb-6 flex items-center justify-between">
                <Link href="/dashboard/accounts" className="text-[#C1FF72] hover:text-[#aef556] font-bold tracking-wide transition-colors flex items-center gap-2">
                    &larr; Back to Accounts
                </Link>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#721C97]/30 bg-[#070308] p-8 sm:p-12 shadow-[0_8px_32px_rgba(114,28,151,0.15)]">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#721C97] rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C1FF72] rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none"></div>

                <div className="relative z-10 border-b border-[#721C97]/30 pb-6 mb-8 text-center sm:text-left">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start gap-4">
                        <div className="p-2 rounded-lg bg-[#721C97]/20 text-[#C1FF72]">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        Register New Employee
                    </h2>
                    <p className="mt-3 text-sm text-gray-400 font-mono">
                        Create a securely provisioned <span className="text-[#C1FF72]">QODIX</span> account for a new staff member.
                    </p>
                </div>

                {isCheckingRole ? (
                    <div className="text-center text-[#C1FF72] py-12 font-mono flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-[#C1FF72] border-t-transparent rounded-full animate-spin"></div>
                        Authenticating clearance level...
                    </div>
                ) : !hasPermission ? (
                    <div className="text-center space-y-4 py-12">
                        <div className="text-red-400 font-bold bg-red-900/10 border border-red-500/30 p-6 rounded-xl flex flex-col items-center gap-4">
                            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            ACCESS DENIED. Administration clearance required to register new users.
                        </div>
                    </div>
                ) : (
                    <form className="relative z-10 space-y-8" onSubmit={handleRegister}>
                        {error && (
                            <div className="text-red-400 text-sm text-center font-bold bg-red-900/20 border border-red-500/30 py-3 rounded-lg shadow-inner">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col items-center mb-8">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#C1FF72] to-[#721C97] rounded-full blur group-hover:blur-md transition-all duration-300 opacity-50"></div>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative h-32 w-32 rounded-full border-2 border-[#721C97]/50 bg-[#070308] flex items-center justify-center cursor-pointer hover:border-[#C1FF72] transition-colors overflow-hidden z-10 shadow-2xl"
                                >
                                    {preview ? (
                                        <>
                                            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                <FiUpload className="text-[#C1FF72] text-2xl mb-1" />
                                                <span className="text-[10px] text-white font-bold tracking-widest uppercase">Change</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-[#C1FF72] transition-colors">
                                            <FiUpload className="text-3xl mb-2" />
                                            <span className="text-xs uppercase font-bold tracking-widest text-center leading-tight">Upload<br />Identity</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                                <input
                                    name="first_name"
                                    required
                                    className="block w-full rounded-xl border border-[#721C97]/30 bg-[#070308]/50 px-4 py-3.5 text-white placeholder-gray-600 focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] focus:outline-none transition-all shadow-inner"
                                    placeholder="Enter first name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                                <input
                                    name="last_name"
                                    required
                                    className="block w-full rounded-xl border border-[#721C97]/30 bg-[#070308]/50 px-4 py-3.5 text-white placeholder-gray-600 focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] focus:outline-none transition-all shadow-inner"
                                    placeholder="Enter last name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">System Username</label>
                                <input
                                    name="username"
                                    required
                                    className="block w-full rounded-xl border border-[#721C97]/30 bg-[#070308]/50 px-4 py-3.5 text-white placeholder-gray-600 focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] focus:outline-none transition-all shadow-inner font-mono"
                                    placeholder="username_identifier"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="block w-full rounded-xl border border-[#721C97]/30 bg-[#070308]/50 px-4 py-3.5 text-white placeholder-gray-600 focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] focus:outline-none transition-all shadow-inner"
                                    placeholder="employee@qodix.ai"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <input
                                    name="phone_number"
                                    type="tel"
                                    required
                                    className="block w-full rounded-xl border border-[#721C97]/30 bg-[#070308]/50 px-4 py-3.5 text-white placeholder-gray-600 focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] focus:outline-none transition-all shadow-inner"
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.phone_number}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex justify-between">
                                    <span>Master Password</span>
                                </label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="block w-full rounded-xl border border-[#721C97]/30 bg-[#070308]/50 px-4 py-3.5 text-white placeholder-gray-600 focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] focus:outline-none transition-all shadow-inner tracking-widest font-mono"
                                    placeholder="••••••••••••"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-[#C1FF72] uppercase tracking-widest ml-1 flex justify-between">
                                    <span>Quick Access PIN</span>
                                    <span className="text-gray-500">4-Digits</span>
                                </label>
                                <input
                                    name="pin"
                                    type="password"
                                    maxLength={4}
                                    required
                                    className="block w-full rounded-xl border border-[#C1FF72]/30 bg-[#C1FF72]/5 px-4 py-3.5 text-[#C1FF72] placeholder-[#C1FF72]/30 focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] focus:outline-none transition-all shadow-inner text-center tracking-[1em] font-mono text-xl"
                                    placeholder="••••"
                                    value={formData.pin}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Role Dropdown */}
                            {hasPermission && (
                                <div className="space-y-1 md:col-span-2">
                                    <label htmlFor="role" className="block text-xs font-bold text-[#721C97] uppercase tracking-widest ml-1">Clearance Level (Role)</label>
                                    <select
                                        id="role"
                                        name="role"
                                        className="block w-full rounded-xl border border-[#721C97] bg-[#721C97]/10 px-4 py-3.5 text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] focus:outline-none transition-all shadow-[0_0_15px_rgba(114,28,151,0.2)] appearance-none font-bold tracking-wider"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23C1FF72' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                                    >
                                        <option value="user" className="bg-[#070308] text-white">Standard User</option>
                                        <option value="hr" className="bg-[#070308] text-white border-b border-[#721C97]">Human Resources</option>
                                        <option value="manager" className="bg-[#070308] text-[#C1FF72] font-bold">Manager</option>
                                        <option value="admin" className="bg-[#070308] text-orange-400 font-bold">System Administrator</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-[#721C97] to-[#8e23bc] py-4 px-4 text-sm font-bold tracking-widest uppercase text-white hover:from-[#8e23bc] hover:to-[#a92ce0] focus:outline-none focus:ring-2 focus:ring-[#C1FF72] focus:ring-offset-2 focus:ring-offset-[#070308] transition-all shadow-[0_0_20px_rgba(114,28,151,0.5)] overflow-hidden"
                            >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                                <span className="relative z-10">Provision Secure Account</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Add the keyframes for the button shimmer effect here since we cannot easily edit global css from here */}
            <style jsx global>{`
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
}
