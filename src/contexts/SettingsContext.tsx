/**
 * SettingsContext - Global settings state with AsyncStorage persistence
 *
 * Manages user preferences like theme, default font size, etc.
 * Server URL is stored separately in SecureStore for security.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearUrlCache, getBaseUrl, setBaseUrl, validateServerUrl } from '@/api/client';

const SETTINGS_STORAGE_KEY = '@app_settings';

const DEFAULT_SERVER_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://your-server.example.com';

export { validateServerUrl };

export interface Settings {
  darkMode: boolean | null; // null = system default
  defaultFontSize: number;
  useSystemTheme: boolean;
  serverUrl: string;
}

const DEFAULT_SETTINGS: Settings = {
  darkMode: null,
  defaultFontSize: 14,
  useSystemTheme: true,
  serverUrl: DEFAULT_SERVER_URL,
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load general settings from AsyncStorage
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      let parsedSettings = DEFAULT_SETTINGS;
      if (stored) {
        const parsed = JSON.parse(stored);
        parsedSettings = { ...DEFAULT_SETTINGS, ...parsed };
      }

      // Load server URL from SecureStore (more secure for sensitive URLs)
      const serverUrl = await getBaseUrl();
      parsedSettings.serverUrl = serverUrl;

      setSettings(parsedSettings);
    } catch (error) {
      if (__DEV__) console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);

      // Save general settings to AsyncStorage (exclude serverUrl, it goes to SecureStore)
      const { serverUrl: _, ...settingsWithoutServerUrl } = newSettings;
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsWithoutServerUrl));

      // If server URL changed, save to SecureStore
      if (updates.serverUrl !== undefined) {
        await setBaseUrl(updates.serverUrl);
        clearUrlCache();
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to save settings:', error);
      throw error;
    }
  };

  const resetSettings = async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (error) {
      if (__DEV__) console.error('Failed to reset settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
