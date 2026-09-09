import { storage, StorageKeys } from './storage';

export interface User {
  id: string;
  name: string;
  email: string;
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
}

// Stored locally to emulate a credential check (demo only, no real backend).
interface StoredAccount extends User {
  password: string;
}

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
};
