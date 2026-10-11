import React from 'react';
import { fireEvent, render, renderHook } from '@testing-library/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../context/ThemeContext';
import {
  FLOATING_TAB_BAR_HEIGHT,
  FloatingTabBar,
  useFloatingTabBarInset,
} from '../FloatingTabBar';

// The icon font loader pulls in expo-asset, which is not installed for Jest.
jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

const insets = { top: 0, right: 0, bottom: 34, left: 0 };
const frame = { x: 0, y: 0, width: 390, height: 844 };
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider initialMetrics={{ insets, frame }}>
    <ThemeProvider>{children}</ThemeProvider>
  </SafeAreaProvider>
);

const routes = [
  { key: 'library', name: 'LibraryTab' },
  { key: 'diary', name: 'DiaryTab' },
  { key: 'profile', name: 'ProfileTab' },
];

function makeProps(index: number, libraryDisplay?: 'none' | 'flex') {
  const navigation = {
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: jest.fn(),
  };
  const descriptors = Object.fromEntries(
    routes.map((route) => [
      route.key,
      {
        options: {
          title: route.name.replace('Tab', ''),
          tabBarStyle:
            route.key === 'library' && libraryDisplay
              ? { position: 'absolute', display: libraryDisplay }
              : undefined,
        },
      },
    ]),
  );
  const state = { index, routes };
  return {
    props: { state, descriptors, navigation } as unknown as BottomTabBarProps,
    navigation,
  };
}

describe('FloatingTabBar', () => {
  it('renders one tab per route and marks the active one', () => {
    const { props } = makeProps(1);
    const { getAllByRole, getByRole } = render(<FloatingTabBar {...props} />, {
      wrapper,
    });
    expect(getAllByRole('tab')).toHaveLength(3);
    expect(getByRole('tab', { name: 'Diary', selected: true })).toBeTruthy();
  });

  it('navigates when an inactive tab is pressed', () => {
    const { props, navigation } = makeProps(0);
    const { getByRole } = render(<FloatingTabBar {...props} />, { wrapper });
    fireEvent.press(getByRole('tab', { name: 'Profile' }));
    expect(navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tabPress', target: 'profile' }),
    );
    expect(navigation.navigate).toHaveBeenCalledWith('ProfileTab', undefined);
  });

  it('does not navigate again when the active tab is pressed', () => {
    const { props, navigation } = makeProps(0);
    const { getByRole } = render(<FloatingTabBar {...props} />, { wrapper });
    fireEvent.press(getByRole('tab', { name: 'Library' }));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('hides itself when the focused route asks for display none', () => {
    const { props } = makeProps(0, 'none');
    const { queryByTestId } = render(<FloatingTabBar {...props} />, {
      wrapper,
    });
    expect(queryByTestId('floating-tab-bar')).toBeNull();
  });

  it('puts the capsule back on the focused tab when it shows again', () => {
    // Diary opens an entry: the bar hides on the library detail screen, then
    // comes back on the library list.
    const { getByTestId, rerender } = render(
      <FloatingTabBar {...makeProps(1).props} />,
      { wrapper },
    );
    const layout = { nativeEvent: { layout: { width: 300, height: 64 } } };
    fireEvent(getByTestId('floating-tab-bar'), 'layout', layout);
    rerender(<FloatingTabBar {...makeProps(0, 'none').props} />);
    rerender(<FloatingTabBar {...makeProps(0, 'flex').props} />);
    fireEvent(getByTestId('floating-tab-bar'), 'layout', layout);
    const style = StyleSheet.flatten(
      getByTestId('floating-tab-capsule').props.style,
    );
    expect(style.transform).toEqual([{ translateX: 0 }]);
  });

  it('reports the space a screen needs under its content', () => {
    const { result } = renderHook(() => useFloatingTabBarInset(), { wrapper });
    expect(result.current.bottom).toBe(34);
    expect(result.current.top).toBe(34 + FLOATING_TAB_BAR_HEIGHT);
    expect(result.current.clearance).toBe(34 + FLOATING_TAB_BAR_HEIGHT + 16);
  });
});
