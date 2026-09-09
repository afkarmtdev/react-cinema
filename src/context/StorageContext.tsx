import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  checkServer,
  createBackend,
  defaultStorageSettings,
  isValidServerUrl,
  localBackend,
  normaliseServerUrl,
  type Backend,
  type StorageMode,
  type StorageSettings,
} from '../lib/backend';
import { storage, StorageKeys } from '../lib/storage';

export type { StorageMode, StorageSettings } from '../lib/backend';

interface StorageContextValue {
  /** The saved choice: device or server, plus the server address. */
  settings: StorageSettings;
  /** The stores built from that choice. Changes identity when it changes. */
  backend: Backend;
  /**
   * Saves a new choice and rebuilds the backend. Callers sign the user out
   * first: accounts and entries stay in the store they were made in.
   */
  setSettings: (next: StorageSettings) => Promise<void>;
  /** GETs the server's health endpoint; true when a PocketBase answers. */
  testConnection: (url: string) => Promise<boolean>;
}

const StorageContext = createContext<StorageContextValue | undefined>(
  undefined,
);

const isMode = (value: unknown): value is StorageMode =>
  value === 'device' || value === 'server';

/** Accepts only a well-formed saved value; anything else means "use the default". */
function readSaved(value: unknown): StorageSettings | null {
  if (!value || typeof value !== 'object') return null;
  const { mode, serverUrl } = value as Partial<StorageSettings>;
  if (!isMode(mode) || typeof serverUrl !== 'string') return null;
  return { mode, serverUrl: normaliseServerUrl(serverUrl) };
}

/**
 * Owns the Storage setting and hands AuthProvider and LibraryProvider the
 * matching stores. Sits above both. Children render only once the saved
 * choice has been read, so the session is restored from the right place
 * and never from the env default first.
 */
export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<StorageSettings | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const saved = readSaved(
        await storage.get<unknown>(StorageKeys.storageSettings),
      );
      if (active) setSettingsState(saved ?? defaultStorageSettings);
    })();
    return () => {
      active = false;
    };
  }, []);

  const backend = useMemo(
    () => (settings ? createBackend(settings) : localBackend),
    [settings],
  );

  const setSettings = useCallback(async (next: StorageSettings) => {
    const clean: StorageSettings = {
      mode:
        next.mode === 'server' && isValidServerUrl(next.serverUrl)
          ? 'server'
          : 'device',
      serverUrl: normaliseServerUrl(next.serverUrl),
    };
    await storage.set(StorageKeys.storageSettings, clean);
    setSettingsState(clean);
  }, []);

  const value = useMemo<StorageContextValue | null>(
    () =>
      settings
        ? { settings, backend, setSettings, testConnection: checkServer }
        : null,
    [settings, backend, setSettings],
  );

  if (!value) return null;

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
}

export function useStorage(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within a StorageProvider');
  return ctx;
}

/**
 * The stores the contexts should use: whatever the Storage setting picked,
 * or the local pair when there is no StorageProvider (as in the tests).
 */
export function useStorageBackend(): Backend {
  return useContext(StorageContext)?.backend ?? localBackend;
}
