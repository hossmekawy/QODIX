'use client';
import { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiAlertCircle, FiSettings, FiBriefcase, FiCheck } from 'react-icons/fi';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

type Notification = {
    id: number;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    related_link: string;
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: number) => {
        try {
            await api.post('/notifications/mark-read/', { notification_ids: [id] });
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-all-read/');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'task': return <FiCheckCircle className="text-blue-400" />;
            case 'deadline': return <FiClock className="text-yellow-400" />;
            case 'payment': return <FiBriefcase className="text-green-400" />;
            case 'system': return <FiAlertCircle className="text-gray-400" />;
            default: return <FiAlertCircle className="text-[#C1FF72]" />;
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading notifications...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#C1FF72] to-[#721C97]">
                        Notifications Center
                    </h1>
                    <p className="text-gray-400 mt-2">All your system alerts in one place.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 border border-[#721C97]/50 bg-[#721C97]/10 hover:bg-[#721C97]/30 px-4 py-2 rounded-lg text-sm text-[#C1FF72] transition-colors"
                    >
                        <FiCheck /> Mark all as read
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/settings?tab=notifications')}
                        className="flex items-center justify-center p-2.5 rounded-lg border border-[#721C97]/30 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <FiSettings />
                    </button>
                </div>
            </div>

            <div className="bg-[#110A15] border border-[#721C97]/30 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <FiCheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>You have no notifications.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#721C97]/20">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 hover:bg-white/5 transition-colors flex gap-4 ${!notif.is_read ? 'bg-[#721C97]/5 cursor-pointer' : 'opacity-70'}`}
                                onClick={() => !notif.is_read && markAsRead(notif.id)}
                            >
                                <div className="mt-1 flex-shrink-0 bg-[#070308] p-2 rounded-full border border-[#721C97]/30">
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-sm font-medium ${!notif.is_read ? 'text-white' : 'text-gray-300'}`}>
                                            {notif.title}
                                        </p>
                                        <p className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                                            {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">{notif.message}</p>
                                    {notif.related_link && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); router.push(notif.related_link); }}
                                            className="mt-2 text-xs text-[#C1FF72] hover:underline"
                                        >
                                            View Details &rarr;
                                        </button>
                                    )}
                                </div>
                                {!notif.is_read && (
                                    <div className="flex flex-shrink-0 items-center">
                                        <div className="w-2.5 h-2.5 bg-[#C1FF72] rounded-full shadow-[0_0_8px_#C1FF72]"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
