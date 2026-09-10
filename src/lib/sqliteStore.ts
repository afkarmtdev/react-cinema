import * as SQLite from 'expo-sqlite';
import {
  migrateReviews,
  type LegacyReview,
  type LibraryStore,
} from './libraryStore';
import { storage, StorageKeys } from './storage';
import type { ItemKind, ItemStatus, LibraryItem } from '../types/library';

/**
 * The device LibraryStore, backed by a SQLite file in the app's private
 * sandbox (expo-sqlite). Nothing leaves the phone. It replaces the older
 * AsyncStorage store, which kept the whole library under one key and
 * rewrote it on every change; here each entry is a row, reads are indexed
 * by owner, and a write touches one row.
 *
 * The AsyncStorage store is still used on web, where expo-sqlite is alpha,
 * and its legacy-review migration is reused here: the first `list` after
 * the upgrade copies whatever AsyncStorage holds into the table and then
 * removes it from AsyncStorage.
 */

export const DATABASE_NAME = 'cinereact.db';

/** One row of the entries table; optional fields are NULL. */
export interface EntryRow {
  id: string;
  owner_id: string;
  kind: ItemKind;
  title: string;
  year: number | null;
  creator: string | null;
  description: string | null;
  poster: string | null;
  /** JSON-encoded string array. */
  tags: string;
  status: ItemStatus;
  rating: number | null;
  review: string | null;
  created_at: number;
  updated_at: number;
  started_at: number | null;
  finished_at: number | null;
}

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    year INTEGER,
    creator TEXT,
    description TEXT,
    poster TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL,
    rating REAL,
    review TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    started_at INTEGER,
    finished_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS entries_owner_updated
    ON entries (owner_id, updated_at DESC);
`;

/**
 * Columns added after the table first shipped, applied to databases created
 * before them. SQLite has no "add column if missing", so each statement is
 * run and a "duplicate column" error means it was already there.
 */
const COLUMN_UPGRADES = ['ALTER TABLE entries ADD COLUMN started_at INTEGER'];

const COLUMNS =
  'id, owner_id, kind, title, year, creator, description, poster, tags, ' +
  'status, rating, review, created_at, updated_at, started_at, finished_at';
const VALUES =
  '$id, $ownerId, $kind, $title, $year, $creator, $description, $poster, ' +
  '$tags, $status, $rating, $review, $createdAt, $updatedAt, $startedAt, ' +
  '$finishedAt';

const INSERT = `INSERT INTO entries (${COLUMNS}) VALUES (${VALUES})`;
const INSERT_IF_MISSING = `INSERT OR IGNORE INTO entries (${COLUMNS}) VALUES (${VALUES})`;
const UPDATE = `UPDATE entries SET
  owner_id = $ownerId, kind = $kind, title = $title, year = $year,
  creator = $creator, description = $description, poster = $poster,
  tags = $tags, status = $status, rating = $rating, review = $review,
  created_at = $createdAt, updated_at = $updatedAt, started_at = $startedAt,
  finished_at = $finishedAt
  WHERE id = $id`;
const DELETE = 'DELETE FROM entries WHERE id = $id';
const SELECT_BY_OWNER = `SELECT ${COLUMNS} FROM entries WHERE owner_id = $ownerId ORDER BY updated_at DESC`;

/** The named parameters for one entry, matching the statements above. */
export type EntryParams = {
  $id: string;
  $ownerId: string;
  $kind: ItemKind;
  $title: string;
  $year: number | null;
  $creator: string | null;
  $description: string | null;
  $poster: string | null;
  $tags: string;
  $status: ItemStatus;
  $rating: number | null;
  $review: string | null;
  $createdAt: number;
  $updatedAt: number;
  $startedAt: number | null;
  $finishedAt: number | null;
};

export const toParams = (item: LibraryItem): EntryParams => ({
  $id: item.id,
  $ownerId: item.ownerId,
  $kind: item.kind,
  $title: item.title,
  $year: item.year ?? null,
  $creator: item.creator ?? null,
  $description: item.description ?? null,
  $poster: item.poster ?? null,
  $tags: JSON.stringify(item.tags ?? []),
  $status: item.status,
  $rating: item.rating ?? null,
  $review: item.review ?? null,
  $createdAt: item.createdAt,
  $updatedAt: item.updatedAt,
  $startedAt: item.startedAt ?? null,
  $finishedAt: item.finishedAt ?? null,
});

function parseTags(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((t) => typeof t === 'string')
      : [];
  } catch {
    return [];
  }
}

/** A row back into an entry, with NULL columns left out. */
export function toItem(row: EntryRow): LibraryItem {
  const item: LibraryItem = {
    id: row.id,
    ownerId: row.owner_id,
    kind: row.kind,
    title: row.title,
    tags: parseTags(row.tags),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.year !== null) item.year = row.year;
  if (row.creator !== null) item.creator = row.creator;
  if (row.description !== null) item.description = row.description;
  if (row.poster !== null) item.poster = row.poster;
  if (row.rating !== null) item.rating = row.rating;
  if (row.review !== null) item.review = row.review;
  if (row.started_at !== null) item.startedAt = row.started_at;
  if (row.finished_at !== null) item.finishedAt = row.finished_at;
  return item;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Opens the database once and makes sure the table exists. */
function open(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME)
      .then(async (db) => {
        await db.execAsync(SCHEMA);
        for (const statement of COLUMN_UPGRADES) {
          try {
            await db.execAsync(statement);
          } catch (error) {
            if (!/duplicate column/i.test(String(error))) throw error;
          }
        }
        return db;
      })
      .catch((error) => {
        dbPromise = null;
        throw error;
      });
  }
  return dbPromise;
}

/**
 * Entries the AsyncStorage store still holds, or null when there is nothing
 * to carry over. Covers both the previous version of this app (the library
 * key) and the OMDb-only one before it (the reviews key).
 */
async function pendingImport(): Promise<LibraryItem[] | null> {
  const items = await storage.get<LibraryItem[]>(StorageKeys.library);
  if (items) return items;
  const reviews = await storage.get<LegacyReview[]>(StorageKeys.reviews);
  return reviews ? migrateReviews(reviews) : null;
}

/**
 * Moves anything left in AsyncStorage into the table, then clears it there
 * so it is not kept twice. Rows already in the table win on an id clash.
 */
async function importFromAsyncStorage(db: SQLite.SQLiteDatabase) {
  const items = await pendingImport();
  if (!items) return;
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const item of items) {
      await txn.runAsync(INSERT_IF_MISSING, toParams(item));
    }
  });
  await storage.remove(StorageKeys.library);
  await storage.remove(StorageKeys.reviews);
}

export const sqliteLibraryStore: LibraryStore = {
  async list(ownerId) {
    const db = await open();
    await importFromAsyncStorage(db);
    const rows = await db.getAllAsync<EntryRow>(SELECT_BY_OWNER, {
      $ownerId: ownerId,
    });
    return rows.map(toItem);
  },
  async create(item) {
    const db = await open();
    await db.runAsync(INSERT, toParams(item));
    return item;
  },
  async update(item) {
    const db = await open();
    await db.runAsync(UPDATE, toParams(item));
    return item;
  },
  async remove(id) {
    const db = await open();
    await db.runAsync(DELETE, { $id: id });
  },
};
