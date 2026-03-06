'use client';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { FiMenu, FiBell, FiCheckCircle, FiClock, FiBriefcase, FiAlertCircle, FiUser, FiLogOut, FiChevronDown, FiMessageSquare } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

export default function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
    const router = useRouter();
    const { settings } = useSettings();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const notifDropdownRef = useRef<HTMLDivElement>(null);
    const userDropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
    };

    // Fetch current user profile
    useEffect(() => {
        api.get('/accounts/profile/')
            .then(res => setCurrentUser(res.data))
            .catch(() => { });
    }, []);

    // --- WebSocket for real-time notification updates (replaces polling) ---
    const notifWs = useRef<WebSocket | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        // Fetch initial unread count once on mount
        api.get('/notifications/unread-count/')
            .then(res => setUnreadCount(res.data.unread_count))
            .catch(() => { });

        // Connect to notification WebSocket
        const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
        const wsUrl = `ws://${host}:8000/ws/notifications/?token=${token}`;
        let reconnectTimer: ReturnType<typeof setTimeout>;
        let isComponentMounted = true;
        let reconnectDelay = 5000;

        const connectWs = () => {
            if (!isComponentMounted) return;
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log('Notification WS connected');
                reconnectDelay = 5000; // Reset delay on success
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'unread_count') {
                        setUnreadCount(prev => {
                            if (data.count > prev) {
                                const audio = new Audio('/notification-sound.mp3');
                                audio.play().catch(() => { });
                            }
                            return data.count;
                        });
                    }
                } catch (e) { }
            };

            socket.onclose = () => {
                if (isComponentMounted) {
                    console.log(`WebSocket closed. Reconnecting in ${reconnectDelay / 1000}s...`);
                    reconnectTimer = setTimeout(connectWs, reconnectDelay);
                    reconnectDelay = Math.min(reconnectDelay * 2, 60000); // Cap at 60s
                }
            };

            socket.onerror = () => {
                socket.close();
            };

            notifWs.current = socket;
        };

        connectWs();

        return () => {
            isComponentMounted = false;
            clearTimeout(reconnectTimer);
            if (notifWs.current) {
                notifWs.current.close();
                notifWs.current = null;
            }
        };
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
                setShowNotifDropdown(false);
            }
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleNotifDropdown = async () => {
        setShowNotifDropdown(!showNotifDropdown);
        setShowUserDropdown(false);
        if (!showNotifDropdown) {
            try {
                const res = await api.get('/notifications/');
                setRecentNotifications(res.data.slice(0, 5));
            } catch (err) {
                console.error(err);
            }
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.post('/notifications/mark-read/', { notification_ids: [id] });
            setRecentNotifications(recentNotifications.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'task': return <FiCheckCircle className="text-blue-400" />;
            case 'deadline': return <FiClock className="text-yellow-400" />;
            case 'payment': return <FiBriefcase className="text-green-400" />;
            case 'message': return <FiMessageSquare className="text-purple-400" />;
            case 'system': return <FiAlertCircle className="text-gray-400" />;
            default: return <FiAlertCircle className="text-[#C1FF72]" />;
        }
    };

    const userDisplayName = currentUser
        ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username || currentUser.email
        : '';

    const userInitials = currentUser
        ? (currentUser.first_name?.[0] || currentUser.email?.[0] || 'U').toUpperCase()
        : 'U';

    return (
        <header className="flex h-16 w-full items-center justify-between border-b border-[#721C97]/30 bg-[#070308]/80 backdrop-blur-md px-4 md:px-6 shadow-sm z-50 shrink-0 relative">
            <div className="flex items-center gap-3 md:gap-4">
                {toggleSidebar && (
                    <button
                        onClick={toggleSidebar}
                        className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <FiMenu className="h-6 w-6" />
                    </button>
                )}
                {settings?.logo ? (
                    <img src={settings.logo} alt="Company Logo" className="h-8 max-w-[120px] object-contain" />
                ) : (
                    <h1 className="text-lg md:text-xl font-bold text-white tracking-widest hidden sm:block">
                        <span className="text-[#C1FF72]">{settings?.name?.split(' ')[0] || 'QODIX'}</span> {settings?.name?.split(' ').slice(1).join(' ') || 'PORTAL'}
                    </h1>
                )}
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                {/* Chat Link */}
                <Link
                    href="/dashboard/chat"
                    className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                >
                    <FiMessageSquare className="h-5 w-5" />
                </Link>

                {/* Notifications */}
                <div ref={notifDropdownRef} className="relative">
                    <button
                        onClick={toggleNotifDropdown}
                        className={`relative p-2 text-gray-400 hover:text-white transition-colors rounded-full ${showNotifDropdown ? 'bg-white/10 text-white' : ''}`}
                    >
                        <FiBell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifDropdown && (
                        <div className="absolute right-0 mt-2 w-80 bg-[#110A15] border border-[#721C97]/50 rounded-xl shadow-2xl overflow-hidden z-[9999] animate-fade-in">
                            <div className="px-4 py-3 border-b border-[#721C97]/30 flex justify-between items-center bg-[#070308]">
                                <h3 className="font-semibold text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                                )}
                            </div>

                            <div className="max-h-[320px] overflow-y-auto divide-y divide-[#721C97]/20">
                                {recentNotifications.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-gray-400">
                                        No recent notifications.
                                    </div>
                                ) : (
                                    recentNotifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            className={`p-3 hover:bg-white/5 transition-colors flex gap-3 cursor-pointer ${!notif.is_read ? 'bg-[#721C97]/10' : ''}`}
                                            onClick={() => {
                                                if (!notif.is_read) markAsRead(notif.id);
                                                setShowNotifDropdown(false);
                                                if (notif.related_link) router.push(notif.related_link);
                                            }}
                                            role="button"
                                        >
                                            <div className="mt-0.5">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium leading-tight mb-1 line-clamp-2 ${!notif.is_read ? 'text-white' : 'text-gray-300'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {!notif.is_read && (
                                                <div className="w-2 h-2 mt-1.5 bg-[#C1FF72] rounded-full shrink-0 shadow-[0_0_8px_#C1FF72]"></div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-2 border-t border-[#721C97]/30 bg-[#070308]">
                                <Link
                                    href="/dashboard/notifications"
                                    onClick={() => setShowNotifDropdown(false)}
                                    className="block w-full text-center py-2 text-sm text-[#C1FF72] hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    View All Notifications
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile Dropdown */}
                <div ref={userDropdownRef} className="relative">
                    <button
                        onClick={() => { setShowUserDropdown(!showUserDropdown); setShowNotifDropdown(false); }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all hover:bg-white/5 ${showUserDropdown ? 'bg-white/10' : ''}`}
                    >
                        {currentUser?.picture ? (
                            <img src={currentUser.picture.startsWith('data:') ? currentUser.picture : currentUser.picture.startsWith('http') ? currentUser.picture : `data:image/png;base64,${currentUser.picture}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover border-2 border-[#721C97]/50" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#721C97] to-[#C1FF72] flex items-center justify-center text-white font-bold text-sm">
                                {userInitials}
                            </div>
                        )}
                        <span className="text-sm font-medium text-gray-200 hidden md:block max-w-[120px] truncate">
                            {userDisplayName}
                        </span>
                        <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform hidden md:block ${showUserDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showUserDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-[#110A15] border border-[#721C97]/50 rounded-xl shadow-2xl overflow-hidden z-[9999] animate-fade-in">
                            {/* User info header */}
                            <div className="px-4 py-3 border-b border-[#721C97]/30 bg-[#070308]">
                                <p className="text-sm font-semibold text-white truncate">{userDisplayName}</p>
                                <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
                            </div>

                            <div className="py-1">
                                <Link
                                    href="/dashboard/profile"
                                    onClick={() => setShowUserDropdown(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <FiUser className="w-4 h-4 text-[#C1FF72]" />
                                    My Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full text-left"
                                >
                                    <FiLogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
