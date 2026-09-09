import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MultiProvider } from './src/components/MultiProvider';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider } from './src/context/AuthContext';
import { LibraryProvider } from './src/context/LibraryContext';
import { RootNavigator } from './src/navigation/RootNavigator';

// Outermost first. Auth must sit above Library (Library reads the auth state).
const providers = [LanguageProvider, AuthProvider, LibraryProvider];

export default function App() {
  return (
    <SafeAreaProvider>
      <MultiProvider providers={providers}>
        <StatusBar style="light" />
        <RootNavigator />
      </MultiProvider>
    </SafeAreaProvider>
  );
}
