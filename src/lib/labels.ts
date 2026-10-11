import type { Ionicons } from '@expo/vector-icons';
import { isReadKind, type ItemKind, type ItemStatus } from '../types/library';

type IconName = keyof typeof Ionicons.glyphMap;

export const KIND_ICON: Record<ItemKind, IconName> = {
  film: 'film-outline',
  series: 'tv-outline',
  book: 'book-outline',
};

export const STATUS_ICON: Record<ItemStatus, IconName> = {
  want: 'bookmark-outline',
  inProgress: 'play-circle-outline',
  done: 'checkmark-circle',
};

/** Translation key for a kind's singular name ("Film", "Book"). */
export const kindKey = (kind: ItemKind): string =>
  `kind${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;

/** Translation key for the creator field label ("Director" or "Author"). */
export const creatorKey = (kind: ItemKind): string =>
  isReadKind(kind) ? 'author' : 'director';

/**
 * Translation key for a status in the wording that fits the kind:
 * "Watched" for a film, "Read" for a book. Without a kind it falls back to
 * the generic wording ("Finished"), used by the filter sheet.
 */
export function statusKey(status: ItemStatus, kind?: ItemKind): string {
  const suffix = status.charAt(0).toUpperCase() + status.slice(1);
  if (!kind) return `status${suffix}`;
  return `${isReadKind(kind) ? 'read' : 'watch'}${suffix}`;
}

/**
 * Translation key for a rewatch or reread phrase. `base` is the part shared
 * by the pair, such as "On" for "rewatchOn" and "rereadOn".
 */
export const repeatKey = (kind: ItemKind, base: string): string =>
  `${isReadKind(kind) ? 'reread' : 'rewatch'}${base}`;

type Translate = (
  key: string,
  params?: Record<string, string | number>,
) => string;

/** Minutes as "2h 28m", "45m", or "3h", in the current language. */
export function formatRuntime(minutes: number, t: Translate): string {
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return t('durationM', { m });
  return m ? t('durationHM', { h, m }) : t('durationH', { h });
}

/** "412 pages", or "1 page". */
export const formatPages = (pages: number, t: Translate): string =>
  pages === 1 ? t('pageCountOne') : t('pageCount', { count: pages });

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "7 Sep": the day inside a month that is already named, as in the Diary. */
export function formatDay(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

export function formatMonth(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}
