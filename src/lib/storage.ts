import AsyncStorage from '@react-native-async-storage/async-storage';

/** Thin typed wrapper around AsyncStorage with JSON (de)serialisation. */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

export const StorageKeys = {
  users: '@gscreviews/users',
  session: '@gscreviews/session',
  /** Legacy key from the OMDb-only version; migrated into `library` once. */
  reviews: '@gscreviews/reviews',
  library: '@gscreviews/library',
  /** Serialized PocketBase session (token plus user record). */
  pocketbaseAuth: '@gscreviews/pocketbase-auth',
  language: '@gscreviews/language',
} as const;
