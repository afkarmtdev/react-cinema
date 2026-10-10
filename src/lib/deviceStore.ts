/**
 * The library store used when everything stays on the device. On a phone it
 * is the SQLite file; deviceStore.web.ts swaps in the AsyncStorage store for
 * the browser. Metro picks the file by platform, so the web bundle never
 * pulls in expo-sqlite (its web build needs a wasm file and extra setup).
 */
export { sqliteLibraryStore as deviceLibraryStore } from './sqliteStore';
