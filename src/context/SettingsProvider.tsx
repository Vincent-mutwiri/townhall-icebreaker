"use client";

import { createContext, useContext, useState, useEffect } from 'react';

type SettingsContextType = {
  backgroundUrl?: string;
  musicUrl?: string;
  logoUrl?: string;
  isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType>({ isLoading: true });

export const useSettings = () => useContext(SettingsContext);

export const useBackgroundSettings = () => {
  const { backgroundUrl, musicUrl } = useSettings();
  return { backgroundUrl, musicUrl };
};

export const useLogoSettings = () => {
  const { logoUrl } = useSettings();
  return { logoUrl };
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SettingsContextType>({ isLoading: true });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (res.ok) {
          setSettings({ ...data, isLoading: false });
        } else {
          setSettings({ isLoading: false });
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
        setSettings({ isLoading: false });
      }
    };
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
};