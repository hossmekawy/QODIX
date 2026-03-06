'use client';

import { useState } from 'react';
import { FiX, FiUploadCloud } from 'react-icons/fi';
import api from '@/lib/api';

interface CreateTemplateModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateTemplateModal({ onClose, onSuccess }: CreateTemplateModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        document_type: 'Contract',
        language: 'en',
        variables: '',
    });
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert('Please select a .docx file.');
            return;
        }

        setLoading(true);
        const data = new FormData();
        data.append('name', formData.name);
        data.append('document_type', formData.document_type);
        data.append('language', formData.language);
        data.append('file', file);

        // Parse comma-separated variables into array
        const varsArray = formData.variables
            .split(',')
            .map(v => v.trim())
            .filter(v => v !== '');
        data.append('variables', JSON.stringify(varsArray));

        try {
            await api.post('/contracts/templates/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onSuccess();
        } catch (error) {
            console.error('Error creating template:', error);
            alert('Failed to upload template. Ensure it is a valid .docx file.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0f0a10] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Upload Template</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Template Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#721C97]"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Standard NDA 2026"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#721C97]"
                                value={formData.document_type}
                                onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                            >
                                <option value="Contract">Contract</option>
                                <option value="Proposal">Proposal</option>
                                <option value="Invoice">Invoice</option>
                                <option value="Quote">Quotation</option>
                                <option value="NDA">NDA</option>
                                <option value="SLA">SLA</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Language</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#721C97]"
                                value={formData.language}
                                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                            >
                                <option value="en">English</option>
                                <option value="ar">Arabic</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Variables (Comma-separated)</label>
                        <input
                            type="text"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#721C97]"
                            value={formData.variables}
                            onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                            placeholder="client_name, project_amount, start_date"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            These correspond to `{'{{ variable_name }}'}` tags in your Word document.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Word Document (.docx)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white/10 border-dashed rounded-xl relative hover:border-[#721C97]/50 transition-colors">
                            <div className="space-y-1 text-center">
                                <FiUploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                                <div className="flex text-sm text-gray-400 mt-2">
                                    <label
                                        htmlFor="file-upload"
                                        className="relative cursor-pointer bg-[#721C97] font-medium text-white px-3 py-1 rounded hover:bg-[#5b167a]"
                                    >
                                        <span>Select a file</span>
                                        <input
                                            id="file-upload"
                                            name="file-upload"
                                            type="file"
                                            accept=".docx"
                                            className="sr-only"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setFile(e.target.files[0]);
                                                }
                                            }}
                                        />
                                    </label>
                                    <p className="pl-2 pt-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {file ? file.name : 'DOCX up to 10MB'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !file}
                            className="px-6 py-2.5 bg-gradient-to-r from-[#721C97] to-[#C1FF72] text-[#070308] font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? 'Uploading...' : 'Save Template'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
