import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import { SplashScreen } from '../screens/SplashScreen';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

const MIN_SPLASH_MS = 1400;

export function RootNavigator() {
  const { user, initializing } = useAuth();
  const { colors, isLight } = useTheme();
  const navTheme = useMemo<Theme>(() => {
    const base = isLight ? DefaultTheme : DarkTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [colors, isLight]);
  // Keep the branded splash up briefly even on fast cold starts.
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  if (initializing || !minTimePassed) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
