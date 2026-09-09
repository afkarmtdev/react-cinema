import { localAuthBackend, type AuthBackend } from './auth';
import { localLibraryStore, type LibraryStore } from './libraryStore';
import {
  createAuthBackend,
  createClient,
  createLibraryStore,
} from './pocketbase';

/**
 * Picks where accounts and the library live. With EXPO_PUBLIC_POCKETBASE_URL
 * set (see .env.example) everything goes through that PocketBase server and
 * follows the user across devices. Without it the app keeps everything on
 * the device in AsyncStorage, which is also what the tests use.
 */
const url = process.env.EXPO_PUBLIC_POCKETBASE_URL?.trim().replace(/\/+$/, '');

export const pocketbaseUrl: string | null = url || null;
export const usingPocketBase = pocketbaseUrl !== null;

const pb = pocketbaseUrl ? createClient(pocketbaseUrl) : null;

export const authBackend: AuthBackend = pb
  ? createAuthBackend(pb)
  : localAuthBackend;

export const libraryStore: LibraryStore = pb
  ? createLibraryStore(pb)
  : localLibraryStore;
