'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

/**
 * AuthGuard component - wraps protected pages.
 * Checks for access_token in localStorage and validates it by calling the profile API.
 * If no token or token is invalid (401), redirects to /login immediately.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [showLoginRedirect, setShowLoginRedirect] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('access_token');

            if (!token) {
                // No token at all — redirect immediately
                router.replace('/login');
                return;
            }

            try {
                // Validate the token by calling the profile endpoint
                await api.get('/accounts/profile/');
                setIsAuthenticated(true);
            } catch (error: any) {
                // Token is invalid or expired — clear it and redirect
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                router.replace('/login');
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, [router]);

    // Timer logic for visual counter
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (isChecking) {
            timeoutId = setTimeout(() => {
                setTimerSeconds((prev) => prev + 1);
            }, 1000);
        }

        return () => clearTimeout(timeoutId);
    }, [isChecking, timerSeconds]);

    // Action logic based on visual counter
    useEffect(() => {
        if (timerSeconds >= 10) {
            setShowLoginRedirect(true);
        }
        if (timerSeconds >= 16) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            router.replace('/login');
        }
    }, [timerSeconds, router]);

    // Show loading spinner while checking auth
    if (isChecking) {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#070308] overflow-hidden relative">
                {/* Background glow effect */}
                <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-[#C1FF72]/10 rounded-full blur-[100px] animate-pulse"></div>

                <div className="relative z-10 flex flex-col items-center mt-[-5vh]">
                    {/* 3D-like spinning container */}
                    <div className="relative w-24 h-24 md:w-32 md:h-32 mb-8" style={{ perspective: '1000px' }}>
                        <div className="absolute inset-0 border-4 border-[#C1FF72]/20 rounded-2xl animate-[spin_4s_linear_infinite]" style={{ transformStyle: 'preserve-3d' }}>
                            <div className="absolute inset-0 border-4 border-[#C1FF72] rounded-2xl animate-[spin_3s_linear_infinite_reverse] shadow-[0_0_30px_rgba(193,255,114,0.4)]" style={{ transform: 'translateZ(20px)' }}></div>
                            <div className="absolute inset-0 bg-[#C1FF72]/5 backdrop-blur-md rounded-2xl flex items-center justify-center" style={{ transform: 'translateZ(10px)' }}>
                                <div className="w-8 h-8 md:w-12 md:h-12 border-t-4 border-b-4 border-white rounded-full animate-spin"></div>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-xl md:text-2xl font-black text-white mb-2 tracking-widest uppercase">Authenticating</h2>
                    <p className="text-[#C1FF72] text-xs md:text-sm animate-pulse mb-8">Establishing secure connection...</p>

                    {/* Visual Timer */}
                    <div className="flex items-center justify-center gap-1 mb-12">
                        <span className="text-white font-mono text-2xl bg-white/5 px-3 py-1 rounded-lg border border-white/10 shadow-inner">
                            {String(timerSeconds).padStart(2, '0')}
                        </span>
                        <span className="text-gray-500 font-bold text-xs uppercase ml-2 tracking-wider">Seconds</span>
                    </div>

                    {showLoginRedirect ? (
                        <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-500">
                            <p className="text-red-400 text-xs text-center max-w-xs">Connection is taking longer than expected. You will be redirected shortly.</p>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('access_token');
                                    localStorage.removeItem('refresh_token');
                                    router.replace('/login');
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 hover:border-red-500 rounded-xl text-red-500 font-bold transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="text-xs uppercase tracking-wider">Force Redirect to Login</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-[#C1FF72]/10 border border-white/10 hover:border-[#C1FF72]/50 rounded-xl text-gray-400 hover:text-[#C1FF72] transition-all duration-300 group shadow-lg"
                        >
                            <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-xs font-bold tracking-wider uppercase">Refresh Connection</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Only render children if authenticated
    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
