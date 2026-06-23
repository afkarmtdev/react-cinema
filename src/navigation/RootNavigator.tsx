import {
  DarkTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

const MIN_SPLASH_MS = 1400;

export function RootNavigator() {
  const { user, initializing } = useAuth();
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
