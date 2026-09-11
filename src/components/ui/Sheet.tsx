import { useEffect, useState, type ReactNode } from 'react';
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

  useEffect(() => {
    if (visible) {
      setMounted(true);
      offset.setValue(height);
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
        toValue: height,
        duration: SLIDE_OUT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    leave.start(({ finished }) => {
      if (finished) setMounted(false);
    });
    return () => leave.stop();
  }, [visible, height, offset, dim]);

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
        {children}
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
          style={styles.root}
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
