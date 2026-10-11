import type { User } from './auth';
import { MAX_FAVOURITES } from './favourites';
import { newItemId, type LibraryStore } from './libraryStore';
import type { LibraryItem } from '../types/library';

/** One end of a copy: a store and the account signed in to it. */
export interface CopySide {
  library: LibraryStore;
  user: User;
}

export interface CopyResult {
  copied: number;
  /** Entries left out because the target already had them. */
  skipped: number;
  /**
   * The target account's top four with the copied favourites added, or null
   * when it does not change. The caller saves it, since the target may be
   * the account the app is signed in to.
   */
  favourites: string[] | null;
}

/** Two entries are the same when the kind, title, and year match. */
export const entryKey = (item: LibraryItem): string =>
  `${item.kind}|${item.title.trim().toLowerCase()}|${item.year ?? ''}`;

/**
 * Copies the source account's entries into the target account, in either
 * direction between the device and a server. Accounts on the two sides have
 * different ids, so each copy is given to the target user and a new id.
 * Entries the target already had before the copy are skipped, which makes a
 * second run (or a retry after a failed one) safe. Duplicates within the
 * source are all copied, since a rewatch can be a second entry on purpose.
 */
export async function copyLibrary(
  from: CopySide,
  to: CopySide,
): Promise<CopyResult> {
  // The device store lists every account's entries; keep the user's own.
  const source = (await from.library.list(from.user.id)).filter(
    (item) => item.ownerId === from.user.id,
  );
  const existing = new Map<string, string>();
  for (const item of await to.library.list(to.user.id)) {
    if (item.ownerId === to.user.id && !existing.has(entryKey(item))) {
      existing.set(entryKey(item), item.id);
    }
  }

  // Source id to target id, so the favourites can follow their entries.
  const ids = new Map<string, string>();
  let copied = 0;
  let skipped = 0;
  // Oldest first, so a store that stamps its own dates keeps the order.
  const ordered = [...source].sort((a, b) => a.createdAt - b.createdAt);
  for (const item of ordered) {
    const match = existing.get(entryKey(item));
    if (match) {
      ids.set(item.id, match);
      skipped += 1;
      continue;
    }
    const saved = await to.library.create({
      ...item,
      id: newItemId(),
      ownerId: to.user.id,
    });
    ids.set(item.id, saved.id);
    copied += 1;
  }

  const current = to.user.favourites ?? [];
  const carried = (from.user.favourites ?? [])
    .map((id) => ids.get(id))
    .filter((id): id is string => !!id);
  const favourites = [...new Set([...current, ...carried])].slice(
    0,
    MAX_FAVOURITES,
  );

  return {
    copied,
    skipped,
    favourites: favourites.length > current.length ? favourites : null,
  };
}
