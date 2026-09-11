import AsyncStorage from '@react-native-async-storage/async-storage';
import PocketBase, {
  AsyncAuthStore,
  ClientResponseError,
  type RecordModel,
} from 'pocketbase';
import { AuthError, type AuthBackend, type User } from './auth';
import type { LibraryStore } from './libraryStore';
import { StorageKeys } from './storage';
import type { LibraryItem } from '../types/library';

/**
 * PocketBase backend: accounts live in the built-in `users` collection and
 * entries in an `entries` collection (see pocketbase/ for the schema). The
 * server's API rules restrict every request to the signed-in user's own rows.
 */

const ENTRIES = 'entries';
const USERS = 'users';

/** The subset of the SDK that this module uses, so tests can fake it. */
export type Client = Pick<PocketBase, 'collection' | 'authStore' | 'files'>;

export function createClient(url: string): PocketBase {
  const initial = AsyncStorage.getItem(StorageKeys.pocketbaseAuth);
  const store = new AsyncAuthStore({
    save: (serialized) =>
      AsyncStorage.setItem(StorageKeys.pocketbaseAuth, serialized),
    clear: () => AsyncStorage.removeItem(StorageKeys.pocketbaseAuth),
    initial,
  });
  const pb = new PocketBase(url, store);
  // Metro bundles a single client, so cancelling "duplicate" requests would
  // drop the second of two quick saves. Every request should go through.
  pb.autoCancellation(false);
  return pb;
}

/** Maps SDK failures to the translation keys the auth screens understand. */
function toAuthError(error: unknown, fallback: string): AuthError {
  if (error instanceof ClientResponseError) {
    if (error.status === 0) return new AuthError('errNetwork');
    const emailCode = (error.response?.data?.email as { code?: string })?.code;
    if (emailCode === 'validation_not_unique') {
      return new AuthError('errEmailExists');
    }
  }
  return new AuthError(fallback);
}

/**
 * A users record to the app's shape. The avatar is the file field every
 * PocketBase auth collection has, served as a thumbnail; favourites is the
 * JSON list added by the pb_migrations file of the same name.
 */
export const toUser = (pb: Client, record: RecordModel): User => ({
  id: record.id,
  name: String(record.name ?? ''),
  email: String(record.email ?? ''),
  avatar: record.avatar
    ? pb.files.getURL(record, String(record.avatar), { thumb: '256x256' })
    : undefined,
  favourites: Array.isArray(record.favourites)
    ? record.favourites.map(String)
    : [],
});

export function createAuthBackend(pb: Client): AuthBackend {
  return {
    async restore() {
      // The AsyncAuthStore loads its saved token asynchronously; wait for that
      // read before deciding whether there is a session.
      await AsyncStorage.getItem(StorageKeys.pocketbaseAuth);
      if (!pb.authStore.isValid || !pb.authStore.record) return null;
      try {
        const res = await pb.collection(USERS).authRefresh();
        return toUser(pb, res.record);
      } catch (error) {
        // Offline: keep the cached session. Rejected token: drop it.
        if (error instanceof ClientResponseError && error.status === 0) {
          return toUser(pb, pb.authStore.record);
        }
        pb.authStore.clear();
        return null;
      }
    },

    async signup(name, email, password) {
      try {
        await pb.collection(USERS).create({
          name,
          email,
          password,
          passwordConfirm: password,
        });
      } catch (error) {
        throw toAuthError(error, 'errSignupGeneric');
      }
      return this.login(email, password);
    },

    async login(email, password) {
      try {
        const res = await pb
          .collection(USERS)
          .authWithPassword(email, password);
        return toUser(pb, res.record);
      } catch (error) {
        throw toAuthError(error, 'errIncorrect');
      }
    },

    async logout() {
      pb.authStore.clear();
    },

    async updateProfile(user, patch) {
      const fields: Record<string, unknown> = {};
      if (patch.name !== undefined) fields.name = patch.name;
      if (patch.favourites !== undefined) fields.favourites = patch.favourites;
      // An empty value on a file field tells PocketBase to delete the file.
      if (patch.avatar === null) fields.avatar = null;
      try {
        let record: RecordModel | null = null;
        if (Object.keys(fields).length > 0) {
          record = await pb.collection(USERS).update(user.id, fields);
        }
        if (patch.avatar) {
          // A picked file goes up as multipart form data, the way React
          // Native's fetch sends files: a { uri, name, type } part.
          const form = new FormData();
          form.append('avatar', {
            uri: patch.avatar.uri,
            name: 'avatar.jpg',
            type: patch.avatar.mimeType ?? 'image/jpeg',
          } as unknown as Blob);
          record = await pb.collection(USERS).update(user.id, form);
        }
        return record ? toUser(pb, record) : user;
      } catch (error) {
        throw toAuthError(error, 'errProfileSave');
      }
    },
  };
}

const toMillis = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || !value) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
};

const toIso = (ms?: number): string => (ms ? new Date(ms).toISOString() : '');

/** PocketBase record to the app's entry shape. Empty strings and 0 mean unset. */
export function toItem(r: RecordModel): LibraryItem {
  return {
    id: r.id,
    ownerId: String(r.owner ?? ''),
    kind: r.kind,
    title: String(r.title ?? ''),
    year: r.year || undefined,
    creator: r.creator || undefined,
    description: r.description || undefined,
    poster: r.poster || undefined,
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    status: r.status,
    rating: r.rating || undefined,
    review: r.review || undefined,
    createdAt: toMillis(r.created) ?? Date.now(),
    updatedAt: toMillis(r.updated) ?? Date.now(),
    startedAt: toMillis(r.startedAt),
    finishedAt: toMillis(r.finishedAt),
  };
}

/** The app's entry shape to the fields PocketBase stores. */
export function toRecord(item: LibraryItem): Record<string, unknown> {
  return {
    owner: item.ownerId,
    kind: item.kind,
    title: item.title,
    year: item.year ?? 0,
    creator: item.creator ?? '',
    description: item.description ?? '',
    poster: item.poster ?? '',
    tags: item.tags,
    status: item.status,
    rating: item.rating ?? 0,
    review: item.review ?? '',
    startedAt: toIso(item.startedAt),
    finishedAt: toIso(item.finishedAt),
  };
}

export function createLibraryStore(pb: Client): LibraryStore {
  return {
    async list() {
      const records = await pb
        .collection(ENTRIES)
        .getFullList({ sort: '-updated' });
      return records.map(toItem);
    },
    async create(item) {
      return toItem(await pb.collection(ENTRIES).create(toRecord(item)));
    },
    async update(item) {
      return toItem(
        await pb.collection(ENTRIES).update(item.id, toRecord(item)),
      );
    },
    async remove(id) {
      await pb.collection(ENTRIES).delete(id);
    },
  };
}
