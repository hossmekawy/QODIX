import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FiX, FiPlus, FiTag, FiTrash2 } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';

interface Tag {
    id: number;
    name: string;
    color: string;
}

interface TagManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTagAdded: (newTag: Tag) => void;
}

export default function TagManagerModal({ isOpen, onClose, onTagAdded }: TagManagerModalProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#C1FF72');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchTags();
        }
    }, [isOpen]);

    const fetchTags = async () => {
        try {
            const res = await api.get('/crm/tags/');
            setTags(res.data);
        } catch (err) {
            toast.error('Failed to load existing tags.');
        }
    };

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newTagName.trim()) {
            toast.warning('Tag name is required.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await api.post('/crm/tags/', {
                name: newTagName.trim(),
                color: newTagColor,
            });
            setTags([...tags, res.data]);
            onTagAdded(res.data);
            setNewTagName('');
            toast.success(`Tag "${res.data.name}" created successfully!`);
        } catch (err: any) {
            toast.error(err.response?.data?.name?.[0] || 'Failed to create tag.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTag = async (id: number) => {
        if (!confirm('Are you sure you want to delete this tag? It will be removed from all customers.')) return;
        try {
            await api.delete(`/crm/tags/${id}/`);
            setTags(tags.filter(t => t.id !== id));
            toast.success('Tag deleted.');
        } catch (err) {
            toast.error('Failed to delete tag.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#070308] border border-[#721C97]/50 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(114,28,151,0.3)] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[#721C97]/30 bg-[#721C97]/10">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <FiTag className="text-[#C1FF72]" /> Manage Tags
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Create New form */}
                    <form onSubmit={handleCreateTag} className="flex flex-col gap-4 mb-8">
                        <div>
                            <label className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-1 block">New Tag Name</label>
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="e.g. VIP, Important, Lead..."
                                className="w-full bg-[#070308] border border-[#721C97]/50 rounded-xl px-4 py-3 text-white focus:border-[#C1FF72] outline-none transition-colors"
                            />
                        </div>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-1 block">Color Code</label>
                                <div className="flex items-center gap-2 bg-[#070308] border border-[#721C97]/50 rounded-xl px-3 py-2 focus-within:border-[#C1FF72] transition-colors">
                                    <input
                                        type="color"
                                        value={newTagColor}
                                        onChange={(e) => setNewTagColor(e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                                    />
                                    <input
                                        type="text"
                                        value={newTagColor}
                                        onChange={(e) => setNewTagColor(e.target.value)}
                                        className="bg-transparent text-white w-full outline-none text-sm font-mono uppercase"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-5 py-3.5 bg-[#C1FF72] text-[#070308] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#aef556] transition-colors shadow-[0_0_15px_rgba(193,255,114,0.2)] disabled:opacity-50"
                            >
                                <FiPlus /> {isLoading ? 'Adding...' : 'Create'}
                            </button>
                        </div>
                    </form>

                    {/* Existing Tags */}
                    <div>
                        <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-3 border-b border-[#721C97]/30 pb-2">Existing Tags</h3>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                            {tags.length === 0 ? (
                                <p className="text-sm text-gray-500 italic text-center py-4">No tags created yet.</p>
                            ) : (
                                tags.map(tag => (
                                    <div key={tag.id} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-lg p-3 group hover:bg-[#721C97]/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: tag.color, backgroundColor: `${tag.color}40` }}></div>
                                            <span className="font-bold text-white text-sm" style={{ color: tag.color }}>{tag.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTag(tag.id)}
                                            className="text-gray-500 hover:text-red-400 p-1.5 rounded bg-white/5 hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete Tag"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[#721C97]/30 bg-[#070308] flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 transition-colors">
                        Done
                    </button>
                </div>

            </div>
        </div>
    );
}
