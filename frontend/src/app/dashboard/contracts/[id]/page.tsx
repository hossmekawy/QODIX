'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiDownload, FiCheck, FiClock, FiFileText } from 'react-icons/fi';
import api from '@/lib/api';

export default function DocumentDetailsPage() {
    const { id } = useParams();
    const [doc, setDoc] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocument();
    }, [id]);

    const fetchDocument = async () => {
        try {
            const res = await api.get(`/contracts/documents/${id}/`);
            setDoc(res.data);
        } catch (error) {
            console.error('Error fetching document:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkSent = async () => {
        try {
            await api.post(`/contracts/documents/${id}/mark_sent/`);
            fetchDocument();
        } catch (error) {
            console.error('Error marking as sent:', error);
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;
    if (!doc) return <div className="text-white">Document not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <Link href="/dashboard/contracts" className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10">
                    <FiArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        {doc.template_name}
                    </h1>
                    <p className="text-gray-400 mt-1">Generated for {doc.client_name}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <span className="text-sm text-gray-400">Status:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border
                        ${doc.status === 'Draft' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                            doc.status === 'Sent' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                doc.status === 'Signed' ? 'bg-[#C1FF72]/10 text-[#C1FF72] border-[#C1FF72]/20' :
                                    'bg-white/5 text-gray-300 border-white/10'}`}
                    >
                        {doc.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Main Details Panel */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-3">Available Files</h2>

                        <div className="flex gap-4">
                            {doc.file_word && (
                                <a
                                    href={doc.file_word}
                                    download
                                    className="flex-1 flex flex-col items-center justify-center p-6 bg-[#721C97]/10 border border-[#721C97]/30 rounded-xl hover:bg-[#721C97]/20 transition-colors group"
                                >
                                    <FiFileText className="w-10 h-10 text-[#C1FF72] mb-3 group-hover:scale-110 transition-transform" />
                                    <span className="font-medium text-white">Download Word (.docx)</span>
                                </a>
                            )}
                            {doc.file_pdf && (
                                <a
                                    href={doc.file_pdf}
                                    download
                                    className="flex-1 flex flex-col items-center justify-center p-6 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors group"
                                >
                                    <FiDownload className="w-10 h-10 text-red-400 mb-3 group-hover:scale-110 transition-transform" />
                                    <span className="font-medium text-white">Download PDF (.pdf)</span>
                                </a>
                            )}
                            {!doc.file_word && !doc.file_pdf && (
                                <div className="text-gray-500 w-full text-center py-4">Files are generating or unavailable.</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-3">Injected Variables</h2>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            {Object.entries(doc.custom_data).map(([key, value]) => (
                                <div key={key}>
                                    <dt className="text-sm font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                                    <dd className="mt-1 text-sm text-gray-300 font-medium">{String(value)}</dd>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions Panel */}
                <div className="space-y-6">
                    <div className="bg-[#721C97]/10 border border-[#721C97]/30 rounded-2xl p-6 backdrop-blur-sm">
                        <h3 className="font-semibold text-white mb-4">Tracking & Actions</h3>

                        <div className="space-y-3">
                            {doc.status === 'Draft' && (
                                <button
                                    onClick={handleMarkSent}
                                    className="w-full flex justify-center items-center gap-2 bg-[#C1FF72] text-[#070308] px-4 py-2.5 rounded-xl font-bold hover:bg-[#aee661] transition-colors"
                                >
                                    <FiCheck /> Mark as Sent
                                </button>
                            )}
                            {doc.status === 'Sent' && (
                                <div className="p-4 bg-white/5 rounded-xl text-center">
                                    <FiClock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-300">Awaiting Client Signature</p>
                                    <p className="text-xs text-gray-500 mt-1">Upload signed copy below.</p>
                                </div>
                            )}
                            {/* Further implementation for uploading the signed pdf could go here */}
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/10 text-sm">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-500">Created:</span>
                                <span className="text-gray-300">{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Project:</span>
                                <span className="text-gray-300">{doc.project_name || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
