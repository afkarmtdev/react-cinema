/**
 * Web build of deviceStore.ts. expo-sqlite on web is still alpha, so the
 * browser keeps the library in AsyncStorage (localStorage underneath).
 */
export { localLibraryStore as deviceLibraryStore } from './libraryStore';
