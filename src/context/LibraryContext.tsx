import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { LibraryStore } from '../lib/libraryStore';
import { clampScore } from '../lib/score';
import { uniqueTags } from '../lib/tags';
import type { LibraryItem, LibraryItemInput } from '../types/library';
import { useAuth } from './AuthContext';
import { useStorageBackend } from './StorageContext';

interface LibraryContextValue {
  /** True once the library has been read from storage or the server. */
  ready: boolean;
  /** True when the last load failed (for example the server was unreachable). */
  loadError: boolean;
  /** Loads the library again, for a retry button. */
  reload: () => void;
  /** The signed-in user's entries, most recently updated first. */
  items: LibraryItem[];
  /** Every distinct tag the user has used, most used first. */
  allTags: string[];
  getItem: (id: string) => LibraryItem | undefined;
  addItem: (input: LibraryItemInput) => Promise<LibraryItem>;
  updateItem: (id: string, input: Partial<LibraryItemInput>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | undefined>(
  undefined,
);

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Cleans up form input before it is stored. */
function sanitise(input: Partial<LibraryItemInput>): Partial<LibraryItemInput> {
  const out: Partial<LibraryItemInput> = { ...input };
  if (input.title !== undefined) out.title = input.title.trim();
  if (input.creator !== undefined) {
    out.creator = input.creator.trim() || undefined;
  }
  if (input.description !== undefined) {
    out.description = input.description.trim() || undefined;
  }
  if (input.poster !== undefined) out.poster = input.poster.trim() || undefined;
  if (input.review !== undefined) out.review = input.review.trim() || undefined;
  if (input.tags !== undefined) out.tags = uniqueTags(input.tags);
  if (input.rating !== undefined) {
    out.rating = input.rating >= 1 ? clampScore(input.rating) : undefined;
  }
  if ('startedAt' in input) out.startedAt = validTime(input.startedAt);
  if ('finishedAt' in input) out.finishedAt = validTime(input.finishedAt);
  return out;
}

/** A date from the form, or nothing: anything that is not a real time is dropped. */
const validTime = (value: number | undefined): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined;

export function LibraryProvider({
  children,
  store: storeProp,
}: {
  children: React.ReactNode;
  /**
   * Injectable for tests; otherwise the one the Storage setting picked (or
   * the local one outside a StorageProvider).
   */
  store?: LibraryStore;
}) {
  const chosen = useStorageBackend().library;
  const store = storeProp ?? chosen;
  const { user } = useAuth();
  const [all, setAll] = useState<LibraryItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // (Re)load whenever the signed-in user changes: a server only returns the
  // current user's rows, so a login or logout needs a fresh list.
  const ownerId = user?.id;
  useEffect(() => {
    let active = true;
    setReady(false);
    setLoadError(false);
    const load = ownerId ? store.list(ownerId) : Promise.resolve([]);
    load
      .then((stored) => {
        if (!active) return;
        setAll(stored);
      })
      .catch(() => {
        if (!active) return;
        setAll([]);
        setLoadError(true);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [store, ownerId, reloadKey]);

  const items = useMemo(
    () =>
      all
        .filter((item) => item.ownerId === user?.id)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [all, user],
  );

  const allTags = useMemo(() => {
    const counts = new Map<string, { tag: string; count: number }>();
    for (const item of items) {
      for (const tag of item.tags) {
        const key = tag.toLowerCase();
        const entry = counts.get(key);
        if (entry) entry.count += 1;
        else counts.set(key, { tag, count: 1 });
      }
    }
    return [...counts.values()]
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .map((e) => e.tag);
  }, [items]);

  const getItem = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items],
  );

  const addItem = useCallback(
    async (input: LibraryItemInput) => {
      if (!user) throw new Error('You must be signed in.');
      const clean = sanitise(input);
      if (!clean.title) throw new Error('Title is required.');
      const now = Date.now();
      const item: LibraryItem = {
        ...input,
        ...clean,
        title: clean.title,
        tags: clean.tags ?? [],
        id: newId(),
        ownerId: user.id,
        createdAt: now,
        updatedAt: now,
        // A backlogged entry carries the day it was really finished; a fresh
        // one is finished right now.
        finishedAt:
          input.status === 'done' ? (clean.finishedAt ?? now) : undefined,
      };
      const saved = await store.create(item);
      setAll((prev) => [saved, ...prev]);
      return saved;
    },
    [user, store],
  );

  const updateItem = useCallback(
    async (id: string, input: Partial<LibraryItemInput>) => {
      const existing = all.find((item) => item.id === id);
      if (!existing || existing.ownerId !== user?.id) return;
      const clean = sanitise(input);
      if (clean.title !== undefined && !clean.title) {
        throw new Error('Title is required.');
      }
      const status = clean.status ?? existing.status;
      // The form sends a finish date (possibly cleared); a status chip on the
      // detail screen sends none, so the existing one is kept or stamped now.
      let finishedAt =
        'finishedAt' in clean ? clean.finishedAt : existing.finishedAt;
      if (status === 'done' && !finishedAt) finishedAt = Date.now();
      if (status !== 'done') finishedAt = undefined;
      const updated: LibraryItem = {
        ...existing,
        ...clean,
        title: clean.title ?? existing.title,
        tags: clean.tags ?? existing.tags,
        status,
        finishedAt,
        updatedAt: Date.now(),
      };
      const saved = await store.update(updated);
      setAll((prev) => prev.map((item) => (item.id === id ? saved : item)));
    },
    [all, user, store],
  );

  const removeItem = useCallback(
    async (id: string) => {
      const existing = all.find((item) => item.id === id);
      if (!existing || existing.ownerId !== user?.id) return;
      await store.remove(id);
      setAll((prev) => prev.filter((item) => item.id !== id));
    },
    [all, user, store],
  );

  const value = useMemo(
    () => ({
      ready,
      loadError,
      reload,
      items,
      allTags,
      getItem,
      addItem,
      updateItem,
      removeItem,
    }),
    [
      ready,
      loadError,
      reload,
      items,
      allTags,
      getItem,
      addItem,
      updateItem,
      removeItem,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within a LibraryProvider');
  return ctx;
}
