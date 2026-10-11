import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '../../context/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { MainTabs } from '../MainTabs';

// The icon font loader pulls in expo-asset, which is not installed for Jest.
jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

// Stand-ins for the real screens, which need the library and auth contexts.
// Each list screen opens the same entry; the entry screen only goes back.
jest.mock('../../screens/library/LibraryScreen', () => {
  const { Text } = jest.requireActual('react-native');
  return { LibraryScreen: () => <Text>Library list</Text> };
});
jest.mock('../../screens/DiaryScreen', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    DiaryScreen: ({ navigation }: any) => (
      <Text
        onPress={() =>
          navigation.navigate('ItemDetail', { itemId: '1', title: 'Dune' })
        }
      >
        Diary list
      </Text>
    ),
  };
});
jest.mock('../../screens/ProfileScreen', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    ProfileScreen: ({ navigation }: any) => (
      <Text
        onPress={() =>
          navigation.navigate('ItemDetail', { itemId: '1', title: 'Dune' })
        }
      >
        Top four
      </Text>
    ),
  };
});
jest.mock('../../screens/library/ItemDetailScreen', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    ItemDetailScreen: ({ navigation, route }: any) => (
      <Text onPress={() => navigation.goBack()}>
        Entry {route.params.title}
      </Text>
    ),
  };
});
jest.mock('../../screens/library/ItemFormScreen', () => {
  const { Text } = jest.requireActual('react-native');
  return { ItemFormScreen: () => <Text>Form</Text> };
});

const insets = { top: 0, right: 0, bottom: 34, left: 0 };
const frame = { x: 0, y: 0, width: 390, height: 844 };

function renderTabs() {
  render(
    <SafeAreaProvider initialMetrics={{ insets, frame }}>
      <LanguageProvider>
        <ThemeProvider>
          <NavigationContainer>
            <MainTabs />
          </NavigationContainer>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>,
  );
}

describe('MainTabs', () => {
  it.each([
    ['Diary', 'Diary list'],
    ['Me', 'Top four'],
  ])(
    'opens an entry from %s in that tab and goes back there',
    async (tab, list) => {
      renderTabs();
      fireEvent.press(await screen.findByRole('tab', { name: tab }));
      fireEvent.press(await screen.findByText(list));

      const entry = await screen.findByText('Entry Dune');
      // The pill hides while the entry is open.
      expect(screen.queryByRole('tab', { name: tab })).toBeNull();

      fireEvent.press(entry);
      expect(
        await screen.findByRole('tab', { name: tab, selected: true }),
      ).toBeTruthy();
      expect(screen.queryByText('Entry Dune')).toBeNull();
      expect(screen.getByText(list)).toBeTruthy();
    },
  );
});
