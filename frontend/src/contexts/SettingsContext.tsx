'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

type CompanySettings = {
    name: string;
    logo: string | null;
    currency: string;
    time_zone: string;
};

type SettingsContextType = {
    settings: CompanySettings | null;
    refreshSettings: () => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<CompanySettings | null>(null);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings/company/');
            setSettings(res.data);
        } catch (error) {
            console.error('Failed to fetch settings', error);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
}
