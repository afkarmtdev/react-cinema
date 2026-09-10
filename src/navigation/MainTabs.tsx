import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { LibraryStack } from './LibraryStack';
import { DiaryScreen } from '../screens/DiaryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useLanguage } from '../context/LanguageContext';
import { FloatingTabBar } from '../components/FloatingTabBar';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function MainTabs() {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // The pill floats over the content, so the navigator must not
        // reserve space for it under each screen.
        tabBarStyle: { position: 'absolute' },
      }}
    >
      <Tab.Screen
        name="LibraryTab"
        component={LibraryStack}
        options={({ route }) => {
          // Hide the pill on the detail and form screens inside the stack, so
          // it never covers a form's bottom row.
          const nested = getFocusedRouteNameFromRoute(route) ?? 'Library';
          return {
            title: t('libraryTab'),
            tabBarStyle: {
              position: 'absolute',
              display: nested === 'Library' ? 'flex' : 'none',
            },
          };
        }}
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
