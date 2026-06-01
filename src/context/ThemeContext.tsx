import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = { dark: boolean; toggleDark: () => void };

const ThemeContext = createContext<ThemeContextType>({ dark: false, toggleDark: () => {} });

const DARK_KEY = 'darkMode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DARK_KEY).then(v => { if (v === 'true') setDark(true); });
  }, []);

  const toggleDark = () => {
    setDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(DARK_KEY, String(next));
      return next;
    });
  };

  return <ThemeContext.Provider value={{ dark, toggleDark }}>{children}</ThemeContext.Provider>;
}

export function useDarkMode() {
  return useContext(ThemeContext);
}
