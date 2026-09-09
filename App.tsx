import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MultiProvider } from './src/components/MultiProvider';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider } from './src/context/AuthContext';
import { LibraryProvider } from './src/context/LibraryContext';
import { RootNavigator } from './src/navigation/RootNavigator';

// Outermost first. Auth must sit above Library (Library reads the auth state).
const providers = [
  ThemeProvider,
  LanguageProvider,
  AuthProvider,
  LibraryProvider,
];

/** Light themes need dark status bar text; everything else stays light. */
function ThemedStatusBar() {
  const { isLight } = useTheme();
  return <StatusBar style={isLight ? 'dark' : 'light'} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MultiProvider providers={providers}>
        <ThemedStatusBar />
        <RootNavigator />
      </MultiProvider>
    </SafeAreaProvider>
  );
}
