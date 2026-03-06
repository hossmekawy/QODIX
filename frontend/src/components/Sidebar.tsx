'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiUsers, FiBox, FiTrendingUp, FiSettings, FiGrid, FiFileText, FiServer, FiFile, FiBell, FiMessageSquare, FiDollarSign } from 'react-icons/fi';
import { useSettings } from '@/contexts/SettingsContext';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Projects', href: '/dashboard/projects', icon: FiGrid },
    { name: 'CRM', href: '/dashboard/crm', icon: FiUsers },
    { name: 'Accounts', href: '/dashboard/accounts', icon: FiTrendingUp },
    { name: 'Finance', href: '/dashboard/finance', icon: FiDollarSign },
    { name: 'Planning', href: '/dashboard/planning', icon: FiBox },
    { name: 'Contracts', href: '/dashboard/contracts', icon: FiFileText },
    { name: 'Docs & Templates', href: '/dashboard/contracts/templates', icon: FiFile },
    { name: 'Infrastructure', href: '/dashboard/infrastructure', icon: FiServer },
    { name: 'Conversations', href: '/dashboard/chat', icon: FiMessageSquare },
    { name: 'Notifications', href: '/dashboard/notifications', icon: FiBell },
    { name: 'Settings', href: '/dashboard/settings', icon: FiSettings },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose?: () => void }) {
    const pathname = usePathname();
    const { settings } = useSettings();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && onClose && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-[#721C97]/30 bg-[#110A15]/95 backdrop-blur-xl transition-[transform,width] duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                <div className="flex h-16 shrink-0 items-center border-b border-[#721C97]/30 px-6 bg-gradient-to-r from-[#110A15] to-[#721C97]/10">
                    <span className="text-xl font-black tracking-widest text-[#C1FF72] uppercase truncate">
                        {settings?.name || 'QODIX'}
                    </span>
                </div>

                <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                            || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => {
                                    // Close on mobile when navigating
                                    if (window.innerWidth < 768 && onClose) {
                                        onClose();
                                    }
                                }}
                                className={`group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${isActive
                                    ? 'bg-gradient-to-r from-[#721C97]/40 to-transparent text-[#C1FF72] shadow-[inset_2px_0_0_0_#C1FF72]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon
                                    className={`mr-3 h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[#C1FF72]' : 'text-gray-500 group-hover:text-gray-300'
                                        }`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="shrink-0 p-4 border-t border-[#721C97]/30 bg-black/20">
                    <div className="flex items-center gap-3 rounded-lg bg-black/40 p-3 outline outline-1 outline-[#721C97]/30">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#721C97] to-[#C1FF72] flex items-center justify-center font-bold text-black shrink-0">
                            A
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white truncate">Admin User</span>
                            <span className="text-xs text-[#C1FF72] truncate opacity-80">Superadmin</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
