import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  View,
  type HostInstance,
  type ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme';

/** Room kept between the focused field and the top of the keyboard. */
export const KEYBOARD_GAP = spacing.xl;

/**
 * Where to scroll so a field (y and height in content coordinates) sits
 * whole above the keyboard with KEYBOARD_GAP under it. A field taller than
 * the room left keeps its top in view instead. Returns the current offset
 * when the field already fits.
 */
export function revealOffset(
  field: { y: number; height: number },
  offset: number,
  visible: number,
): number {
  let target = offset;
  const bottom = field.y + field.height + KEYBOARD_GAP;
  if (bottom > offset + visible) target = bottom - visible;
  const top = field.y - KEYBOARD_GAP;
  if (top < target) target = Math.max(0, top);
  return target;
}

const FocusContext = createContext<(() => void) | null>(null);
const noop = () => {};

/**
 * For an input inside a KeyboardScrollView: call the returned function on
 * focus, so the scroll view knows the field is its own and brings it above
 * the keyboard. Outside one it does nothing.
 */
export function useKeyboardFocus() {
  return useContext(FocusContext) ?? noop;
}

/**
 * Stops inputs inside it from reporting to a KeyboardScrollView further up.
 * Sheets use it, so a field in a sheet never scrolls the screen behind it.
 */
export function KeyboardScrollBoundary({ children }: { children: ReactNode }) {
  return <FocusContext.Provider value={null}>{children}</FocusContext.Provider>;
}

/**
 * A ScrollView for screens with text fields. The keyboard covers the bottom
 * of the screen on both platforms (Android draws edge to edge, so the window
 * no longer shrinks for it), so this leaves that much room under the content
 * and scrolls the focused field, whole and with a gap under it, above the
 * keyboard. Dragging the content or tapping empty space puts the keyboard
 * away.
 *
 * It assumes its bottom edge is the bottom of the screen, which holds for
 * every screen and modal that uses it.
 */
export function KeyboardScrollView({
  children,
  onLayout,
  onScroll,
  ...props
}: ScrollViewProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const offset = useRef(0);
  const viewport = useRef(0);
  const covered = useRef(0);
  const active = useRef<HostInstance | null>(null);
  const [keyboard, setKeyboard] = useState({ height: 0, shown: 0 });

  const reveal = useCallback(() => {
    const scroll = scrollRef.current;
    const content = contentRef.current;
    const input = TextInput.State.currentlyFocusedInput();
    if (!scroll || !content || !input || input !== active.current) return;
    if (covered.current === 0) return;
    input.measureLayout(
      content,
      (_x, y, _width, height) => {
        const visible = viewport.current - covered.current;
        const target = revealOffset({ y, height }, offset.current, visible);
        if (Math.abs(target - offset.current) > 1) {
          scroll.scrollTo({ y: target, animated: true });
        }
      },
      noop,
    );
  }, []);

  // An input reports its focus here. When the keyboard is already up (focus
  // moved from one field to the next) this is the only signal there is.
  const onFieldFocus = useCallback(() => {
    active.current = TextInput.State.currentlyFocusedInput();
    requestAnimationFrame(reveal);
  }, [reveal]);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    // Android leaves the navigation bar out of the height, but the app draws
    // behind that bar, so the keyboard covers it too.
    const extra = ios ? 0 : insets.bottom;
    const show = Keyboard.addListener(
      ios ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const height = event.endCoordinates.height + extra;
        covered.current = height;
        setKeyboard((k) => ({ height, shown: k.shown + 1 }));
      },
    );
    const hide = Keyboard.addListener(
      ios ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        covered.current = 0;
        setKeyboard((k) => ({ ...k, height: 0 }));
      },
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom]);

  // Runs once the room for the keyboard is laid out, so the scroll can reach.
  useEffect(() => {
    if (keyboard.shown === 0) return;
    const frame = requestAnimationFrame(reveal);
    return () => cancelAnimationFrame(frame);
  }, [keyboard.shown, reveal]);

  return (
    <FocusContext.Provider value={onFieldFocus}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        scrollEventThrottle={16}
        {...props}
        ref={scrollRef}
        // React Native's typings still want a ref that is never null.
        innerViewRef={contentRef as RefObject<View>}
        onLayout={(event) => {
          viewport.current = event.nativeEvent.layout.height;
          onLayout?.(event);
        }}
        onScroll={(event) => {
          offset.current = event.nativeEvent.contentOffset.y;
          onScroll?.(event);
        }}
      >
        {children}
        {keyboard.height > 0 && (
          <View style={{ height: keyboard.height }} testID="keyboard-spacer" />
        )}
      </ScrollView>
    </FocusContext.Provider>
  );
}
