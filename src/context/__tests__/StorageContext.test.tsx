import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localBackend } from '../../lib/backend';
import { AuthProvider, useAuth } from '../AuthContext';
import {
  StorageProvider,
  useStorage,
  useStorageBackend,
} from '../StorageContext';

const KEY = '@gscreviews/storage-settings';
const SERVER = 'http://192.168.1.20:8090';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <StorageProvider>{children}</StorageProvider>
);

// The provider renders nothing until the saved choice is read, so the hook
// result is null on the first pass. Wait for it.
async function mountStorage() {
  const utils = renderHook(() => useStorage(), { wrapper });
  await waitFor(() => expect(utils.result.current).toBeTruthy());
  return utils;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('StorageContext', () => {
  it('starts on the device with the local stores when nothing is saved', async () => {
    const { result } = await mountStorage();
    expect(result.current.settings).toEqual({ mode: 'device', serverUrl: '' });
    expect(result.current.backend).toBe(localBackend);
  });

  it('switches to a server, persists the choice, and cleans the address', async () => {
    const { result } = await mountStorage();
    await act(async () => {
      await result.current.setSettings({
        mode: 'server',
        serverUrl: `  ${SERVER}/  `,
      });
    });
    expect(result.current.settings).toEqual({
      mode: 'server',
      serverUrl: SERVER,
    });
    expect(result.current.backend.mode).toBe('server');
    expect(result.current.backend.serverUrl).toBe(SERVER);
    expect(result.current.backend).not.toBe(localBackend);
    expect(await AsyncStorage.getItem(KEY)).toBe(
      JSON.stringify({ mode: 'server', serverUrl: SERVER }),
    );
  });

  it('falls back to the device when server mode has no usable address', async () => {
    const { result } = await mountStorage();
    await act(async () => {
      await result.current.setSettings({ mode: 'server', serverUrl: 'nope' });
    });
    expect(result.current.settings.mode).toBe('device');
    expect(result.current.backend).toBe(localBackend);
  });

  it('restores a saved choice on launch and ignores a malformed one', async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({ mode: 'server', serverUrl: SERVER }),
    );
    const first = await mountStorage();
    expect(first.result.current.backend.serverUrl).toBe(SERVER);

    await AsyncStorage.setItem(KEY, JSON.stringify({ mode: 'cloud' }));
    const second = await mountStorage();
    expect(second.result.current.backend).toBe(localBackend);
  });

  it('gives the contexts the local pair outside a provider', () => {
    const { result } = renderHook(() => useStorageBackend());
    expect(result.current).toBe(localBackend);
  });

  it('signs the user out when the storage changes', async () => {
    const both = ({ children }: { children: React.ReactNode }) => (
      <StorageProvider>
        <AuthProvider>{children}</AuthProvider>
      </StorageProvider>
    );
    const { result } = renderHook(
      () => ({ storage: useStorage(), auth: useAuth() }),
      { wrapper: both },
    );
    await waitFor(() => expect(result.current.auth.initializing).toBe(false));
    await act(async () => {
      await result.current.auth.signup('Ali', 'ali@example.com', 'secret');
    });
    expect(result.current.auth.user).not.toBeNull();

    await act(async () => {
      await result.current.storage.setSettings({
        mode: 'server',
        serverUrl: SERVER,
      });
    });
    await waitFor(() => expect(result.current.auth.initializing).toBe(false));
    expect(result.current.auth.user).toBeNull();
    // The device account is still there for when the user switches back.
    expect(await AsyncStorage.getItem('@gscreviews/users')).toContain(
      'ali@example.com',
    );
  });

  describe('testConnection', () => {
    const realFetch = global.fetch;
    afterEach(() => {
      global.fetch = realFetch;
    });

    it('is true when the health endpoint answers 200', async () => {
      const fetchMock = jest.fn(async () => ({ ok: true }) as Response);
      global.fetch = fetchMock as unknown as typeof fetch;
      const { result } = await mountStorage();
      expect(await result.current.testConnection(`${SERVER}/`)).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        `${SERVER}/api/health`,
        expect.objectContaining({ signal: expect.anything() }),
      );
    });

    it('is false on a failed request or a bad address', async () => {
      const fetchMock = jest.fn(async () => {
        throw new TypeError('Network request failed');
      });
      global.fetch = fetchMock as unknown as typeof fetch;
      const { result } = await mountStorage();
      expect(await result.current.testConnection(SERVER)).toBe(false);
      expect(await result.current.testConnection('ftp://x')).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
