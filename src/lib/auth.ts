import { storage, StorageKeys } from './storage';

export interface User {
  id: string;
  name: string;
  email: string;
  /** Profile picture: a data URI on the device, a file URL on the server. */
  avatar?: string;
  /** Entry ids on the top four shelf, in the order they were added. */
  favourites?: string[];
}

/** A picture picked from the photo library, before it is stored. */
export interface NewAvatar {
  uri: string;
  /** The image bytes, so the device backend can keep them past the cache. */
  base64?: string;
  mimeType?: string;
}

/** The parts of a profile the user can change. Absent means unchanged. */
export interface ProfilePatch {
  name?: string;
  /** A new picture, or null to remove the current one. */
  avatar?: NewAvatar | null;
  favourites?: string[];
}

/**
 * Auth error whose message is a translation key (resolved by the screen),
 * e.g. "errEmailExists" or "errIncorrect".
 */
export class AuthError extends Error {}

/**
 * Where accounts and sessions live. AuthContext does the input validation
 * (empty fields, email shape, password length) and then hands the cleaned
 * values to one of these. Each method throws an AuthError with a translation
 * key when something the user can fix went wrong.
 */
export interface AuthBackend {
  /** The persisted session from a previous launch, if it is still usable. */
  restore: () => Promise<User | null>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  /** Applies the patch to the signed-in user and returns the result. */
  updateProfile: (user: User, patch: ProfilePatch) => Promise<User>;
}

// Stored locally to emulate a credential check (demo only, no real backend).
interface StoredAccount extends User {
  password: string;
}

/** What the device keeps for a picked picture: the bytes, or the path. */
export const avatarUri = (avatar: NewAvatar): string =>
  avatar.base64
    ? `data:${avatar.mimeType ?? 'image/jpeg'};base64,${avatar.base64}`
    : avatar.uri;

/** Accounts kept on this device only, in AsyncStorage. */
export const localAuthBackend: AuthBackend = {
  restore: () => storage.get<User>(StorageKeys.session),

  async signup(name, email, password) {
    const accounts =
      (await storage.get<StoredAccount[]>(StorageKeys.users)) ?? [];
    if (accounts.some((a) => a.email === email)) {
      throw new AuthError('errEmailExists');
    }
    const account: StoredAccount = {
      id: `${Date.now()}`,
      name,
      email,
      password,
    };
    await storage.set(StorageKeys.users, [...accounts, account]);

    const { password: _pw, ...user } = account;
    await storage.set(StorageKeys.session, user);
    return user;
  },

  async login(email, password) {
    const accounts =
      (await storage.get<StoredAccount[]>(StorageKeys.users)) ?? [];
    const account = accounts.find((a) => a.email === email);
    if (!account || account.password !== password) {
      throw new AuthError('errIncorrect');
    }
    const { password: _pw, ...user } = account;
    await storage.set(StorageKeys.session, user);
    return user;
  },

  logout: () => storage.remove(StorageKeys.session),

  async updateProfile(user, patch) {
    const next: User = { ...user };
    if (patch.name !== undefined) next.name = patch.name;
    if (patch.favourites !== undefined) next.favourites = patch.favourites;
    if (patch.avatar === null) delete next.avatar;
    else if (patch.avatar) next.avatar = avatarUri(patch.avatar);

    const accounts =
      (await storage.get<StoredAccount[]>(StorageKeys.users)) ?? [];
    await storage.set(
      StorageKeys.users,
      accounts.map((a) =>
        a.id === user.id ? { ...next, password: a.password } : a,
      ),
    );
    await storage.set(StorageKeys.session, next);
    return next;
  },
};
