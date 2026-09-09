import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LibraryStack } from './LibraryStack';
import { DiaryScreen } from '../screens/DiaryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useLanguage } from '../context/LanguageContext';
import { typography } from '../theme';
import type { TabParamList } from './types';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  LibraryTab: 'albums',
  DiaryTab: 'calendar',
  ProfileTab: 'person',
};

export function MainTabs() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { ...typography.tiny },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="LibraryTab"
        component={LibraryStack}
        options={{ title: t('libraryTab') }}
      />
      <Tab.Screen
        name="DiaryTab"
        component={DiaryScreen}
        options={{ title: t('diaryTab') }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: t('meTab') }}
      />
    </Tab.Navigator>
  );
}
