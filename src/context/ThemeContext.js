import React, { createContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { getSettings, saveSettings } from '../storage/storage';

export const ThemeContext = createContext();

const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    secondary: '#8B5CF6',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
};

const darkTheme = {
  mode: 'dark',
  colors: {
    primary: '#818CF8',
    primaryDark: '#6366F1',
    secondary: '#A78BFA',
    background: '#111827',
    surface: '#1F2937',
    card: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const settings = await getSettings();
    const savedTheme = settings.theme || 'auto';
    
    if (savedTheme === 'auto') {
      const systemTheme = Appearance.getColorScheme();
      setIsDark(systemTheme === 'dark');
      setTheme(systemTheme === 'dark' ? darkTheme : lightTheme);
    } else {
      setIsDark(savedTheme === 'dark');
      setTheme(savedTheme === 'dark' ? darkTheme : lightTheme);
    }
  };

  const toggleTheme = async (newTheme) => {
    const themeMode = newTheme || (isDark ? 'light' : 'dark');
    setIsDark(themeMode === 'dark');
    setTheme(themeMode === 'dark' ? darkTheme : lightTheme);
    
    const settings = await getSettings();
    await saveSettings({ ...settings, theme: themeMode });
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

