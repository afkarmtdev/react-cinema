import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// Mount the hook and wait for the (empty) persisted session to finish loading.
async function mountAuth() {
  const utils = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(utils.result.current.initializing).toBe(false));
  return utils;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('AuthContext', () => {
  it('signs up a new user and sets the current user', async () => {
    const { result } = await mountAuth();
    await act(async () => {
      await result.current.signup('Ali', 'ali@example.com', 'secret');
    });
    expect(result.current.user).toMatchObject({
      name: 'Ali',
      email: 'ali@example.com',
    });
  });

  it('rejects signup with a short password', async () => {
    const { result } = await mountAuth();
    await act(async () => {
      await expect(
        result.current.signup('Ali', 'ali@example.com', '123'),
      ).rejects.toThrow('errPasswordLength');
    });
    expect(result.current.user).toBeNull();
  });

  it('rejects signup with a duplicate email', async () => {
    const { result } = await mountAuth();
    await act(async () => {
      await result.current.signup('Ali', 'a@b.com', 'secret');
    });
    await act(async () => {
      await result.current.logout();
    });
    await act(async () => {
      await expect(
        result.current.signup('Someone Else', 'a@b.com', 'secret'),
      ).rejects.toThrow('errEmailExists');
    });
  });

  it('logs in with correct credentials', async () => {
    const { result } = await mountAuth();
    await act(async () => {
      await result.current.signup('Ali', 'ali@example.com', 'secret');
    });
    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.user).toBeNull();

    await act(async () => {
      await result.current.login('ali@example.com', 'secret');
    });
    expect(result.current.user?.email).toBe('ali@example.com');
  });

  it('rejects login with the wrong password', async () => {
    const { result } = await mountAuth();
    await act(async () => {
      await result.current.signup('Ali', 'ali@example.com', 'secret');
    });
    await act(async () => {
      await result.current.logout();
    });
    await act(async () => {
      await expect(
        result.current.login('ali@example.com', 'wrong-password'),
      ).rejects.toThrow('errIncorrect');
    });
  });
});
