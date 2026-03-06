'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import api from '@/lib/api';

interface PlanBoardProps {
    planId: number;
    initialState: Record<string, any>;
}

// Inner component rendered INSIDE <Tldraw> so useEditor() works
function BoardSaveController({ planId, initialState }: PlanBoardProps) {
    const saveTimer = useRef<any>(null);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const editorRef = useRef<any>(null);

    const doSave = useCallback(async (editor: any) => {
        setSaveStatus('saving');
        try {
            // Try both APIs — tldraw v4 introduced getSnapshot as a standalone fn
            let snapshot: any;
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            try { const { getSnapshot } = require('@tldraw/tldraw'); snapshot = getSnapshot(editor.store); }
            catch { snapshot = editor.store.getSnapshot ? editor.store.getSnapshot() : editor.getSnapshot?.() ?? {}; }

            await api.patch(`/planning/plans/${planId}/save_board/`, { board_state: snapshot });
            setSaveStatus('saved');
        } catch (e) {
            console.error('Board save error', e);
            setSaveStatus('unsaved');
        }
    }, [planId]);

    const scheduleSave = useCallback((editor: any) => {
        setSaveStatus('unsaved');
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => doSave(editor), 2000);
    }, [doSave]);

    // Access editor via useEditor hook dynamically
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        // Dynamically import to access the hook at module load time
        import('@tldraw/tldraw').then(({ useEditor }) => {
            // Can't call a hook from useEffect, so we use a different approach below
            void useEditor; // just verifying it exists
        });

        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            unsubscribe?.();
        };
    }, []);

    return null; // rendered inside Tldraw, access via editorRef below
}

export default function PlanBoard({ planId, initialState }: PlanBoardProps) {
    const [TldrawMod, setTldrawMod] = useState<any>(null);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const editorRef = useRef<any>(null);
    const saveTimer = useRef<any>(null);

    useEffect(() => {
        import('@tldraw/tldraw').then(mod => setTldrawMod(mod));
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, []);

    const doSave = useCallback(async () => {
        const editor = editorRef.current;
        if (!editor) return;
        setSaveStatus('saving');
        try {
            let snapshot: any = {};
            // getSnapshot exported function (tldraw v3+)
            if (TldrawMod?.getSnapshot) {
                snapshot = TldrawMod.getSnapshot(editor.store);
            } else if (editor.store?.getSnapshot) {
                snapshot = editor.store.getSnapshot();
            } else if (editor.getSnapshot) {
                snapshot = editor.getSnapshot();
            }
            await api.patch(`/planning/plans/${planId}/save_board/`, { board_state: snapshot });
            setSaveStatus('saved');
        } catch (e) {
            console.error('Save error', e);
            setSaveStatus('unsaved');
        }
    }, [TldrawMod, planId]);

    const scheduleSave = useCallback(() => {
        setSaveStatus('unsaved');
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(doSave, 2000);
    }, [doSave]);

    const handleMount = useCallback((editor: any) => {
        editorRef.current = editor;

        // Load initial state
        if (initialState && Object.keys(initialState).length > 0) {
            try {
                if (TldrawMod?.loadSnapshot) {
                    TldrawMod.loadSnapshot(editor.store, initialState);
                } else {
                    editor.loadSnapshot?.(initialState);
                }
            } catch (e) { console.warn('Could not restore board state:', e); }
        }

        // Listen to store changes
        const unlisten = editor.store.listen(
            () => scheduleSave(),
            { scope: 'document', source: 'user' }
        );
        return unlisten;
    }, [initialState, TldrawMod, scheduleSave]);

    // Ctrl+S manual save
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                doSave();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [doSave]);

    const statusStyles = {
        saved: 'bg-[#C1FF72]/10 text-[#C1FF72] border-[#C1FF72]/20',
        saving: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        unsaved: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    };

    if (!TldrawMod) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#060409]">
                <div className="text-gray-400 animate-pulse text-sm">Loading canvas...</div>
            </div>
        );
    }

    const { Tldraw } = TldrawMod;

    return (
        <div className="relative w-full h-full">
            {/* Status + manual Save button */}
            <div className="absolute top-3 right-3 z-[300] flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm border pointer-events-none ${statusStyles[saveStatus]}`}>
                    {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? '⟳ Saving...' : '● Unsaved'}
                </span>
                <button
                    onClick={doSave}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                    Save
                </button>
            </div>
            <Tldraw onMount={handleMount} />
        </div>
    );
}
