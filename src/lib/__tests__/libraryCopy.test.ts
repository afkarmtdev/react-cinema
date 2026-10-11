import type { User } from '../auth';
import { copyLibrary, entryKey } from '../libraryCopy';
import type { LibraryStore } from '../libraryStore';
import type { LibraryItem } from '../../types/library';

const entry = (overrides: Partial<LibraryItem>): LibraryItem => ({
  id: 'x',
  ownerId: 'local1',
  kind: 'film',
  title: 'Heat',
  year: 1995,
  tags: [],
  status: 'done',
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

/**
 * An in-memory store. With serverIds on it hands out its own ids the way
 * PocketBase does; otherwise it keeps the id it is given, like the device.
 */
function memoryStore(initial: LibraryItem[] = [], serverIds = false) {
  const items = [...initial];
  let next = 0;
  const store: LibraryStore = {
    list: jest.fn(async () => [...items]),
    create: jest.fn(async (item: LibraryItem) => {
      const saved = serverIds ? { ...item, id: `srv${++next}` } : item;
      items.push(saved);
      return saved;
    }),
    update: jest.fn(),
    remove: jest.fn(),
  };
  return { store, items };
}

const localUser: User = { id: 'local1', name: 'Ali', email: 'a@b.com' };
const serverUser: User = { id: 'pb1', name: 'Ali', email: 'a@b.com' };

describe('copyLibrary', () => {
  it("copies the user's own entries to the target account", async () => {
    const device = memoryStore([
      entry({ id: 'd1', title: 'Heat', createdAt: 2 }),
      entry({ id: 'd2', title: 'Dune', kind: 'book', createdAt: 1 }),
      entry({ id: 'd3', title: 'Not mine', ownerId: 'someone' }),
    ]);
    const server = memoryStore([], true);

    const result = await copyLibrary(
      { library: device.store, user: localUser },
      { library: server.store, user: serverUser },
    );

    expect(result).toEqual({ copied: 2, skipped: 0, favourites: null });
    // Oldest first, owned by the server account.
    expect(server.items.map((i) => [i.title, i.ownerId])).toEqual([
      ['Dune', 'pb1'],
      ['Heat', 'pb1'],
    ]);
  });

  it('skips entries the target already has, so a second run copies nothing', async () => {
    const device = memoryStore([
      entry({ id: 'd1', title: 'Heat' }),
      entry({ id: 'd2', title: 'Ronin', year: 1998 }),
    ]);
    const server = memoryStore(
      [entry({ id: 'srv0', ownerId: 'pb1', title: ' heat ' })],
      true,
    );
    const from = { library: device.store, user: localUser };
    const to = { library: server.store, user: serverUser };

    expect(await copyLibrary(from, to)).toMatchObject({
      copied: 1,
      skipped: 1,
    });
    expect(await copyLibrary(from, to)).toMatchObject({
      copied: 0,
      skipped: 2,
    });
    expect(server.items).toHaveLength(2);
  });

  it('gives each copy a new id on the device and keeps its dates', async () => {
    const server = memoryStore([
      entry({ id: 'srv1', ownerId: 'pb1', createdAt: 5, finishedAt: 7 }),
    ]);
    const device = memoryStore([entry({ id: 'srv1', ownerId: 'other' })]);

    await copyLibrary(
      { library: server.store, user: serverUser },
      { library: device.store, user: localUser },
    );

    const copy = device.items[1];
    expect(copy.id).not.toBe('srv1');
    expect(copy).toMatchObject({
      ownerId: 'local1',
      createdAt: 5,
      finishedAt: 7,
    });
  });

  it('carries favourites over to the new ids, up to four', async () => {
    const device = memoryStore([
      entry({ id: 'd1', title: 'A' }),
      entry({ id: 'd2', title: 'B' }),
      entry({ id: 'd3', title: 'C' }),
    ]);
    const server = memoryStore(
      [
        entry({ id: 'srvB', ownerId: 'pb1', title: 'B' }),
        entry({ id: 'srvX', ownerId: 'pb1', title: 'X' }),
        entry({ id: 'srvY', ownerId: 'pb1', title: 'Y' }),
      ],
      true,
    );

    const result = await copyLibrary(
      {
        library: device.store,
        user: { ...localUser, favourites: ['d1', 'd2', 'd3'] },
      },
      {
        library: server.store,
        user: { ...serverUser, favourites: ['srvX', 'srvY'] },
      },
    );

    // B already existed, so it points at srvB; the shelf stops at four.
    expect(result.favourites).toEqual(['srvX', 'srvY', 'srv1', 'srvB']);
  });

  it('leaves the favourites alone when nothing new reaches the shelf', async () => {
    const device = memoryStore([entry({ id: 'd1' })]);
    const server = memoryStore([], true);
    const result = await copyLibrary(
      { library: device.store, user: { ...localUser, favourites: ['gone'] } },
      { library: server.store, user: serverUser },
    );
    expect(result.favourites).toBeNull();
  });

  it('matches entries by kind, title, and year', () => {
    expect(entryKey(entry({ title: ' Heat ' }))).toBe(
      entryKey(entry({ title: 'heat' })),
    );
    expect(entryKey(entry({ year: 1995 }))).not.toBe(
      entryKey(entry({ year: undefined })),
    );
    expect(entryKey(entry({ kind: 'book' }))).not.toBe(
      entryKey(entry({ kind: 'film' })),
    );
  });
});
