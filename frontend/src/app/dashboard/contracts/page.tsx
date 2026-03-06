'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiFileText, FiDownload, FiEye, FiCheck, FiSend, FiClock } from 'react-icons/fi';
import api from '@/lib/api';

export default function ContractsDashboard() {
    const [documents, setDocuments] = useState<any[]>([]);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await api.get('/contracts/documents/');
            setDocuments(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Contracts & Documents
                    </h1>
                    <p className="text-gray-400 mt-2">Manage your templates and generated documents.</p>
                </div>
                <div className="flex gap-4">
                    <Link
                        href="/dashboard/contracts/templates"
                        className="flex items-center gap-2 bg-[#721C97]/20 border border-[#721C97]/50 text-white px-5 py-2.5 rounded-xl hover:bg-[#721C97]/40 transition-all font-medium backdrop-blur-sm"
                    >
                        <FiFileText className="w-5 h-5 text-[#C1FF72]" />
                        Template Library
                    </Link>
                    <Link
                        href="/dashboard/contracts/generate"
                        className="flex items-center gap-2 bg-[#C1FF72] text-[#070308] px-5 py-2.5 rounded-xl hover:bg-[#aee661] transition-all font-semibold shadow-[0_0_15px_rgba(193,255,114,0.3)]"
                    >
                        <FiPlus className="w-5 h-5" />
                        Generate Document
                    </Link>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white">Recent Documents</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-[#070308]/50 text-xs uppercase bg-black/20 border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-400">Client / Project</th>
                                <th className="px-6 py-4 font-semibold text-gray-400">Template</th>
                                <th className="px-6 py-4 font-semibold text-gray-400">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-400">Date</th>
                                <th className="px-6 py-4 text-right font-semibold text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {documents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No documents generated yet.
                                    </td>
                                </tr>
                            ) : (
                                documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{doc.client_name}</div>
                                            <div className="text-xs text-gray-400 mt-1">{doc.project_name || 'No Project'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300">
                                                <FiFileText className="w-3.5 h-3.5" />
                                                {doc.template_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                                ${doc.status === 'Draft' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                                                    doc.status === 'Sent' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        doc.status === 'Signed' ? 'bg-[#C1FF72]/10 text-[#C1FF72] border-[#C1FF72]/20' :
                                                            doc.status === 'Expired' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                'bg-white/5 text-gray-300 border-white/10'}`}
                                            >
                                                {doc.status === 'Draft' && <FiClock className="w-3 h-3" />}
                                                {doc.status === 'Sent' && <FiSend className="w-3 h-3" />}
                                                {doc.status === 'Signed' && <FiCheck className="w-3 h-3" />}
                                                {doc.status === 'Viewed' && <FiEye className="w-3 h-3" />}
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/contracts/${doc.id}`}
                                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10"
                                                    title="View Details"
                                                >
                                                    <FiEye className="w-4 h-4" />
                                                </Link>
                                                {doc.file_word && (
                                                    <a
                                                        href={doc.file_word}
                                                        download
                                                        className="p-2 text-[#721C97] hover:text-[#C1FF72] hover:bg-[#721C97]/20 rounded-lg transition-colors border border-transparent hover:border-[#721C97]/30"
                                                        title="Download Word"
                                                    >
                                                        <FiDownload className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {doc.file_pdf && (
                                                    <a
                                                        href={doc.file_pdf}
                                                        download
                                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                                                        title="Download PDF"
                                                    >
                                                        <FiDownload className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
