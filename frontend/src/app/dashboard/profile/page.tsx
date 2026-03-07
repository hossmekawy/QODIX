'use client';
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiUpload, FiX, FiCheck } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<any>({});
    const [editPreview, setEditPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const editFileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const toast = useToast();

    // Security Forms State
    const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [pinForm, setPinForm] = useState({ old_pin: '', new_pin: '', confirm_pin: '' });
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isSavingPin, setIsSavingPin] = useState(false);

    // Notification State
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const fetchProfile = () => {
        api.get('/accounts/profile/')
            .then((res) => {
                setProfile(res.data);
                setEditFormData({
                    first_name: res.data.first_name,
                    last_name: res.data.last_name,
                    username: res.data.username,
                    email: res.data.email,
                    phone_number: res.data.phone_number,
                });
                setEditPreview(res.data.picture ? `data:image/jpeg;base64,${res.data.picture}` : null);
            })
            .catch(() => {
                router.push('/login');
            });

        // Load local notification preference
        const notifs = localStorage.getItem('notifications_enabled');
        setNotificationsEnabled(notifs === 'true');
    };

    useEffect(() => {
        fetchProfile();
    }, [router]);

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setEditPreview(base64String);
                const rawBase64 = base64String.split(',')[1];
                setEditFormData({ ...editFormData, picture: rawBase64 });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.patch('/accounts/profile/', editFormData);
            fetchProfile();
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast.error("New passwords do not match.");
            return;
        }
        setIsSavingPassword(true);
        try {
            await api.put('/accounts/profile/change-password/', {
                old_password: passwordForm.old_password,
                new_password: passwordForm.new_password
            });
            toast.success("Password changed successfully.");
            setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.old_password?.[0] || "Failed to change password.");
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handlePinChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pinForm.new_pin !== pinForm.confirm_pin) {
            toast.error("New PINs do not match.");
            return;
        }
        if (pinForm.new_pin.length !== 4) {
            toast.error("PIN must be exactly 4 digits.");
            return;
        }
        setIsSavingPin(true);
        try {
            await api.put('/accounts/profile/change-pin/', {
                old_pin: pinForm.old_pin,
                new_pin: pinForm.new_pin
            });
            toast.success("PIN changed successfully.");
            setPinForm({ old_pin: '', new_pin: '', confirm_pin: '' });
            fetchProfile(); // refresh to get updated PIN status if needed
        } catch (error: any) {
            toast.error(error.response?.data?.old_pin?.[0] || "Failed to change PIN.");
        } finally {
            setIsSavingPin(false);
        }
    };

    const toggleNotifications = () => {
        const newState = !notificationsEnabled;
        setNotificationsEnabled(newState);
        localStorage.setItem('notifications_enabled', String(newState));
        toast.success(newState ? "Notifications enabled." : "Notifications muted.");
    };

    if (!profile) {
        return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    }

    return (
        <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="relative overflow-hidden rounded-2xl border border-[#721C97]/30 bg-[#070308] p-8 shadow-[0_8px_32px_rgba(114,28,151,0.15)]">
                {/* Background decorative elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#721C97] rounded-full mix-blend-screen filter blur-[80px] opacity-20"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#C1FF72] rounded-full mix-blend-screen filter blur-[80px] opacity-10 pointer-events-none"></div>

                {isEditing ? (
                    <form onSubmit={handleSaveProfile} className="relative z-10 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8 border-b border-[#721C97]/30 pb-4">
                            <h2 className="text-2xl font-bold text-white">Edit Your Profile</h2>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl text-gray-400 hover:bg-white/5 transition-colors flex items-center gap-2 font-bold">
                                    <FiX /> Cancel
                                </button>
                                <button type="submit" disabled={isSaving} className="px-5 py-2 rounded-xl bg-[#C1FF72] text-[#070308] font-bold shadow-[0_0_15px_rgba(193,255,114,0.3)] hover:bg-[#aef556] transition-colors flex items-center gap-2">
                                    {isSaving ? 'Saving...' : <><FiCheck /> Save Changes</>}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mb-8 md:mb-10">
                            <div className="flex flex-col items-center shrink-0">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#C1FF72] to-[#721C97] rounded-full blur group-hover:blur-md transition-all duration-300 opacity-50"></div>
                                    <div
                                        onClick={() => editFileInputRef.current?.click()}
                                        className="relative h-28 w-28 md:h-32 md:w-32 rounded-full border-2 border-[#721C97]/50 bg-[#070308] flex items-center justify-center cursor-pointer hover:border-[#C1FF72] transition-colors overflow-hidden z-10 shadow-lg"
                                    >
                                        {editPreview ? (
                                            <>
                                                <img src={editPreview} alt="Preview" className="h-full w-full object-cover" />
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                    <FiUpload className="text-[#C1FF72] text-xl mb-1" />
                                                    <span className="text-[10px] text-white font-bold tracking-widest uppercase text-center">Change</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-[#C1FF72] transition-colors">
                                                <FiUpload className="text-2xl mb-1" />
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-center leading-tight">Upload<br />Photo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={editFileInputRef}
                                    onChange={handleEditFileChange}
                                />
                            </div>

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.first_name || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                        className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.last_name || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                        className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none"
                                    />
                                </div>
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={editFormData.username || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                                        className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={editFormData.email || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                        className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={editFormData.phone_number || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                                        className="w-full bg-[#070308]/50 border border-[#721C97]/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#C1FF72] focus:ring-1 focus:ring-[#C1FF72] transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="group flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#721C97]/20 border border-[#721C97]/50 rounded-xl text-[#C1FF72] font-bold text-xs md:text-sm tracking-wide hover:bg-[#721C97]/40 hover:border-[#C1FF72]/50 transition-all shadow-[0_0_15px_rgba(114,28,151,0.2)]"
                            >
                                <FiEdit2 className="group-hover:scale-110 transition-transform" />
                                <span className="hidden sm:inline">Edit Profile</span>
                                <span className="sm:hidden">Edit</span>
                            </button>
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-8 md:mb-10 border-b border-[#721C97]/30 pb-6 md:pb-8 animate-in fade-in duration-300">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#C1FF72] to-[#721C97] rounded-full blur group-hover:blur-md transition-all duration-300 opacity-70"></div>
                                {profile.picture ? (
                                    <img
                                        src={`data:image/jpeg;base64,${profile.picture}`}
                                        alt="Profile"
                                        className="relative h-28 w-28 md:h-32 md:w-32 rounded-full object-cover shadow-2xl border-2 border-[#070308] z-10"
                                    />
                                ) : (
                                    <div className="relative flex h-28 w-28 md:h-32 md:w-32 items-center justify-center rounded-full bg-[#070308] text-3xl md:text-4xl font-bold text-[#C1FF72] shadow-2xl border-2 border-[#721C97] z-10">
                                        {profile.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="text-center md:text-left">
                                <div className="inline-block px-3 py-1 mb-2 text-[10px] font-semibold tracking-wider text-[#070308] uppercase bg-[#C1FF72] rounded-full shadow-[0_0_10px_rgba(193,255,114,0.3)]">
                                    {profile.role || 'User'}
                                </div>
                                <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-1 md:mb-2">
                                    {profile.first_name} {profile.last_name}
                                </h2>
                                <p className="text-sm md:text-lg text-gray-400 font-mono">@{profile.username}</p>
                            </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:gap-8">
                            <div className="rounded-xl border border-white/5 bg-white/5 p-4 md:p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-[#721C97]/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-1.5 rounded-lg bg-[#721C97]/20 text-[#C1FF72]">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-[10px] font-medium text-gray-400 tracking-wide uppercase">Email Address</h3>
                                </div>
                                <p className="text-base md:text-xl text-white font-medium pl-10 md:pl-12 break-all">{profile.email}</p>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-white/5 p-4 md:p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-[#721C97]/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-1.5 rounded-lg bg-[#721C97]/20 text-[#C1FF72]">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-[10px] font-medium text-gray-400 tracking-wide uppercase">Phone Number</h3>
                                </div>
                                <p className="text-base md:text-xl text-white font-medium pl-10 md:pl-12">{profile.phone_number || 'Not provided'}</p>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-white/5 p-4 md:p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-[#721C97]/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-1.5 rounded-lg bg-[#721C97]/20 text-[#C1FF72]">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-[10px] font-medium text-gray-400 tracking-wide uppercase">Last Sign In</h3>
                                </div>
                                <p className="text-sm md:text-lg text-white font-medium pl-10 md:pl-12">
                                    {new Date(profile.last_signin).toLocaleString()}
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-white/5 p-4 md:p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-[#721C97]/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-1.5 rounded-lg bg-[#721C97]/20 text-[#C1FF72]">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-[10px] font-medium text-gray-400 tracking-wide uppercase">Login Frequency</h3>
                                </div>
                                <p className="text-sm md:text-lg text-white font-medium pl-10 md:pl-12">{profile.avg_signin}</p>
                            </div>
                        </div>

                        {/* Security & Preferences Section */}
                        <div className="relative z-10 pt-8 mt-8 border-t border-[#721C97]/30">
                            <h3 className="text-xl md:text-2xl font-black text-white mb-6 md:mb-8 flex items-center gap-3">
                                <span className="bg-[#721C97] p-1.5 rounded-lg"><FiCheck className="text-[#C1FF72]" /></span>
                                Security & Preferences
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                {/* Change Password Form */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8 hover:border-[#721C97]/50 transition-all">
                                    <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-[#C1FF72] rounded-full"></div>
                                        Update Password
                                    </h4>
                                    <form onSubmit={handlePasswordChange} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Old Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={passwordForm.old_password}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                                                className="w-full bg-[#070308]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#C1FF72] transition-all outline-none"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">New Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordForm.new_password}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                                    className="w-full bg-[#070308]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#C1FF72] transition-all outline-none"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Confirm New</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordForm.confirm_password}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                                    className="w-full bg-[#070308]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#C1FF72] transition-all outline-none"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSavingPassword}
                                            className="w-full mt-2 py-3 bg-[#721C97]/20 border border-[#721C97]/40 text-white font-bold rounded-xl hover:bg-[#721C97]/40 hover:text-[#C1FF72] transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSavingPassword ? (
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-[#C1FF72] rounded-full animate-spin"></div>
                                            ) : 'Update Password'}
                                        </button>
                                    </form>
                                </div>

                                <div className="space-y-6 md:space-y-8">
                                    {/* Change PIN Form */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8 hover:border-[#721C97]/50 transition-all">
                                        <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                            Update System PIN
                                        </h4>
                                        <form onSubmit={handlePinChange} className="space-y-4">
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Current PIN</label>
                                                    <input
                                                        type="password"
                                                        maxLength={4}
                                                        value={pinForm.old_pin}
                                                        onChange={(e) => setPinForm({ ...pinForm, old_pin: e.target.value.replace(/\D/g, '') })}
                                                        className="w-full bg-[#070308]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 transition-all outline-none font-mono tracking-[0.5em]"
                                                        placeholder="••••"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">New 4-Digit PIN</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        maxLength={4}
                                                        value={pinForm.new_pin}
                                                        onChange={(e) => setPinForm({ ...pinForm, new_pin: e.target.value.replace(/\D/g, '') })}
                                                        className="w-full bg-[#070308]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#C1FF72] transition-all outline-none font-mono tracking-[0.5em]"
                                                        placeholder="••••"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Confirm PIN</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        maxLength={4}
                                                        value={pinForm.confirm_pin}
                                                        onChange={(e) => setPinForm({ ...pinForm, confirm_pin: e.target.value.replace(/\D/g, '') })}
                                                        className="w-full bg-[#070308]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#C1FF72] transition-all outline-none font-mono tracking-[0.5em]"
                                                        placeholder="••••"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isSavingPin}
                                                className="w-full mt-2 py-3 bg-blue-500/10 border border-blue-500/30 text-white font-bold rounded-xl hover:bg-blue-500/20 hover:text-blue-300 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isSavingPin ? (
                                                    <div className="w-5 h-5 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin"></div>
                                                ) : 'Update Security PIN'}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Notifications Toggle */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8 hover:border-[#C1FF72]/50 transition-all">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="text-lg font-bold text-white mb-1">Push Notifications</h4>
                                                <p className="text-xs text-gray-400">Receive real-time alerts on your device.</p>
                                            </div>
                                            <button
                                                onClick={toggleNotifications}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notificationsEnabled ? 'bg-[#C1FF72]' : 'bg-gray-700'}`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
