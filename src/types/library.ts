/**
 * A single entry in the user's library: a film, a series, or a book. Every
 * field except the title is optional because entries are typed in by hand
 * (there is no catalogue API behind this), so the UI must cope with gaps.
 */
export type ItemKind = 'film' | 'series' | 'book';

/**
 * Where the user is with the entry. The wording in the UI depends on the
 * kind (watchlist / watching / watched, or to read / reading / read).
 */
export type ItemStatus = 'want' | 'inProgress' | 'done';

export const ITEM_KINDS: ItemKind[] = ['film', 'series', 'book'];
export const ITEM_STATUSES: ItemStatus[] = ['want', 'inProgress', 'done'];

export interface LibraryItem {
  id: string;
  /** The account that owns this entry (libraries are per user). */
  ownerId: string;
  kind: ItemKind;
  title: string;
  year?: number;
  /** Director for a film or series, author for a book. */
  creator?: string;
  description?: string;
  /** Cover or poster image URL, pasted in by the user. */
  poster?: string;
  tags: string[];
  status: ItemStatus;
  /** 1.0 to 10.0 with one decimal, only once the user has scored it. */
  rating?: number;
  /** The user's own written notes or review. */
  review?: string;
  createdAt: number;
  updatedAt: number;
  /** When the user started it, if they recorded that. Optional for every kind. */
  startedAt?: number;
  /**
   * When it was finished. Set while the status is "done": the date picked on
   * the form, or the moment the status changed. Drives the diary order and
   * the month and year summaries.
   */
  finishedAt?: number;
}

/**
 * The editable part of an entry, as collected by the add and edit form. The
 * two dates are included so an old read or watch can be backlogged with the
 * day it actually happened.
 */
export type LibraryItemInput = Omit<
  LibraryItem,
  'id' | 'ownerId' | 'createdAt' | 'updatedAt'
>;

/** Films and series are watched; books are read. */
export const isReadKind = (kind: ItemKind): boolean => kind === 'book';
