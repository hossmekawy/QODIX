'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiPieChart, FiFileText, FiCreditCard, FiActivity, FiTrendingUp } from 'react-icons/fi';

const financeTabs = [
    { name: 'Overview', href: '/dashboard/finance', icon: FiPieChart },
    { name: 'Invoices', href: '/dashboard/finance/invoices', icon: FiFileText },
    { name: 'Expenses', href: '/dashboard/finance/expenses', icon: FiCreditCard },
    { name: 'Banking', href: '/dashboard/finance/banking', icon: FiActivity },
    { name: 'Reports', href: '/dashboard/finance/reports', icon: FiTrendingUp },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div className="flex border-b border-[#721C97]/30 bg-[#070308]/50 p-2 rounded-xl backdrop-blur-md sticky top-0 z-10 overflow-x-auto custom-scrollbar">
                {financeTabs.map((tab) => {
                    const isActive = pathname === tab.href || (tab.href !== '/dashboard/finance' && pathname.startsWith(tab.href));
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${isActive
                                    ? 'bg-[#C1FF72]/10 text-[#C1FF72] shadow-[inset_0_2px_10px_rgba(193,255,114,0.1)] border border-[#C1FF72]/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-[#C1FF72]' : 'text-gray-500'}`} />
                            {tab.name}
                        </Link>
                    )
                })}
            </div>

            <div className="animate-in fade-in duration-500 pb-20">
                {children}
            </div>
        </div>
    );
}
