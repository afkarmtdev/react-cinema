import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '../../context/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { storage, StorageKeys } from '../../lib/storage';
import { LookupSheet } from '../LookupSheet';

// The icon font loader pulls in expo-asset, which is not installed for Jest.
jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

const insets = { top: 0, right: 0, bottom: 34, left: 0 };
const frame = { x: 0, y: 0, width: 390, height: 844 };
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider initialMetrics={{ insets, frame }}>
    <LanguageProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </LanguageProvider>
  </SafeAreaProvider>
);

// Answers each source's search with one result named after its host.
function mockFetch() {
  global.fetch = jest.fn(async (url: string) => {
    const body = url.includes('openlibrary.org')
      ? { docs: [{ key: '/works/OL1W', title: 'Dune (Open Library)' }] }
      : { items: [{ id: 'g1', volumeInfo: { title: 'Dune (Google)' } }] };
    return { ok: true, status: 200, json: async () => body };
  }) as unknown as typeof fetch;
}

function renderSheet(onPick = jest.fn()) {
  render(
    <LookupSheet visible kind="book" onPick={onPick} onClose={jest.fn()} />,
    { wrapper },
  );
  return onPick;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockFetch();
});
afterEach(() => jest.restoreAllMocks());

describe('LookupSheet', () => {
  it('offers both book sources and searches the first one', async () => {
    renderSheet();
    expect(screen.getByText('Open Library')).toBeTruthy();
    expect(screen.getByText('Google Books')).toBeTruthy();

    fireEvent.changeText(
      screen.getByPlaceholderText('Search by title or author'),
      'dune',
    );
    expect(await screen.findByText('Dune (Open Library)')).toBeTruthy();
    expect(screen.getByText('Data from Open Library.')).toBeTruthy();
  });

  it('searches again with another source and remembers the choice', async () => {
    renderSheet();
    fireEvent.changeText(
      screen.getByPlaceholderText('Search by title or author'),
      'dune',
    );
    await screen.findByText('Dune (Open Library)');

    fireEvent.press(screen.getByText('Google Books'));
    expect(await screen.findByText('Dune (Google)')).toBeTruthy();
    await waitFor(async () =>
      expect(await storage.get(StorageKeys.lookupSource)).toEqual({
        book: 'googleBooks',
      }),
    );
  });

  it('opens on the source saved for the kind', async () => {
    await storage.set(StorageKeys.lookupSource, { book: 'googleBooks' });
    renderSheet();
    await waitFor(() =>
      expect(screen.getByText('Data from Google Books.')).toBeTruthy(),
    );
  });

  it('hands the picked result to the form', async () => {
    global.fetch = jest.fn(async (url: string) => {
      const body = url.includes('search.json')
        ? {
            docs: [
              {
                key: '/works/OL1W',
                title: 'Dune',
                author_name: ['Frank Herbert'],
              },
            ],
          }
        : { description: 'Arrakis.' };
      return { ok: true, status: 200, json: async () => body };
    }) as unknown as typeof fetch;
    const onPick = renderSheet();
    fireEvent.changeText(
      screen.getByPlaceholderText('Search by title or author'),
      'dune',
    );
    fireEvent.press(await screen.findByText('Dune'));
    await waitFor(() =>
      expect(onPick).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Dune',
          creator: 'Frank Herbert',
          description: 'Arrakis.',
        }),
      ),
    );
  });
});
