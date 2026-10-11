import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { DiaryScreen } from '../screens/DiaryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ItemDetailScreen } from '../screens/library/ItemDetailScreen';
import { ItemFormScreen } from '../screens/library/ItemFormScreen';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import type {
  DiaryStackParamList,
  EntryStackParamList,
  LibraryStackParamList,
  ProfileStackParamList,
} from './types';

const LibraryNav = createNativeStackNavigator<LibraryStackParamList>();
const DiaryNav = createNativeStackNavigator<DiaryStackParamList>();
const ProfileNav = createNativeStackNavigator<ProfileStackParamList>();

const rootOptions: NativeStackNavigationOptions = { headerShown: false };

/** Header styling for every tab stack, and the options of the entry screens. */
function useStackOptions() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const screenOptions: NativeStackNavigationOptions = {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.primary,
    headerTitleStyle: { color: colors.text },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
  };
  const detail = ({
    route,
  }: {
    route: { params: EntryStackParamList['ItemDetail'] };
  }): NativeStackNavigationOptions => ({ title: route.params.title });
  const form = ({
    route,
  }: {
    route: { params?: EntryStackParamList['ItemForm'] };
  }): NativeStackNavigationOptions => ({
    title: route.params?.itemId ? t('editHeading') : t('addHeading'),
    presentation: 'modal',
  });
  return { screenOptions, detail, form };
}

export function LibraryStack() {
  const { screenOptions, detail, form } = useStackOptions();
  return (
    <LibraryNav.Navigator screenOptions={screenOptions}>
      <LibraryNav.Screen
        name="Library"
        component={LibraryScreen}
        options={rootOptions}
      />
      <LibraryNav.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={detail}
      />
      <LibraryNav.Screen
        name="ItemForm"
        component={ItemFormScreen}
        options={form}
      />
    </LibraryNav.Navigator>
  );
}

export function DiaryStack() {
  const { screenOptions, detail, form } = useStackOptions();
  return (
    <DiaryNav.Navigator screenOptions={screenOptions}>
      <DiaryNav.Screen
        name="Diary"
        component={DiaryScreen}
        options={rootOptions}
      />
      <DiaryNav.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={detail}
      />
      <DiaryNav.Screen
        name="ItemForm"
        component={ItemFormScreen}
        options={form}
      />
    </DiaryNav.Navigator>
  );
}

export function ProfileStack() {
  const { screenOptions, detail, form } = useStackOptions();
  return (
    <ProfileNav.Navigator screenOptions={screenOptions}>
      <ProfileNav.Screen
        name="Profile"
        component={ProfileScreen}
        options={rootOptions}
      />
      <ProfileNav.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={detail}
      />
      <ProfileNav.Screen
        name="ItemForm"
        component={ItemFormScreen}
        options={form}
      />
    </ProfileNav.Navigator>
  );
}
