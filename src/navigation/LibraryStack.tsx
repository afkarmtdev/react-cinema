import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useLanguage } from '../context/LanguageContext';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { ItemDetailScreen } from '../screens/library/ItemDetailScreen';
import { ItemFormScreen } from '../screens/library/ItemFormScreen';
import { colors } from '../theme';
import type { LibraryStackParamList } from './types';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStack() {
  const { t } = useLanguage();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Library"
        component={LibraryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen
        name="ItemForm"
        component={ItemFormScreen}
        options={({ route }) => ({
          title: route.params?.itemId ? t('editHeading') : t('addHeading'),
          presentation: 'modal',
        })}
      />
    </Stack.Navigator>
  );
}
