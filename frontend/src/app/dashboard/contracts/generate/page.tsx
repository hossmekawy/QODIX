'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';
import api from '@/lib/api';

export default function GenerateDocumentPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [customData, setCustomData] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/contracts/templates/').then(res => setTemplates(res.data)).catch(console.error);
        api.get('/crm/customers/').then(res => {
            // Unpack paginated results
            setClients(res.data.results || res.data);
        }).catch(console.error);
        api.get('/projects/projects/').then(res => setProjects(res.data)).catch(console.error);
    }, []);

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tId = e.target.value;
        const template = templates.find(t => t.id.toString() === tId);
        setSelectedTemplate(template || null);

        // Reset custom data when template changes
        setCustomData({});
    };

    const handleFieldChange = (key: string, value: string) => {
        setCustomData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate || !selectedClient) return;

        setLoading(true);
        try {
            const res = await api.post(`/contracts/templates/${selectedTemplate.id}/generate_document/`, {
                client_id: selectedClient,
                project_id: selectedProject || null,
                custom_data: customData
            });

            // Redirect to the generated document details page
            router.push(`/dashboard/contracts/${res.data.id}`);
        } catch (error) {
            console.error('Error generating document:', error);
            alert('Failed to generate document. Please check the inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <Link href="/dashboard/contracts" className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10">
                    <FiArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Generate Document
                    </h1>
                    <p className="text-gray-400 mt-1">Select a template and fill in the required variables to dynamically generate a new document.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm space-y-8 shadow-xl">

                {/* Core Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Template *</label>
                        <div className="relative">
                            <select
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#721C97] appearance-none"
                                onChange={handleTemplateChange}
                                defaultValue=""
                            >
                                <option value="" disabled>Select a Document Template</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.document_type} - {t.language.toUpperCase()})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Client *</label>
                        <select
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#721C97]"
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                        >
                            <option value="" disabled>Select Client</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Associated Project (Optional)</label>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#721C97]"
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                        >
                            <option value="">No Project Affiliation</option>
                            {/* Filter projects by selected client if needed */}
                            {projects
                                .filter(p => !selectedClient || p.customer === parseInt(selectedClient))
                                .map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                        </select>
                    </div>
                </div>

                {/* Dynamic Variables Form */}
                {selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                    <div className="pt-6 border-t border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FiFileText className="text-[#C1FF72]" />
                            Template Details
                        </h3>
                        <p className="text-sm text-gray-400 mb-6">Please populate the following variables to be injected into the Word Document.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedTemplate.variables.map((variable: string) => (
                                <div key={variable}>
                                    <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                                        {variable.replace(/_/g, ' ')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#721C97] transition-colors"
                                        value={customData[variable] || ''}
                                        onChange={(e) => handleFieldChange(variable, e.target.value)}
                                        placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State Action Guide */}
                {!selectedTemplate && (
                    <div className="py-8 text-center border-t border-white/5">
                        <p className="text-gray-500">Select a template above to reveal the required variables.</p>
                    </div>
                )}

                <div className="pt-6 border-t border-white/10 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !selectedTemplate || !selectedClient}
                        className="px-8 py-3 bg-gradient-to-r from-[#721C97] to-[#C1FF72] text-[#070308] font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-lg shadow-[0_4px_14px_rgba(114,28,151,0.4)]"
                    >
                        {loading ? 'Generating...' : 'Generate Document'}
                    </button>
                </div>
            </form>
        </div>
    );
}
