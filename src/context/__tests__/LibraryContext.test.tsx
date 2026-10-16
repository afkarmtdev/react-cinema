import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../AuthContext';
import { LibraryProvider, useLibrary } from '../LibraryContext';
import type { LibraryItemInput } from '../../types/library';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <LibraryProvider>{children}</LibraryProvider>
  </AuthProvider>
);

function mount() {
  return renderHook(() => ({ auth: useAuth(), lib: useLibrary() }), {
    wrapper,
  });
}

// Mount both contexts and sign a user in, since entries belong to a user.
async function mountWithUser(email = 'ali@example.com') {
  const utils = mount();
  await waitFor(() =>
    expect(utils.result.current.auth.initializing).toBe(false),
  );
  await waitFor(() => expect(utils.result.current.lib.ready).toBe(true));
  await act(async () => {
    await utils.result.current.auth.signup('Ali', email, 'secret');
  });
  return utils;
}

const dune: LibraryItemInput = {
  kind: 'book',
  title: 'Dune',
  creator: 'Frank Herbert',
  year: 1965,
  tags: ['sci-fi', 'classic'],
  status: 'want',
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('LibraryContext', () => {
  it('adds an entry for the signed-in user', async () => {
    const { result } = await mountWithUser();
    await act(async () => {
      await result.current.lib.addItem(dune);
    });

    expect(result.current.lib.items).toHaveLength(1);
    expect(result.current.lib.items[0]).toMatchObject({
      title: 'Dune',
      kind: 'book',
      creator: 'Frank Herbert',
      status: 'want',
    });
    expect(result.current.lib.items[0].finishedAt).toBeUndefined();
  });

  it('rejects an entry without a title', async () => {
    const { result } = await mountWithUser();
    await expect(
      act(async () => {
        await result.current.lib.addItem({ ...dune, title: '   ' });
      }),
    ).rejects.toThrow('Title is required.');
    expect(result.current.lib.items).toHaveLength(0);
  });

  it('trims fields and dedupes tags case-insensitively', async () => {
    const { result } = await mountWithUser();
    await act(async () => {
      await result.current.lib.addItem({
        ...dune,
        title: '  Dune  ',
        creator: '  ',
        tags: ['Sci-Fi', 'sci-fi', ' classic ', ''],
      });
    });

    const item = result.current.lib.items[0];
    expect(item.title).toBe('Dune');
    expect(item.creator).toBeUndefined();
    expect(item.tags).toEqual(['Sci-Fi', 'classic']);
  });

  it('stamps finishedAt when marked done and clears it again', async () => {
    const { result } = await mountWithUser();
    let id = '';
    await act(async () => {
      id = (await result.current.lib.addItem(dune)).id;
    });

    await act(async () => {
      await result.current.lib.updateItem(id, { status: 'done', rating: 8.5 });
    });
    const done = result.current.lib.getItem(id)!;
    expect(done.status).toBe('done');
    expect(done.rating).toBe(8.5);
    expect(typeof done.finishedAt).toBe('number');

    await act(async () => {
      await result.current.lib.updateItem(id, { status: 'inProgress' });
    });
    expect(result.current.lib.getItem(id)!.finishedAt).toBeUndefined();
  });

  it('keeps the dates given when backlogging a finished entry', async () => {
    const { result } = await mountWithUser();
    const started = new Date(2026, 0, 5).getTime();
    const finished = new Date(2026, 0, 20).getTime();
    await act(async () => {
      await result.current.lib.addItem({
        ...dune,
        status: 'done',
        startedAt: started,
        finishedAt: finished,
      });
    });
    expect(result.current.lib.items[0]).toMatchObject({
      startedAt: started,
      finishedAt: finished,
    });
  });

  it('moves the finish date from the form and stamps today if it is cleared', async () => {
    const { result } = await mountWithUser();
    const before = Date.now();
    let id = '';
    await act(async () => {
      id = (await result.current.lib.addItem({ ...dune, status: 'done' })).id;
    });
    expect(result.current.lib.getItem(id)!.finishedAt).toBeGreaterThanOrEqual(
      before,
    );

    const earlier = new Date(2025, 5, 1).getTime();
    await act(async () => {
      await result.current.lib.updateItem(id, { finishedAt: earlier });
    });
    expect(result.current.lib.getItem(id)!.finishedAt).toBe(earlier);

    // A status chip alone (no finishedAt key) leaves the date as it is.
    await act(async () => {
      await result.current.lib.updateItem(id, { rating: 7 });
    });
    expect(result.current.lib.getItem(id)!.finishedAt).toBe(earlier);

    await act(async () => {
      await result.current.lib.updateItem(id, { finishedAt: undefined });
    });
    expect(result.current.lib.getItem(id)!.finishedAt).toBeGreaterThanOrEqual(
      before,
    );
  });

  it('keeps rewatches in order, with the earliest as the first finish', async () => {
    const { result } = await mountWithUser();
    const first = new Date(2025, 0, 10).getTime();
    const second = new Date(2026, 2, 1).getTime();
    const third = new Date(2026, 8, 1).getTime();
    let id = '';
    await act(async () => {
      const item = await result.current.lib.addItem({
        ...dune,
        status: 'done',
        finishedAt: second,
        repeats: [first],
      });
      id = item.id;
    });
    expect(result.current.lib.getItem(id)).toMatchObject({
      finishedAt: first,
      repeats: [second],
    });

    // Logging another one, as the detail screen does, keeps the first.
    await act(async () => {
      await result.current.lib.updateItem(id, { repeats: [second, third] });
    });
    expect(result.current.lib.getItem(id)).toMatchObject({
      finishedAt: first,
      repeats: [second, third],
    });

    // Leaving "done" drops them along with the finish date.
    await act(async () => {
      await result.current.lib.updateItem(id, { status: 'inProgress' });
    });
    const reading = result.current.lib.getItem(id)!;
    expect(reading.finishedAt).toBeUndefined();
    expect(reading.repeats).toBeUndefined();
  });

  it('keeps no rewatches on an entry that is not finished', async () => {
    const { result } = await mountWithUser();
    await act(async () => {
      await result.current.lib.addItem({ ...dune, repeats: [123456] });
    });
    expect(result.current.lib.items[0].repeats).toBeUndefined();
  });

  it('cleans up the length and the quotes', async () => {
    const { result } = await mountWithUser();
    let id = '';
    await act(async () => {
      const item = await result.current.lib.addItem({
        ...dune,
        pages: 412.4,
        runtime: 0,
        quotes: [
          {
            id: 'q1',
            text: '  Fear is the mind-killer. ',
            page: 0,
            createdAt: 1,
          },
          { id: 'q2', text: '   ', createdAt: 2 },
        ],
      });
      id = item.id;
    });
    const item = result.current.lib.getItem(id)!;
    expect(item.pages).toBe(412);
    expect(item.runtime).toBeUndefined();
    expect(item.quotes).toEqual([
      { id: 'q1', text: 'Fear is the mind-killer.', createdAt: 1 },
    ]);

    await act(async () => {
      await result.current.lib.updateItem(id, { quotes: [] });
    });
    expect(result.current.lib.getItem(id)!.quotes).toBeUndefined();
  });

  it('keeps known moods in order and drops an empty list', async () => {
    const { result } = await mountWithUser();
    let id = '';
    await act(async () => {
      const item = await result.current.lib.addItem({
        ...dune,
        moods: ['mad', 'joy', 'mad'],
      });
      id = item.id;
    });
    expect(result.current.lib.getItem(id)!.moods).toEqual(['joy', 'mad']);

    await act(async () => {
      await result.current.lib.updateItem(id, { moods: [] });
    });
    expect(result.current.lib.getItem(id)!.moods).toBeUndefined();
  });

  it('removes an entry', async () => {
    const { result } = await mountWithUser();
    let id = '';
    await act(async () => {
      id = (await result.current.lib.addItem(dune)).id;
    });
    await act(async () => {
      await result.current.lib.removeItem(id);
    });
    expect(result.current.lib.items).toHaveLength(0);
  });

  it('lists tags ordered by how often they are used', async () => {
    const { result } = await mountWithUser();
    await act(async () => {
      await result.current.lib.addItem({ ...dune, tags: ['sci-fi', 'epic'] });
    });
    await act(async () => {
      await result.current.lib.addItem({
        ...dune,
        title: 'Foundation',
        tags: ['sci-fi'],
      });
    });
    expect(result.current.lib.allTags).toEqual(['sci-fi', 'epic']);
  });

  it('keeps each user library separate', async () => {
    const { result } = await mountWithUser('ali@example.com');
    await act(async () => {
      await result.current.lib.addItem(dune);
    });
    await act(async () => {
      await result.current.auth.logout();
    });
    expect(result.current.lib.items).toHaveLength(0);

    await act(async () => {
      await result.current.auth.signup('Bo', 'bo@example.com', 'secret');
    });
    expect(result.current.lib.items).toHaveLength(0);
  });

  it('migrates old reviews into watched films on first load', async () => {
    await AsyncStorage.setItem(
      '@gscreviews/users',
      JSON.stringify([
        { id: 'u1', name: 'Ali', email: 'ali@example.com', password: 'secret' },
      ]),
    );
    await AsyncStorage.setItem(
      '@gscreviews/reviews',
      JSON.stringify([
        {
          id: 'r1',
          movieId: 'tt1',
          movieTitle: 'Toy Story',
          moviePoster: 'https://img/toy.jpg',
          userId: 'u1',
          userName: 'Ali',
          rating: 4,
          text: 'Great',
          createdAt: 1000,
        },
      ]),
    );

    const { result } = mount();
    await waitFor(() => expect(result.current.lib.ready).toBe(true));
    await act(async () => {
      await result.current.auth.login('ali@example.com', 'secret');
    });

    expect(result.current.lib.items).toHaveLength(1);
    expect(result.current.lib.items[0]).toMatchObject({
      kind: 'film',
      title: 'Toy Story',
      poster: 'https://img/toy.jpg',
      status: 'done',
      rating: 8,
      review: 'Great',
      finishedAt: 1000,
    });
  });
});
