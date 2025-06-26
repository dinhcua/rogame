import { useState, useEffect } from 'react';

interface Settings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  startupLaunch: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  language: 'en',
  notifications: true,
  startupLaunch: false,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return {
    settings,
    updateSetting,
  };
};