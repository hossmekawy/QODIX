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

    // Show loading spinner while checking auth
    if (isChecking) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-[#070308]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-[#C1FF72] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm">Verifying authentication...</p>
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
