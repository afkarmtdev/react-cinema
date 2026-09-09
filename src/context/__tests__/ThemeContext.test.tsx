import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme, useThemedStyles } from '../ThemeContext';
import { cinema, paperback, viceCity, type ThemeColors } from '../../theme';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('ThemeContext', () => {
  it('starts on Cinema with light status bar text', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.name).toBe('cinema');
    expect(result.current.colors).toBe(cinema);
    expect(result.current.isLight).toBe(false);
  });

  it('switches themes and persists the choice', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme('paperback'));
    expect(result.current.colors).toBe(paperback);
    expect(result.current.isLight).toBe(true);

    await waitFor(async () =>
      expect(await AsyncStorage.getItem('@gscreviews/theme')).toBe(
        JSON.stringify('paperback'),
      ),
    );
  });

  it('restores a saved theme on launch and ignores unknown values', async () => {
    await AsyncStorage.setItem('@gscreviews/theme', JSON.stringify('viceCity'));
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.colors).toBe(viceCity));

    await AsyncStorage.setItem('@gscreviews/theme', JSON.stringify('neon'));
    const second = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(second.result.current.name).toBe('cinema');
  });

  it('rebuilds themed styles only when the theme changes', () => {
    const factory = jest.fn((colors: ThemeColors) => ({
      color: colors.primary,
    }));
    const { result, rerender } = renderHook(
      () => ({ theme: useTheme(), styles: useThemedStyles(factory) }),
      { wrapper },
    );
    expect(result.current.styles.color).toBe(cinema.primary);
    rerender({});
    expect(factory).toHaveBeenCalledTimes(1);

    act(() => result.current.theme.setTheme('viceCity'));
    expect(result.current.styles.color).toBe(viceCity.primary);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
