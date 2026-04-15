import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, type ThemeMode, type ThemeColors } from '@/lib/theme';

const THEME_STORAGE_KEY = '@legends_theme_mode';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const systemScheme = useSystemColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();

  const isDark =
    theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
  const colors = isDark ? themes.dark : themes.light;

  // Load persisted theme on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored);
      }
    });
  }, []);

  // Sync NativeWind color scheme whenever isDark changes
  useEffect(() => {
    setColorScheme(isDark ? 'dark' : 'light');
  }, [isDark, setColorScheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
