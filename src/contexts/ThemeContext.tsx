/**
 * ThemeContext - Provides theme access throughout the app
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, type Theme } from '../theme/theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  forceDark?: boolean; // For testing or user preference override
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  forceDark,
}) => {
  const systemColorScheme = useColorScheme();
  const isDark = forceDark !== undefined ? forceDark : systemColorScheme === 'dark';
  const theme = getTheme(isDark);

  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
