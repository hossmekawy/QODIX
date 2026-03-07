'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

export default function LoginPage() {
    const [method, setMethod] = useState<'password' | 'pin'>('password');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const toast = useToast();

    useEffect(() => {
        setMounted(true);
        // If user is already logged in, redirect to dashboard
        const token = localStorage.getItem('access_token');
        if (token) {
            router.replace('/dashboard');
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (method === 'password') {
                const res = await api.post('/accounts/login/', {
                    username_or_email: identifier,
                    password,
                });
                localStorage.setItem('access_token', res.data.access);
                router.push('/dashboard');
            } else {
                const res = await api.post('/accounts/pin-login/', {
                    username_or_email: identifier,
                    pin,
                });
                localStorage.setItem('access_token', res.data.access);
                toast.success('Successfully logged in.');
                router.push('/dashboard');
            }
        } catch (err: any) {
            const data = err.response?.data;

            // Extract specific error message from the backend
            let errorMsg = 'Something went wrong. Please try again.';
            let errorType: 'error' | 'warning' = 'error';

            if (data) {
                // DRF wraps serializer validation errors in non_field_errors
                const fieldErrors = data.non_field_errors;
                if (fieldErrors && Array.isArray(fieldErrors)) {
                    // New format: non_field_errors contains objects with error/message
                    const firstError = fieldErrors[0];
                    if (typeof firstError === 'object' && firstError.message) {
                        errorMsg = firstError.message;
                        if (firstError.error === 'account_disabled') errorType = 'warning';
                    } else if (typeof firstError === 'string') {
                        errorMsg = firstError;
                    }
                } else if (data.detail) {
                    errorMsg = data.detail;
                } else if (data.message) {
                    errorMsg = data.message;
                }
            }

            if (err.response?.status === 0 || !err.response) {
                errorMsg = 'Cannot connect to server. Please check your connection.';
            }

            toast[errorType](errorMsg);
        }
    };

    if (!mounted) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"></div>;
    }

    return (
        <div className="flex min-h-screen bg-[#070308]">
            {/* Left side - Image/Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden border-r border-[#721C97]/20">
                <div className="absolute inset-0 bg-gradient-to-br from-[#070308] via-[#721C97]/30 to-[#070308] opacity-90"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay opacity-40 filter grayscale"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>

                {/* Decorative neon blobs */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#721C97] rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#C1FF72] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse delay-1000"></div>

                <div className="relative z-10 px-12 text-white max-w-2xl">
                    <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1FF72] to-[#721C97] animate-pulse">QODIX Agency</span>.
                    </h1>
                    <p className="text-xl text-gray-300 mb-8 leading-relaxed font-light">
                        A centralized portal for managing your enterprise resources. Secure, fast, and designed for modern teams.
                    </p>
                    <div className="flex items-center space-x-4 text-sm font-medium text-gray-400">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-[#721C97] border-2 border-[#070308]"></div>
                            <div className="w-8 h-8 rounded-full bg-[#C1FF72] border-2 border-[#070308]"></div>
                            <div className="w-8 h-8 rounded-full border-2 border-[#C1FF72] flex items-center justify-center bg-[#070308]">
                                <span className="text-[#C1FF72] text-[10px]">+</span>
                            </div>
                        </div>
                        <span>Join 2,000+ professionals</span>
                    </div>
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-[#070308] relative">
                {/* Mobile Background (only visible on small screens) */}
                <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-[#070308] via-[#721C97]/30 to-[#070308]"></div>
                <div className="absolute inset-0 lg:hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="mx-auto w-full max-w-sm lg:max-w-md relative z-10">
                    {/* Glassmorphism wrapper for mobile, flat dark for desktop */}
                    <div className="bg-[#070308]/60 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none p-8 lg:p-0 rounded-2xl lg:rounded-none shadow-2xl lg:shadow-none border border-white/5 lg:border-none">

                        <div className="text-left mb-10">
                            <div className="inline-block p-2 rounded-lg bg-[#721C97]/20 border border-[#721C97]/30 mb-4 lg:hidden">
                                <span className="text-[#C1FF72] font-bold text-xl tracking-widest">QODIX</span>
                            </div>
                            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                                Sign in
                            </h2>
                            <p className="text-sm text-gray-400">
                                Enter your details to securely access your account.
                            </p>
                        </div>

                        <div className="flex space-x-1 border-b border-[#721C97]/30 mb-8 p-1 bg-[#721C97]/10 rounded-lg">
                            <button
                                onClick={() => setMethod('password')}
                                type="button"
                                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${method === 'password'
                                    ? 'bg-[#C1FF72] text-[#070308] shadow-[0_0_15px_rgba(193,255,114,0.3)]'
                                    : 'text-gray-400 hover:text-[#C1FF72] hover:bg-white/5'
                                    }`}
                            >
                                Password
                            </button>
                            <button
                                onClick={() => setMethod('pin')}
                                type="button"
                                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${method === 'pin'
                                    ? 'bg-[#C1FF72] text-[#070308] shadow-[0_0_15px_rgba(193,255,114,0.3)]'
                                    : 'text-gray-400 hover:text-[#C1FF72] hover:bg-white/5'
                                    }`}
                            >
                                Quick PIN
                            </button>
                        </div>

                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="identifier" className="block text-sm font-medium text-gray-300 mb-1">
                                        Username or Email
                                    </label>
                                    <input
                                        id="identifier"
                                        name="identifier"
                                        type="text"
                                        required
                                        className="block w-full rounded-xl border border-[#721C97]/30 bg-[#070308] px-4 py-3.5 text-white placeholder-gray-600 focus:border-[#C1FF72] focus:bg-[#721C97]/10 focus:ring-2 focus:ring-[#C1FF72]/20 sm:text-sm transition-all shadow-inner"
                                        placeholder="admin@qodix.ai"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                    />
                                </div>

                                {method === 'password' ? (
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            className="block w-full rounded-xl border border-[#721C97]/30 bg-[#070308] px-4 py-3.5 text-white placeholder-gray-600 focus:border-[#C1FF72] focus:bg-[#721C97]/10 focus:ring-2 focus:ring-[#C1FF72]/20 sm:text-sm transition-all shadow-inner"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label htmlFor="pin" className="block text-sm font-medium text-gray-300 mb-1">
                                            Secure PIN
                                        </label>
                                        <input
                                            id="pin"
                                            name="pin"
                                            type="password"
                                            required
                                            maxLength={10}
                                            className="block w-full tracking-[1em] text-center text-xl rounded-xl border border-[#721C97]/30 bg-[#070308] px-4 py-4 text-[#C1FF72] placeholder-gray-600 focus:border-[#C1FF72] focus:bg-[#721C97]/10 focus:ring-2 focus:ring-[#C1FF72]/20 sm:text-sm transition-all shadow-inner font-mono"
                                            placeholder="••••"
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="flex w-full justify-center items-center rounded-xl bg-[#721C97] px-4 py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(114,28,151,0.4)] hover:bg-[#8e23bc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C1FF72] transition-all hover:-translate-y-0.5 border border-[#721C97]/50"
                                >
                                    Sign in securely
                                    <svg className="ml-2 -mr-1 w-5 h-5 text-[#C1FF72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-[#721C97]">
                            &copy; {new Date().getFullYear()} QODIX Agency. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
