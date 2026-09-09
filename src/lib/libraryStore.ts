import { starsToScore } from './score';
import { storage, StorageKeys } from './storage';
import type { LibraryItem } from '../types/library';

/**
 * Persistence for library entries. LibraryContext talks to nothing else, so a
 * backend only has to implement these four functions. Two exist: this file
 * (AsyncStorage on the device) and pocketbase.ts (a PocketBase server).
 * backend.ts picks one at startup.
 */
export interface LibraryStore {
  /**
   * The entries to load for the signed-in user. The local store returns
   * everything on the device (the context filters by owner); a server only
   * returns what the user is allowed to see.
   */
  list: (ownerId: string) => Promise<LibraryItem[]>;
  /** Saves a new entry and returns it as stored (a server assigns the id). */
  create: (item: LibraryItem) => Promise<LibraryItem>;
  update: (item: LibraryItem) => Promise<LibraryItem>;
  remove: (id: string) => Promise<void>;
}

/** Shape of a review from the OMDb-only version, kept for the migration. */
interface LegacyReview {
  id: string;
  movieTitle: string;
  moviePoster?: string;
  userId: string;
  rating: number;
  text: string;
  createdAt: number;
}

/** Turns the old per-movie reviews (1 to 5 stars) into "watched" film entries. */
function migrateReviews(reviews: LegacyReview[]): LibraryItem[] {
  return reviews.map((r) => ({
    id: `legacy-${r.id}`,
    ownerId: r.userId,
    kind: 'film',
    title: r.movieTitle,
    poster: r.moviePoster,
    tags: [],
    status: 'done',
    rating: starsToScore(r.rating),
    review: r.text || undefined,
    createdAt: r.createdAt,
    updatedAt: r.createdAt,
    finishedAt: r.createdAt,
  }));
}

async function readAll(): Promise<LibraryItem[]> {
  const stored = await storage.get<LibraryItem[]>(StorageKeys.library);
  if (stored) return stored;
  // First launch after the revamp: carry old reviews over, once.
  const legacy = await storage.get<LegacyReview[]>(StorageKeys.reviews);
  const migrated = legacy?.length ? migrateReviews(legacy) : [];
  await storage.set(StorageKeys.library, migrated);
  return migrated;
}

const writeAll = (items: LibraryItem[]) =>
  storage.set(StorageKeys.library, items);

export const localLibraryStore: LibraryStore = {
  list: () => readAll(),
  async create(item) {
    const items = await readAll();
    await writeAll([item, ...items]);
    return item;
  },
  async update(item) {
    const items = await readAll();
    await writeAll(items.map((i) => (i.id === item.id ? item : i)));
    return item;
  },
  async remove(id) {
    const items = await readAll();
    await writeAll(items.filter((i) => i.id !== id));
  },
};
