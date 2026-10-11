import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useThemedStyles } from '../../context/ThemeContext';
import { spacing, typography, type ThemeColors } from '../../theme';

/**
 * The strip above the iOS keyboard with a Done button, so the keyboard can
 * be put away from any field. A multiline field needs it most, since its
 * return key adds a line. Android has the system back key for this and the
 * web has no keyboard strip, so it renders nothing there.
 *
 * Each input needs its own: pass the same id to the input's
 * inputAccessoryViewID.
 */
export function KeyboardDoneBar({ nativeID }: { nativeID: string }) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useLanguage();
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.bar}>
        <Pressable
          onPress={() => Keyboard.dismiss()}
          hitSlop={8}
          accessibilityRole="button"
          style={styles.done}
        >
          <Text style={styles.label}>{t('keyboardDone')}</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bar: {
      height: 44,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.elevated,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    done: { paddingVertical: spacing.sm, paddingLeft: spacing.lg },
    label: { ...typography.body, fontWeight: '600', color: colors.primary },
  });
