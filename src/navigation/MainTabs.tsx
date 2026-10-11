import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { DiaryStack, LibraryStack, ProfileStack } from './TabStacks';
import { useLanguage } from '../context/LanguageContext';
import { FloatingTabBar } from '../components/FloatingTabBar';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

type TabRoute = Parameters<typeof getFocusedRouteNameFromRoute>[0];

/**
 * Options for a tab holding a stack: the pill shows on the stack's first
 * screen and hides on the entry and form screens pushed on top, so it never
 * covers a form's bottom row.
 */
const stackTab =
  (title: string, root: string) =>
  ({ route }: { route: TabRoute }): BottomTabNavigationOptions => {
    const nested = getFocusedRouteNameFromRoute(route) ?? root;
    return {
      title,
      tabBarStyle: {
        position: 'absolute',
        display: nested === root ? 'flex' : 'none',
      },
    };
  };

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
        options={stackTab(t('libraryTab'), 'Library')}
      />
      <Tab.Screen
        name="DiaryTab"
        component={DiaryStack}
        options={stackTab(t('diaryTab'), 'Diary')}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={stackTab(t('meTab'), 'Profile')}
      />
    </Tab.Navigator>
  );
}
