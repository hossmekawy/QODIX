'use client';
import { useState, useEffect } from 'react';
import SocialMediaTab from '@/components/infrastructure/SocialMediaTab';
import ServersTab from '@/components/infrastructure/ServersTab';
import DomainsSSLTab from '@/components/infrastructure/DomainsSSLTab';
import APIsTab from '@/components/infrastructure/APIsTab';
import PromptsTab from '@/components/infrastructure/PromptsTab';
import { FiServer, FiShare2, FiGlobe, FiDatabase, FiMessageSquare } from 'react-icons/fi';

export default function InfrastructurePage() {
    const [activeTab, setActiveTab] = useState<'social' | 'servers' | 'domains' | 'apis' | 'prompts'>('social');

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#721C97]/30 pb-6 relative">
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#721C97]/20 blur-[60px] pointer-events-none rounded-full"></div>
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#C1FF72] tracking-tight">Infrastructure & Assets</h1>
                    <p className="text-gray-400 mt-1">Manage servers, social accounts, and domains in one secure place</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1 bg-[#070308] border border-[#721C97]/50 rounded-xl overflow-x-auto custom-scrollbar">
                <button
                    onClick={() => setActiveTab('social')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'social' ? 'bg-[#721C97]/40 text-white shadow-[0_0_15px_rgba(114,28,151,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <FiShare2 className="w-5 h-5" /> Social Media Credentials
                </button>
                <button
                    onClick={() => setActiveTab('servers')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'servers' ? 'bg-[#C1FF72]/20 text-[#C1FF72] shadow-[0_0_15px_rgba(193,255,114,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <FiServer className="w-5 h-5" /> Servers & Hosting
                </button>
                <button
                    onClick={() => setActiveTab('domains')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'domains' ? 'bg-blue-900/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <FiGlobe className="w-5 h-5" /> Domains & SSL
                </button>
                <button
                    onClick={() => setActiveTab('apis')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'apis' ? 'bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <FiDatabase className="w-5 h-5" /> API Credentials
                </button>
                <button
                    onClick={() => setActiveTab('prompts')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'prompts' ? 'bg-pink-500/20 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <FiMessageSquare className="w-5 h-5" /> AI Prompts
                </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-6">
                {activeTab === 'social' && <SocialMediaTab />}
                {activeTab === 'servers' && <ServersTab />}
                {activeTab === 'domains' && <DomainsSSLTab />}
                {activeTab === 'apis' && <APIsTab />}
                {activeTab === 'prompts' && <PromptsTab />}
            </div>
        </div>
    );
}
