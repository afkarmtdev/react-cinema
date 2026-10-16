import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import {
  DATABASE_NAME,
  sqliteLibraryStore as store,
  toItem,
  toParams,
  type EntryRow,
} from '../sqliteStore';
import type { LibraryItem } from '../../types/library';

// jest.setup.js swaps expo-sqlite for the in-memory fake in __mocks__ and
// empties it before each test.

const dune: LibraryItem = {
  id: 'abc123',
  ownerId: 'user1',
  kind: 'book',
  title: 'Dune',
  year: 1965,
  creator: 'Frank Herbert',
  tags: ['sci-fi', 'classic'],
  status: 'done',
  rating: 9.5,
  review: 'Great',
  createdAt: 1000,
  updatedAt: 2000,
  finishedAt: 1500,
};

const minimal: LibraryItem = {
  id: 'min1',
  ownerId: 'user1',
  kind: 'film',
  title: 'Untitled',
  tags: [],
  status: 'want',
  createdAt: 10,
  updatedAt: 20,
};

const row = (overrides: Partial<EntryRow> = {}): EntryRow => ({
  id: 'abc123',
  owner_id: 'user1',
  kind: 'book',
  title: 'Dune',
  year: 1965,
  creator: 'Frank Herbert',
  description: null,
  poster: null,
  tags: '["sci-fi","classic"]',
  status: 'done',
  rating: 9.5,
  review: 'Great',
  created_at: 1000,
  updated_at: 2000,
  started_at: null,
  finished_at: 1500,
  repeats: '[]',
  runtime: null,
  pages: null,
  quotes: '[]',
  moods: '[]',
  ...overrides,
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('sqlite mapping', () => {
  it('writes unset fields as NULL and tags as JSON', () => {
    expect(toParams(minimal)).toEqual({
      $id: 'min1',
      $ownerId: 'user1',
      $kind: 'film',
      $title: 'Untitled',
      $year: null,
      $creator: null,
      $description: null,
      $poster: null,
      $tags: '[]',
      $status: 'want',
      $rating: null,
      $review: null,
      $createdAt: 10,
      $updatedAt: 20,
      $startedAt: null,
      $finishedAt: null,
      $repeats: '[]',
      $runtime: null,
      $pages: null,
      $quotes: '[]',
      $moods: '[]',
    });
    expect(toParams({ ...minimal, startedAt: 5 }).$startedAt).toBe(5);
  });

  it('writes the rewatches and quotes as JSON and reads them back', () => {
    const quote = {
      id: 'q1',
      text: 'Fear is the mind-killer.',
      page: 8,
      createdAt: 1,
    };
    const full = {
      ...dune,
      repeats: [1600, 1700],
      pages: 412,
      quotes: [quote],
    };
    const params = toParams(full);
    expect(params.$repeats).toBe('[1600,1700]');
    expect(params.$pages).toBe(412);
    expect(JSON.parse(params.$quotes)).toEqual([quote]);
    expect(
      toItem(
        row({ repeats: params.$repeats, pages: 412, quotes: params.$quotes }),
      ),
    ).toEqual(full);
    expect(toItem(row({ runtime: 155, kind: 'film' })).runtime).toBe(155);
  });

  it('writes the moods as JSON and reads back only known ones', () => {
    const params = toParams({ ...dune, moods: ['joy', 'cried'] });
    expect(params.$moods).toBe('["joy","cried"]');
    expect(toItem(row({ moods: params.$moods })).moods).toEqual([
      'joy',
      'cried',
    ]);
    expect(toItem(row({ moods: '["sleepy"]' }))).not.toHaveProperty('moods');
    expect(toItem(row({ moods: 'nope' }))).not.toHaveProperty('moods');
  });

  it('leaves out empty or unreadable lists and rows from before the columns', () => {
    const empty = toItem(row());
    expect(empty).not.toHaveProperty('repeats');
    expect(empty).not.toHaveProperty('quotes');
    const garbled = toItem(
      row({ repeats: 'nope', quotes: '[{"text":"no id"},3]' }),
    );
    expect(garbled).not.toHaveProperty('repeats');
    expect(garbled).not.toHaveProperty('quotes');
    const old = row();
    delete (old as Partial<EntryRow>).repeats;
    delete (old as Partial<EntryRow>).runtime;
    expect(toItem(old)).toEqual(dune);
  });

  it('reads a row back into an entry without the NULL fields', () => {
    expect(toItem(row())).toEqual(dune);
    expect(toItem(row({ started_at: 900 })).startedAt).toBe(900);
    const sparse = toItem(
      row({
        year: null,
        creator: null,
        rating: null,
        review: null,
        finished_at: null,
      }),
    );
    expect(sparse).not.toHaveProperty('year');
    expect(sparse).not.toHaveProperty('rating');
    expect(sparse).not.toHaveProperty('finishedAt');
  });

  it('treats unreadable tags as none', () => {
    expect(toItem(row({ tags: 'not json' })).tags).toEqual([]);
    expect(toItem(row({ tags: '{"a":1}' })).tags).toEqual([]);
  });
});

describe('sqlite store', () => {
  it('creates, updates, lists, and removes entries for one owner', async () => {
    await store.create(dune);
    await store.create({ ...minimal, ownerId: 'user2' });
    expect(await store.list('user1')).toEqual([dune]);
    expect(await store.list('user2')).toHaveLength(1);

    await store.update({ ...dune, title: 'Dune Messiah', rating: undefined });
    const [updated] = await store.list('user1');
    expect(updated.title).toBe('Dune Messiah');
    expect(updated).not.toHaveProperty('rating');

    await store.remove(dune.id);
    expect(await store.list('user1')).toEqual([]);
    expect(await store.list('user2')).toHaveLength(1);
  });

  it('keeps the rewatches, length, and quotes through an update', async () => {
    await store.create(dune);
    const quote = {
      id: 'q1',
      text: 'A beginning is a delicate time.',
      createdAt: 1,
    };
    await store.update({
      ...dune,
      repeats: [1800],
      pages: 412,
      quotes: [quote],
    });
    const [item] = await store.list('user1');
    expect(item).toMatchObject({
      repeats: [1800],
      pages: 412,
      quotes: [quote],
    });
  });

  it('lists the most recently updated entry first', async () => {
    await store.create({ ...minimal, id: 'older', updatedAt: 100 });
    await store.create({ ...minimal, id: 'newer', updatedAt: 300 });
    await store.create({ ...minimal, id: 'middle', updatedAt: 200 });
    expect((await store.list('user1')).map((i) => i.id)).toEqual([
      'newer',
      'middle',
      'older',
    ]);
  });

  it('opens one database file and reuses it', async () => {
    const open = jest.spyOn(SQLite, 'openDatabaseAsync');
    await store.create(minimal);
    await store.list('user1');
    await store.remove(minimal.id);
    // The connection is memoised, so an earlier test may already hold it.
    expect(open.mock.calls.length).toBeLessThanOrEqual(1);
    for (const [name] of open.mock.calls) expect(name).toBe(DATABASE_NAME);
    open.mockRestore();
  });

  it('imports the AsyncStorage library once and clears it', async () => {
    await AsyncStorage.setItem('@gscreviews/library', JSON.stringify([dune]));
    expect(await store.list('user1')).toEqual([dune]);
    expect(await AsyncStorage.getItem('@gscreviews/library')).toBeNull();

    // Removing it afterwards must stick: nothing is left to import again.
    await store.remove(dune.id);
    expect(await store.list('user1')).toEqual([]);
  });

  it('keeps the row already in the table when an import has the same id', async () => {
    await store.create({ ...dune, title: 'Kept' });
    await AsyncStorage.setItem(
      '@gscreviews/library',
      JSON.stringify([{ ...dune, title: 'Stale' }]),
    );
    const [item] = await store.list('user1');
    expect(item.title).toBe('Kept');
  });

  it('imports reviews from the OMDb-only version as watched films', async () => {
    await AsyncStorage.setItem(
      '@gscreviews/reviews',
      JSON.stringify([
        {
          id: 'r1',
          movieTitle: 'Toy Story',
          moviePoster: 'https://img/toy.jpg',
          userId: 'user1',
          rating: 4,
          text: 'Great',
          createdAt: 1000,
        },
      ]),
    );
    const [item] = await store.list('user1');
    expect(item).toMatchObject({
      id: 'legacy-r1',
      kind: 'film',
      title: 'Toy Story',
      poster: 'https://img/toy.jpg',
      status: 'done',
      rating: 8,
      review: 'Great',
      finishedAt: 1000,
    });
    expect(await AsyncStorage.getItem('@gscreviews/reviews')).toBeNull();
  });
});
