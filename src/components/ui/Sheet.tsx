import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
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
 * A bottom sheet on a dimmed backdrop. The Modal only fades, so the backdrop
 * stays put while the panel slides up on its own; with the Modal's built-in
 * slide the backdrop would ride up together with the panel.
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
  const [offset] = useState(() => new Animated.Value(height));

  useEffect(() => {
    if (!visible) {
      offset.setValue(height);
      return;
    }
    // A spring rather than a curve, so the panel eases into place the way
    // an iOS sheet does instead of stopping dead.
    const slide = Animated.spring(offset, {
      toValue: 0,
      ...motion.enter,
      useNativeDriver: true,
    });
    slide.start();
    return () => slide.stop();
  }, [visible, height, offset]);

  const content = (
    <>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('closeSheet')}
      />
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.lg },
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
      visible={visible}
      transparent
      animationType="fade"
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
    sheet: {
      maxHeight: '80%',
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
