import React from 'react';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react-native';
import {
  InputAccessoryView,
  Keyboard,
  StyleSheet,
  Text,
  type KeyboardEvent,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '../../context/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { KeyboardDoneBar } from '../ui/KeyboardDoneBar';
import {
  KEYBOARD_GAP,
  KeyboardScrollBoundary,
  KeyboardScrollView,
  revealOffset,
  useKeyboardFocus,
} from '../ui/KeyboardScrollView';
import { TextField } from '../ui/TextField';

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
    <LanguageProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </LanguageProvider>
  </SafeAreaProvider>
);

type Handler = (event: KeyboardEvent) => void;

/** Captures the keyboard listeners so a test can raise and lower it. */
function fakeKeyboard() {
  const handlers: Record<string, Handler> = {};
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((
    name: string,
    handler: Handler,
  ) => {
    handlers[name] = handler;
    return { remove: jest.fn() };
  }) as unknown as typeof Keyboard.addListener);
  const event = (height: number) =>
    ({
      endCoordinates: { height, screenX: 0, screenY: 844 - height, width: 390 },
    }) as KeyboardEvent;
  return {
    show: (height: number) =>
      act(() => handlers.keyboardWillShow(event(height))),
    hide: () => act(() => handlers.keyboardWillHide(event(0))),
  };
}

afterEach(() => jest.restoreAllMocks());

describe('revealOffset', () => {
  it('scrolls a covered field up until it clears the keyboard with a gap', () => {
    // 400 points visible above the keyboard, field from 500 to 600.
    expect(revealOffset({ y: 500, height: 100 }, 0, 400)).toBe(
      600 + KEYBOARD_GAP - 400,
    );
  });

  it('leaves a field that already fits where it is', () => {
    expect(revealOffset({ y: 100, height: 52 }, 0, 400)).toBe(0);
  });

  it('keeps the top of a field taller than the room left in view', () => {
    expect(revealOffset({ y: 500, height: 600 }, 0, 400)).toBe(
      500 - KEYBOARD_GAP,
    );
  });

  it('scrolls back up to a field above the visible area', () => {
    expect(revealOffset({ y: 100, height: 52 }, 300, 400)).toBe(
      100 - KEYBOARD_GAP,
    );
  });
});

describe('KeyboardScrollView', () => {
  it('leaves room under the content while the keyboard is up', () => {
    const keyboard = fakeKeyboard();
    render(
      <KeyboardScrollView>
        <Text>Form</Text>
      </KeyboardScrollView>,
      { wrapper },
    );
    expect(screen.queryByTestId('keyboard-spacer')).toBeNull();

    keyboard.show(336);
    const spacer = screen.getByTestId('keyboard-spacer');
    expect(StyleSheet.flatten(spacer.props.style).height).toBe(336);

    keyboard.hide();
    expect(screen.queryByTestId('keyboard-spacer')).toBeNull();
  });

  it('gives inputs a focus report inside it and a no-op outside', () => {
    const outside = renderHook(() => useKeyboardFocus()).result.current;
    const inside = renderHook(() => useKeyboardFocus(), {
      wrapper: ({ children }) =>
        wrapper({
          children: <KeyboardScrollView>{children}</KeyboardScrollView>,
        }),
    }).result.current;
    const sheet = renderHook(() => useKeyboardFocus(), {
      wrapper: ({ children }) =>
        wrapper({
          children: (
            <KeyboardScrollView>
              <KeyboardScrollBoundary>{children}</KeyboardScrollBoundary>
            </KeyboardScrollView>
          ),
        }),
    }).result.current;
    expect(inside).not.toBe(outside);
    expect(sheet).toBe(outside);
  });
});

describe('KeyboardDoneBar', () => {
  it('puts the keyboard away', () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    render(<KeyboardDoneBar nativeID="notes" />, { wrapper });
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(dismiss).toHaveBeenCalled();
  });

  it('is tied to its own text field', () => {
    render(<TextField label="Notes" placeholder="What did you think?" />, {
      wrapper,
    });
    const input = screen.getByPlaceholderText('What did you think?');
    const bar = screen.UNSAFE_getByType(InputAccessoryView);
    expect(input.props.inputAccessoryViewID).toBeTruthy();
    expect(bar.props.nativeID).toBe(input.props.inputAccessoryViewID);
  });
});
