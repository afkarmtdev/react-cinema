import { Platform } from 'react-native';
import { localAuthBackend, type AuthBackend } from './auth';
import { localLibraryStore, type LibraryStore } from './libraryStore';
import {
  createAuthBackend,
  createClient,
  createLibraryStore,
} from './pocketbase';
import { sqliteLibraryStore } from './sqliteStore';

/**
 * Where accounts and the library live: on this device in AsyncStorage, or on
 * a PocketBase server so the library follows the user across devices. The
 * choice is made at runtime in the Storage setting (see StorageContext);
 * EXPO_PUBLIC_POCKETBASE_URL only supplies the first-launch default.
 */
export type StorageMode = 'device' | 'server';

export interface StorageSettings {
  mode: StorageMode;
  /** The PocketBase address. Kept even in device mode so it is not retyped. */
  serverUrl: string;
}

/** The pair of stores the contexts talk to, built for one set of settings. */
export interface Backend {
  mode: StorageMode;
  /** The server in use, or null when everything stays on the device. */
  serverUrl: string | null;
  auth: AuthBackend;
  library: LibraryStore;
}

/** Trims whitespace and trailing slashes so "http://x:8090/" and "http://x:8090" match. */
export const normaliseServerUrl = (url: string): string =>
  url.trim().replace(/\/+$/, '');

/** A usable server address: http or https, with a host. */
export const isValidServerUrl = (url: string): boolean =>
  /^https?:\/\/[^\s/]+/i.test(normaliseServerUrl(url));

const envUrl = normaliseServerUrl(process.env.EXPO_PUBLIC_POCKETBASE_URL ?? '');

/** What a fresh install starts with, before the user has picked anything. */
export const defaultStorageSettings: StorageSettings = {
  mode: envUrl ? 'server' : 'device',
  serverUrl: envUrl,
};

/**
 * On a phone the library is a SQLite file. expo-sqlite on web is still alpha
 * and needs extra Metro setup, so web keeps the AsyncStorage store.
 */
export const deviceLibraryStore: LibraryStore =
  Platform.OS === 'web' ? localLibraryStore : sqliteLibraryStore;

export const localBackend: Backend = {
  mode: 'device',
  serverUrl: null,
  auth: localAuthBackend,
  library: deviceLibraryStore,
};

export function createBackend(settings: StorageSettings): Backend {
  const url = normaliseServerUrl(settings.serverUrl);
  if (settings.mode !== 'server' || !isValidServerUrl(url)) {
    return localBackend;
  }
  const pb = createClient(url);
  return {
    mode: 'server',
    serverUrl: url,
    auth: createAuthBackend(pb),
    library: createLibraryStore(pb),
  };
}

const HEALTH_TIMEOUT_MS = 6000;

/**
 * Asks the server whether it is up. PocketBase answers GET /api/health with
 * 200 and no login; any other reply, a bad address, or a timeout is false.
 */
export async function checkServer(url: string): Promise<boolean> {
  const base = normaliseServerUrl(url);
  if (!isValidServerUrl(base)) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/api/health`, {
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
