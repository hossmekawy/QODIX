'use client';
import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { FiDownload, FiX } from 'react-icons/fi';

export default function PWAInstallPrompt() {
    const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDismissed(localStorage.getItem('qodix_pwa_dismissed') === 'true');
        }
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('qodix_pwa_dismissed', 'true');
    };

    if (!isInstallable || isInstalled || dismissed) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <div className="bg-[#070308] border border-[#C1FF72]/30 rounded-xl p-4 shadow-[0_0_30px_rgba(193,255,114,0.15)] flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#C1FF72]/10 flex items-center justify-center shrink-0 border border-[#C1FF72]/20">
                        <FiDownload className="text-[#C1FF72] w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-white text-sm font-bold">Install Qodix</h4>
                        <p className="text-xs text-gray-400">Add to home screen for quick access</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={promptInstall}
                        className="bg-[#C1FF72] text-black px-3 py-1.5 rounded text-xs font-bold hover:bg-[#aef552] transition-colors whitespace-nowrap"
                    >
                        Install
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-500 hover:text-white p-1 rounded transition-colors"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
