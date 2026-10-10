import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AuthError,
  type AuthBackend,
  type ProfilePatch,
  type User,
} from '../lib/auth';
import { isValidEmail, isValidPassword } from '../lib/validation';
import { useStorageBackend } from './StorageContext';

export { AuthError, type ProfilePatch, type User } from '../lib/auth';

interface AuthContextValue {
  user: User | null;
  /** True while the persisted session is being restored on launch. */
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Changes the name, picture, or top four of the signed-in user. */
  updateProfile: (patch: ProfilePatch) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  backend: backendProp,
}: {
  children: React.ReactNode;
  /**
   * Injectable for tests; otherwise the one the Storage setting picked (or
   * the local one outside a StorageProvider).
   */
  backend?: AuthBackend;
}) {
  const chosen = useStorageBackend().auth;
  const backend = backendProp ?? chosen;
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore the persisted session on first launch, and again whenever the
  // Storage setting swaps the backend: sessions belong to one store, so the
  // app starts over from the new one.
  useEffect(() => {
    let active = true;
    setUser(null);
    setInitializing(true);
    backend
      .restore()
      .catch(() => null)
      .then((session) => {
        if (!active) return;
        if (session) setUser(session);
        setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, [backend]);

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

      setUser(await backend.signup(trimmedName, trimmedEmail, password));
    },
    [backend],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedEmail || !password) {
        throw new AuthError('errEnterCredentials');
      }
      if (!isValidEmail(trimmedEmail)) {
        throw new AuthError('errInvalidEmail');
      }

      setUser(await backend.login(trimmedEmail, password));
    },
    [backend],
  );

  const logout = useCallback(async () => {
    await backend.logout();
    setUser(null);
  }, [backend]);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!user) return;
      const cleaned = { ...patch };
      if (patch.name !== undefined) {
        cleaned.name = patch.name.trim();
        if (!cleaned.name) throw new AuthError('errFillAll');
      }
      setUser(await backend.updateProfile(user, cleaned));
    },
    [backend, user],
  );

  const value = useMemo(
    () => ({ user, initializing, login, signup, logout, updateProfile }),
    [user, initializing, login, signup, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
