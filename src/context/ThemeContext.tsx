import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { storage, StorageKeys } from '../lib/storage';
import {
  DEFAULT_THEME,
  isLightTheme,
  themes,
  type ThemeColors,
  type ThemeName,
} from '../theme';

interface ThemeContextValue {
  name: ThemeName;
  colors: ThemeColors;
  /** True for themes with a light background (dark status bar, light chrome). */
  isLight: boolean;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const isThemeName = (value: unknown): value is ThemeName =>
  typeof value === 'string' && value in themes;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState<ThemeName>(DEFAULT_THEME);

  // Load the saved choice on launch (falls back to the default theme).
  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await storage.get<string>(StorageKeys.theme);
      if (active && isThemeName(saved)) setName(saved);
    })();
    return () => {
      active = false;
    };
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setName(next);
    storage.set(StorageKeys.theme, next);
  }, []);

  const value = useMemo(
    () => ({
      name,
      colors: themes[name],
      isLight: isLightTheme(name),
      setTheme,
    }),
    [name, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

/**
 * Builds a component's styles from the active theme's colours. Pass a
 * module-level factory (so its identity is stable) and the result is
 * memoised until the theme changes:
 *
 *   const makeStyles = (colors: ThemeColors) => StyleSheet.create({ ... });
 *   const styles = useThemedStyles(makeStyles);
 */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
