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
import { LookupInline } from '../LookupInline';

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

// Answers each source's search with results named after its host.
function mockFetch(count = 1) {
  global.fetch = jest.fn(async (url: string) => {
    const body = url.includes('openlibrary.org')
      ? {
          docs: Array.from({ length: count }, (_, i) => ({
            key: `/works/OL${i}W`,
            title: `Dune ${i} (Open Library)`,
          })),
        }
      : { items: [{ id: 'g1', volumeInfo: { title: 'Dune (Google)' } }] };
    return { ok: true, status: 200, json: async () => body };
  }) as unknown as typeof fetch;
}

function renderLookup({ onPick = jest.fn(), onClose = jest.fn() } = {}) {
  render(<LookupInline kind="book" onPick={onPick} onClose={onClose} />, {
    wrapper,
  });
  return { onPick, onClose };
}

const search = (text: string) =>
  fireEvent.changeText(
    screen.getByPlaceholderText('Search by title or author'),
    text,
  );

beforeEach(async () => {
  await AsyncStorage.clear();
  mockFetch();
});
afterEach(() => jest.restoreAllMocks());

describe('LookupInline', () => {
  it('searches the first source for the kind', async () => {
    renderLookup();
    search('dune');
    expect(await screen.findByText('Dune 0 (Open Library)')).toBeTruthy();
    expect(screen.getByText('Data from Open Library.')).toBeTruthy();
  });

  it('switches source from the menu and remembers the choice', async () => {
    renderLookup();
    search('dune');
    await screen.findByText('Dune 0 (Open Library)');

    fireEvent.press(screen.getByLabelText('Open Library. Change source'));
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
    renderLookup();
    await waitFor(() =>
      expect(screen.getByText('Data from Google Books.')).toBeTruthy(),
    );
  });

  it('shows three results until asked for the rest', async () => {
    mockFetch(5);
    renderLookup();
    search('dune');
    await screen.findByText('Dune 2 (Open Library)');
    expect(screen.queryByText('Dune 3 (Open Library)')).toBeNull();

    fireEvent.press(screen.getByText('Show 2 more'));
    expect(screen.getByText('Dune 4 (Open Library)')).toBeTruthy();
    expect(screen.queryByText('Show 2 more')).toBeNull();
  });

  it('closes from the x', () => {
    const { onClose } = renderLookup();
    fireEvent.press(screen.getByLabelText('Close search'));
    expect(onClose).toHaveBeenCalledTimes(1);
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
    const { onPick } = renderLookup();
    search('dune');
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
