import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { storage, StorageKeys } from '../lib/storage';
import { isValidEmail, isValidPassword } from '../lib/validation';

export interface User {
  id: string;
  name: string;
  email: string;
}

// Stored locally to emulate a credential check (demo only, no real backend).
interface StoredAccount extends User {
  password: string;
}

interface AuthContextValue {
  user: User | null;
  /** True while the persisted session is being restored on launch. */
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/** Auth error whose message is a translation key (resolved by the screen). */
export class AuthError extends Error {}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore the persisted session on first launch.
  useEffect(() => {
    let active = true;
    (async () => {
      const session = await storage.get<User>(StorageKeys.session);
      if (active && session) setUser(session);
      if (active) setInitializing(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedName || !trimmedEmail || !password) {
        throw new AuthError('errFillAll');
      }
      if (!isValidEmail(trimmedEmail)) {
        throw new AuthError('errInvalidEmail');
      }
      if (!isValidPassword(password)) {
        throw new AuthError('errPasswordLength');
      }

      const accounts =
        (await storage.get<StoredAccount[]>(StorageKeys.users)) ?? [];
      if (accounts.some((a) => a.email === trimmedEmail)) {
        throw new AuthError('errEmailExists');
      }

      const account: StoredAccount = {
        id: `${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        password,
      };
      await storage.set(StorageKeys.users, [...accounts, account]);

      const { password: _pw, ...safeUser } = account;
      await storage.set(StorageKeys.session, safeUser);
      setUser(safeUser);
    },
    [],
  );

  const login = useCallback(async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      throw new AuthError('errEnterCredentials');
    }
    if (!isValidEmail(trimmedEmail)) {
      throw new AuthError('errInvalidEmail');
    }

    const accounts =
      (await storage.get<StoredAccount[]>(StorageKeys.users)) ?? [];
    const account = accounts.find((a) => a.email === trimmedEmail);
    if (!account || account.password !== password) {
      throw new AuthError('errIncorrect');
    }

    const { password: _pw, ...safeUser } = account;
    await storage.set(StorageKeys.session, safeUser);
    setUser(safeUser);
  }, []);

  const logout = useCallback(async () => {
    await storage.remove(StorageKeys.session);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, signup, logout }),
    [user, initializing, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
