'use client';
import { useState, useEffect, useRef } from 'react';
import { FiSend, FiPaperclip, FiMic, FiSearch, FiFileText, FiImage, FiPlus, FiMessageSquare, FiArrowLeft } from 'react-icons/fi';
import api from '@/lib/api';
import { useSettings } from '@/contexts/SettingsContext';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

const isClient = typeof window !== 'undefined';
const HOST = isClient ? window.location.hostname : '127.0.0.1';
const PORT = isClient ? window.location.port : '9000';
const PROTOCOL = isClient ? window.location.protocol : 'http:';
const BACKEND_URL = PORT ? `${PROTOCOL}//${HOST}:${PORT}` : `${PROTOCOL}//${HOST}`;

function resolveMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function isImageUrl(url: string): boolean {
    try {
        const pathname = new URL(url).pathname;
        return /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(pathname);
    } catch {
        return /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(url);
    }
}

export default function ChatPage() {
    const { settings } = useSettings();
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [myUserId, setMyUserId] = useState<number | null>(null);

    // Mobile state: show chat panel when a conversation is selected
    const [showChatPanel, setShowChatPanel] = useState(false);

    // New Chat Modal State
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [groupName, setGroupName] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // Attachments
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Voice Recording
    const { isRecording, recordingTime, audioBlob: voiceNote, startRecording, stopRecording, cancelRecording, clearAudioBlob: clearVoiceNote } = useAudioRecorder();

    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.get('/accounts/profile/').then(res => setMyUserId(res.data.id)).catch(() => { });
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/chats/');
            setConversations(res.data);
        } catch (error) {
            console.error("Failed to load chats", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableUsers = async () => {
        try {
            const res = await api.get('/chat/users/');
            setAvailableUsers(res.data);
        } catch (error) {
            console.error("Failed to load users", error);
        }
    };

    const handleCreateChat = async () => {
        if (selectedUsers.length === 0) return;
        try {
            const res = await api.post('/chat/chats/', {
                participants: selectedUsers,
                name: selectedUsers.length > 1 ? groupName : null
            });

            setIsNewChatModalOpen(false);
            setSelectedUsers([]);
            setGroupName('');
            setUserSearchQuery('');

            await fetchConversations();
            selectConversation(res.data);
        } catch (error) {
            console.error("Failed to create chat", error);
        }
    };

    const getConversationName = (conv: any) => {
        if (conv.name) return conv.name;
        if (conv.is_group || conv.participants?.length > 2) return 'Group Chat';
        const otherPerson = conv.participants?.find((p: any) => p.id !== myUserId);
        if (otherPerson) {
            return `${otherPerson.first_name || ''} ${otherPerson.last_name || ''}`.trim() || otherPerson.email;
        }
        return 'Direct Message';
    };

    const getConversationInitial = (conv: any) => {
        const name = getConversationName(conv);
        return name ? name[0].toUpperCase() : 'U';
    };

    const selectConversation = async (conv: any) => {
        setActiveConversation(conv);
        setShowChatPanel(true); // On mobile, switch to chat view

        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }

        try {
            const msgRes = await api.get(`/chat/chats/${conv.id}/messages/`);
            setMessages(msgRes.data.reverse());

            const token = localStorage.getItem('access_token');
            const wsProto = PROTOCOL === 'https:' ? 'wss:' : 'ws:';
            const wsBase = PORT ? `${wsProto}//${HOST}:${PORT}` : `${wsProto}//${HOST}`;
            const wsUrl = `${wsBase}/ws/chat/${conv.id}/?token=${token}`;

            let reconnectDelay = 2000;
            let currentWs: WebSocket | null = null;
            let reconnectTimer: ReturnType<typeof setTimeout>;

            const connectWs = () => {
                currentWs = new WebSocket(wsUrl);
                ws.current = currentWs;

                currentWs.onopen = () => {
                    console.log('Chat WS connected');
                    reconnectDelay = 2000;
                };

                currentWs.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    setMessages(prev => {
                        if (data.id && prev.some(m => m.id === data.id)) return prev;
                        return [...prev, data];
                    });
                };

                currentWs.onclose = () => {
                    if (ws.current === currentWs) {
                        console.log(`Chat WS closed. Reconnecting in ${reconnectDelay / 1000}s...`);
                        reconnectTimer = setTimeout(connectWs, reconnectDelay);
                        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
                    }
                };

                currentWs.onerror = () => {
                    currentWs?.close();
                };
            };

            connectWs();

        } catch (err) {
            console.error("Failed to load messages", err);
        }
    };

    const handleBackToList = () => {
        setShowChatPanel(false);
    };

    const sendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!inputText.trim() && !attachment && !voiceNote) || !activeConversation || sending) return;

        setSending(true);
        try {
            const formData = new FormData();
            formData.append('conversation', activeConversation.id);
            if (inputText.trim()) formData.append('content', inputText);
            if (attachment) formData.append('attachment', attachment);
            if (voiceNote) {
                formData.append('voice_note', new File([voiceNote], 'voice_note.wav', { type: 'audio/wav' }));
            }

            setInputText('');
            setAttachment(null);
            clearVoiceNote();

            const response = await api.post('/chat/messages/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data && response.data.id) {
                setMessages(prev => {
                    if (prev.some(m => m.id === response.data.id)) return prev;
                    return [...prev, response.data];
                });
            }
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const filteredUsers = availableUsers.filter(u =>
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.first_name && u.first_name.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
        (u.last_name && u.last_name.toLowerCase().includes(userSearchQuery.toLowerCase()))
    );

    // ============== Conversation List Panel ==============
    const conversationListPanel = (
        <div className={`${showChatPanel ? 'hidden md:flex' : 'flex'} w-full md:w-80 md:shrink-0 border-r border-[#721C97]/30 flex-col bg-[#110A15]/80 h-full`}>
            <div className="h-14 md:h-16 border-b border-[#721C97]/30 flex items-center justify-between px-4 shrink-0">
                <h2 className="text-base md:text-lg font-bold text-white">Conversations</h2>
                <button
                    onClick={() => {
                        setIsNewChatModalOpen(true);
                        fetchAvailableUsers();
                    }}
                    className="p-2 bg-[#721C97]/20 text-[#C1FF72] rounded-full hover:bg-[#721C97]/40 transition-colors"
                >
                    <FiPlus className="w-5 h-5" />
                </button>
            </div>

            <div className="p-2 md:p-3 shrink-0">
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="w-full bg-[#070308] border border-[#721C97]/30 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#C1FF72]"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center p-6"><div className="w-6 h-6 border-2 border-[#C1FF72] border-b-transparent rounded-full animate-spin"></div></div>
                ) : conversations.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">No conversations yet.</div>
                ) : (
                    conversations.map(conv => {
                        const convName = getConversationName(conv);
                        return (
                            <div
                                key={conv.id}
                                onClick={() => selectConversation(conv)}
                                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-l-2 ${activeConversation?.id === conv.id ? 'bg-[#721C97]/20 border-[#C1FF72]' : 'border-transparent hover:bg-white/5'}`}
                            >
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#721C97] to-[#110A15] shrink-0 flex items-center justify-center font-bold text-[#C1FF72] text-sm md:text-base">
                                    {getConversationInitial(conv)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white truncate text-sm">
                                        {convName}
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-400 truncate">
                                        {conv.last_message ? conv.last_message.content : 'New chat'}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    // ============== Chat Panel ==============
    const chatPanel = activeConversation ? (
        <div className={`${showChatPanel ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#070308]/50 h-full`}>
            {/* Chat Header */}
            <div className="h-14 md:h-16 border-b border-[#721C97]/30 flex items-center px-3 md:px-6 bg-[#110A15]/80 shrink-0 gap-2 md:gap-3">
                {/* Back button - mobile only */}
                <button
                    onClick={handleBackToList}
                    className="md:hidden p-2 -ml-1 text-gray-400 hover:text-white transition-colors"
                >
                    <FiArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#721C97] to-[#110A15] flex items-center justify-center font-bold text-[#C1FF72] text-sm">
                    {getConversationInitial(activeConversation)}
                </div>
                <h2 className="font-bold text-white text-sm md:text-base truncate">
                    {getConversationName(activeConversation)}
                </h2>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => {
                    const isMe = (msg.sender?.id || msg.sender_id) === myUserId;
                    const attachmentUrl = resolveMediaUrl(msg.attachment);
                    const voiceUrl = resolveMediaUrl(msg.voice_note);

                    return (
                        <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 md:px-4 py-2 text-[14px] md:text-[15px] ${isMe
                                ? 'bg-gradient-to-br from-[#721C97] to-[#5a157a] text-white rounded-tr-sm'
                                : 'bg-[#110A15] border border-[#721C97]/30 text-gray-200 rounded-tl-sm'
                                }`}>
                                {/* Text content */}
                                {(msg.message || msg.content) && (
                                    <p className="break-words">{msg.message || msg.content}</p>
                                )}

                                {/* Image or file attachment */}
                                {attachmentUrl && (
                                    <div className="mt-2 text-white">
                                        {isImageUrl(attachmentUrl) ? (
                                            <img
                                                src={attachmentUrl}
                                                alt="Attachment"
                                                className="max-w-full rounded-lg border border-white/20 cursor-pointer"
                                                style={{ maxHeight: '300px', objectFit: 'contain' }}
                                                onClick={() => window.open(attachmentUrl, '_blank')}
                                                onError={(e) => {
                                                    // If image fails, show as file link instead
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const link = document.createElement('a');
                                                    link.href = attachmentUrl;
                                                    link.target = '_blank';
                                                    link.className = 'flex items-center gap-2 text-sm underline opacity-90 hover:opacity-100 p-2 bg-black/20 rounded-lg';
                                                    link.innerHTML = '📎 View Attachment';
                                                    target.parentElement?.appendChild(link);
                                                }}
                                            />
                                        ) : (
                                            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline opacity-90 hover:opacity-100 p-2 bg-black/20 rounded-lg">
                                                <FiFileText /> View Attachment
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Voice note */}
                                {voiceUrl && (
                                    <div className="mt-2">
                                        <audio controls src={voiceUrl} className="w-full max-w-[250px] h-10 rounded shadow" />
                                    </div>
                                )}

                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'opacity-80' : 'opacity-50'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Attachments & Voice Previews */}
            {(attachment || voiceNote) && (
                <div className="px-3 md:px-4 py-2 border-t border-[#721C97]/30 bg-[#110A15]/90 flex gap-2 md:gap-3 items-center flex-wrap shrink-0">
                    {attachment && (
                        <div className="flex items-center gap-2 bg-[#721C97]/20 px-3 py-1.5 rounded-lg border border-[#721C97]/50 max-w-full">
                            {attachment.type.startsWith('image/') ? <FiImage className="text-[#C1FF72] shrink-0" /> : <FiFileText className="text-[#C1FF72] shrink-0" />}
                            <span className="text-sm text-gray-200 truncate max-w-[150px] md:max-w-[200px]">{attachment.name}</span>
                            <button type="button" onClick={() => setAttachment(null)} className="text-red-400 hover:text-red-300 ml-1 shrink-0">×</button>
                        </div>
                    )}
                    {voiceNote && (
                        <div className="flex items-center gap-2 bg-[#721C97]/20 px-3 py-1.5 rounded-lg border border-[#721C97]/50">
                            <FiMic className="text-[#C1FF72] shrink-0" />
                            <audio controls src={URL.createObjectURL(voiceNote)} className="h-8 max-w-[140px] md:max-w-[180px]" />
                            <button type="button" onClick={clearVoiceNote} className="text-red-400 hover:text-red-300 ml-1 shrink-0">×</button>
                        </div>
                    )}
                </div>
            )}

            {/* Input Bar */}
            <form onSubmit={sendMessage} className="p-2 md:p-4 border-t border-[#721C97]/30 bg-[#110A15]/80 flex gap-1.5 md:gap-2 items-center shrink-0">
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) setAttachment(e.target.files[0]);
                    }}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 md:p-3 bg-[#721C97]/20 text-[#C1FF72] rounded-xl hover:bg-[#721C97]/40 transition-colors shrink-0">
                    <FiPaperclip className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {isRecording ? (
                    <div className="flex-1 flex items-center gap-2 md:gap-3 bg-[#721C97]/20 border border-red-500/50 rounded-2xl px-3 md:px-4 py-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0"></div>
                        <span className="text-red-400 font-mono text-sm">{formatTime(recordingTime)}</span>
                        <button type="button" onClick={cancelRecording} className="ml-auto text-gray-400 hover:text-white text-xs md:text-sm">Cancel</button>
                        <button type="button" onClick={stopRecording} className="text-[#C1FF72] hover:text-white font-semibold text-xs md:text-sm">Stop</button>
                    </div>
                ) : (
                    <>
                        <button type="button" onClick={startRecording} className="p-2.5 md:p-3 bg-[#721C97]/20 text-[#C1FF72] rounded-xl hover:bg-[#721C97]/40 transition-colors shrink-0">
                            <FiMic className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 min-w-0 bg-[#070308] border border-[#721C97]/50 rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-[#C1FF72]"
                        />
                    </>
                )}

                <button type="submit" disabled={sending || (!inputText.trim() && !attachment && !voiceNote)} className="p-2.5 md:p-3 bg-[#C1FF72] text-[#070308] rounded-xl hover:bg-[#aef552] transition-colors disabled:opacity-50 flex items-center justify-center shrink-0">
                    <FiSend className="w-4 h-4 md:w-5 md:h-5" />
                </button>
            </form>
        </div>
    ) : (
        <div className={`${showChatPanel ? 'flex' : 'hidden md:flex'} flex-1 flex-col items-center justify-center bg-[#070308]/50 text-gray-500`}>
            <FiMessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p>Select a chat to begin messaging.</p>
        </div>
    );

    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] w-full max-w-7xl mx-auto rounded-none md:rounded-2xl border-0 md:border border-[#721C97]/30 bg-[#070308]/60 shadow-2xl overflow-hidden flex animate-fade-in backdrop-blur-xl">
            {conversationListPanel}
            {chatPanel}

            {/* New Chat Modal */}
            {isNewChatModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
                    <div className="bg-[#110A15] border border-[#721C97]/50 rounded-t-2xl md:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in max-h-[85vh] md:max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-[#721C97]/30 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-white">New Conversation</h3>
                            <button onClick={() => setIsNewChatModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                            <div className="mb-4">
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                        className="w-full bg-[#070308] border border-[#721C97]/30 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#C1FF72]"
                                    />
                                </div>
                            </div>
                            {selectedUsers.length > 1 && (
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-400 mb-1">Group Name</label>
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        className="w-full bg-[#070308] border border-[#721C97]/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#C1FF72]"
                                        placeholder="Enter group name (optional)"
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                {filteredUsers.length === 0 ? (
                                    <div className="text-center text-gray-500 py-4">No users found.</div>
                                ) : (
                                    filteredUsers.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => {
                                                if (selectedUsers.includes(user.id)) {
                                                    setSelectedUsers(prev => prev.filter(id => id !== user.id));
                                                } else {
                                                    setSelectedUsers(prev => [...prev, user.id]);
                                                }
                                            }}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${selectedUsers.includes(user.id) ? 'bg-[#721C97]/20 border-[#C1FF72]' : 'bg-[#070308] border-transparent hover:border-[#721C97]/50'}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#721C97] to-[#110A15] flex items-center justify-center text-[#C1FF72] font-bold">
                                                {user.first_name?.[0] || user.email[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
                                                <p className="text-gray-400 text-xs truncate">{user.email}</p>
                                            </div>
                                            {selectedUsers.includes(user.id) && (
                                                <div className="w-5 h-5 rounded-full bg-[#C1FF72] flex items-center justify-center shrink-0">
                                                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t border-[#721C97]/30 flex justify-end gap-3 bg-black/20 shrink-0">
                            <button
                                onClick={() => setIsNewChatModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateChat}
                                disabled={selectedUsers.length === 0}
                                className="px-6 py-2 rounded-xl bg-[#C1FF72] text-[#070308] font-semibold hover:bg-[#aef552] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(193,255,114,0.1)]"
                            >
                                Start Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
