import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import { useThemedStyles } from '../../context/ThemeContext';
import { motion, radius, spacing, type ThemeColors } from '../../theme';
import { KeyboardScrollBoundary } from './KeyboardScrollView';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra styles for the panel, such as a fixed height. */
  style?: ViewStyle;
  /** Lifts the panel above the keyboard, for sheets with a text input. */
  avoidKeyboard?: boolean;
}

/**
 * How far the panel extends below the screen edge. The entering spring
 * overshoots by a few percent of its travel; this keeps the bottom edge
 * covered while it does, so the bounce never opens a gap.
 */
const BLEED = 48;

const FADE_IN_MS = 200;
const FADE_OUT_MS = 160;
const SLIDE_OUT_MS = 220;

/**
 * A bottom sheet on a dimmed backdrop. The Modal itself does not animate:
 * it would fade the panel too, and a panel that fades in while it slides
 * seems to appear halfway up its travel. Instead the backdrop fades and
 * the panel slides, both from the first frame, and on close the two run
 * back before the Modal is taken down.
 */
export function Sheet({
  visible,
  onClose,
  children,
  style,
  avoidKeyboard = false,
}: SheetProps) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [offset] = useState(() => new Animated.Value(height));
  const [dim] = useState(() => new Animated.Value(0));

  // The slide reads the height through a ref so a height change while the
  // sheet is open does not restart it. On the web the window height follows
  // the visual viewport, which shrinks when the keyboard opens and changes
  // again as its suggestion bar comes and goes while typing. Restarting the
  // effect then threw the panel back below the screen on each change.
  const heightRef = useRef(height);
  useEffect(() => {
    heightRef.current = height;
  }, [height]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      offset.setValue(heightRef.current);
      dim.setValue(0);
      // A spring rather than a curve, so the panel eases into place the
      // way an iOS sheet does instead of stopping dead.
      const enter = Animated.parallel([
        Animated.timing(dim, {
          toValue: 1,
          duration: FADE_IN_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(offset, {
          toValue: 0,
          ...motion.enter,
          useNativeDriver: true,
        }),
      ]);
      enter.start();
      return () => enter.stop();
    }
    const leave = Animated.parallel([
      Animated.timing(dim, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }),
      Animated.timing(offset, {
        toValue: heightRef.current,
        duration: SLIDE_OUT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    leave.start(({ finished }) => {
      if (finished) setMounted(false);
    });
    return () => leave.stop();
  }, [visible, offset, dim]);

  const content = (
    <>
      <Animated.View style={[styles.backdrop, { opacity: dim }]}>
        <Pressable
          style={styles.fill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('closeSheet')}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.lg + BLEED },
          style,
          { transform: [{ translateY: offset }] },
        ]}
      >
        <View style={styles.handle} />
        <KeyboardScrollBoundary>{children}</KeyboardScrollBoundary>
      </Animated.View>
    </>
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          // KeyboardAvoidingView does nothing on the web, where the keyboard
          // covers the page instead of resizing it. Sizing the root to the
          // visible height keeps the panel above the keyboard there.
          style={[styles.root, Platform.OS === 'web' && { flex: 0, height }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.root}>{content}</View>
      )}
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.overlay,
    },
    fill: { flex: 1 },
    sheet: {
      maxHeight: '80%',
      marginBottom: -BLEED,
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing.sm,
    },
  });
