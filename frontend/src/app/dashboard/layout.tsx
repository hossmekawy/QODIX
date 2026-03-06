'use client';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { SettingsProvider } from '@/contexts/SettingsContext';
import AuthGuard from '@/components/AuthGuard';
import { useState } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <AuthGuard>
            <SettingsProvider>
                <div className="flex h-screen overflow-hidden bg-[#070308] text-white select-none">
                    <div className={`fixed inset-0 z-40 md:relative md:z-auto md:flex transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                    </div>
                    {sidebarOpen && (
                        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
                    )}
                    <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#070308] to-[#110A15] p-5 lg:p-10 custom-scrollbar relative">
                            {/* Decorative glow effects */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#721C97]/10 blur-[120px] rounded-full pointer-events-none" />

                            <div className="relative z-10 w-full max-w-[1600px] mx-auto min-h-full">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </SettingsProvider>
        </AuthGuard>
    );
}
