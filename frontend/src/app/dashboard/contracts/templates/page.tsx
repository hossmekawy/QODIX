'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiFileText, FiTrash2, FiBook } from 'react-icons/fi';
import api from '@/lib/api';
import CreateTemplateModal from '@/components/contracts/CreateTemplateModal';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/contracts/templates/');
            setTemplates(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await api.delete(`/contracts/templates/${id}/`);
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/contracts" className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors">
                    <FiArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Template Library
                    </h1>
                    <p className="text-gray-400 mt-1">Manage document templates and their variables.</p>
                </div>
                <div className="ml-auto flex gap-3">
                    <Link
                        href="/dashboard/contracts/templates/guide"
                        className="flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-[#721C97]/50 px-5 py-2.5 rounded-xl transition-all font-medium"
                    >
                        <FiBook className="w-4 h-4 text-[#C1FF72]" />
                        How to create templates
                    </Link>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-[#C1FF72] text-[#070308] px-5 py-2.5 rounded-xl hover:bg-[#aee661] transition-all font-semibold shadow-[0_0_15px_rgba(193,255,114,0.3)]"
                    >
                        <FiPlus className="w-5 h-5" />
                        Upload Template
                    </button>
                </div>
            </div>

            {/* Empty state helper banner */}
            {templates.length === 0 && (
                <div className="bg-[#721C97]/10 border border-[#721C97]/30 rounded-2xl p-6 flex items-center gap-5">
                    <div className="bg-[#721C97]/20 p-3 rounded-xl border border-[#721C97]/30 shrink-0">
                        <FiBook className="w-6 h-6 text-[#C1FF72]" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">No templates yet</h3>
                        <p className="text-sm text-gray-400">
                            Upload your first Word document (.docx) template. Not sure how to create one?
                        </p>
                    </div>
                    <Link
                        href="/dashboard/contracts/templates/guide"
                        className="shrink-0 text-sm text-[#C1FF72] hover:underline font-medium whitespace-nowrap"
                    >
                        Read the guide →
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <div key={template.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group overflow-hidden hover:border-[#721C97]/50 transition-all backdrop-blur-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#721C97] to-[#C1FF72] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-[#721C97]/20 p-3 rounded-xl border border-[#721C97]/30">
                                <FiFileText className="w-6 h-6 text-[#C1FF72]" />
                            </div>
                            <button
                                onClick={() => handleDelete(template.id)}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                                <FiTrash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1">{template.name}</h3>
                        <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                            <span className="capitalize">{template.document_type}</span>
                            <span>•</span>
                            <span className="uppercase">{template.language}</span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Variables</p>
                            <div className="flex flex-wrap gap-2">
                                {(template.variables || []).map((v: string, i: number) => (
                                    <span key={i} className="text-xs py-1 px-2 rounded bg-black/30 border border-white/5 text-gray-300">
                                        {`{{ ${v} }}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isCreateModalOpen && (
                <CreateTemplateModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        fetchTemplates();
                    }}
                />
            )}
        </div>
    );
}
