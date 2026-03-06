'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
    message: string;
    variant?: ToastVariant;
    duration?: number;
}

interface Toast extends ToastOptions {
    id: string;
    visible: boolean;
}

interface ToastContextType {
    showToast: (options: ToastOptions) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback(({ message, variant = 'info', duration = 3000 }: ToastOptions) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, variant, duration, visible: true }]);

        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 300); // Wait for exit animation
        }, duration);
    }, []);

    const success = useCallback((message: string, duration?: number) => showToast({ message, variant: 'success', duration }), [showToast]);
    const error = useCallback((message: string, duration?: number) => showToast({ message, variant: 'error', duration }), [showToast]);
    const warning = useCallback((message: string, duration?: number) => showToast({ message, variant: 'warning', duration }), [showToast]);
    const info = useCallback((message: string, duration?: number) => showToast({ message, variant: 'info', duration }), [showToast]);

    const removeToast = (id: string) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
    };

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto transition-all duration-300 transform ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                            }`}
                    >
                        <div className={`relative overflow-hidden rounded-xl border p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 ${getToastStyle(toast.variant)}`}>
                            {/* Decorative Glow */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 blur-[20px] rounded-full pointer-events-none"></div>

                            <div className="flex-shrink-0 mt-0.5">
                                {getToastIcon(toast.variant)}
                            </div>
                            <div className="flex-1 mr-4">
                                <h4 className="text-sm font-bold capitalize mb-0.5">{toast.variant}</h4>
                                <p className="text-sm opacity-90 leading-snug">{toast.message}</p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 text-white/50 hover:text-white transition-colors p-1 bg-white/5 hover:bg-white/10 rounded-lg"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function getToastStyle(variant: ToastVariant = 'info'): string {
    switch (variant) {
        case 'success':
            return 'bg-[#070308]/95 border-[#C1FF72] text-[#C1FF72] shadow-[0_4px_30px_rgba(193,255,114,0.3)]';
        case 'error':
            return 'bg-[#070308]/95 border-red-500 text-red-400 shadow-[0_4px_30px_rgba(239,68,68,0.3)]';
        case 'warning':
            return 'bg-[#070308]/95 border-yellow-500 text-yellow-400 shadow-[0_4px_30px_rgba(234,179,8,0.3)]';
        case 'info':
            return 'bg-[#070308]/95 border-[#721C97] text-[#e0a8ff] shadow-[0_4px_30px_rgba(114,28,151,0.3)]';
        default:
            return 'bg-gray-900 border-gray-700 text-white';
    }
}

function getToastIcon(variant: ToastVariant = 'info') {
    switch (variant) {
        case 'success':
            return <FiCheckCircle className="w-5 h-5 text-[#C1FF72]" />;
        case 'error':
            return <FiXCircle className="w-5 h-5 text-red-500" />;
        case 'warning':
            return <FiAlertTriangle className="w-5 h-5 text-yellow-500" />;
        case 'info':
            return <FiInfo className="w-5 h-5 text-[#e0a8ff]" />;
        default:
            return <FiInfo className="w-5 h-5" />;
    }
}
