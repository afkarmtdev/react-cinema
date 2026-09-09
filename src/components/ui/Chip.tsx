import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { radius, spacing, typography, type ThemeColors } from '../../theme';
import { useThemedStyles, useTheme } from '../../context/ThemeContext';

interface ChipProps {
  label: string;
  /** Highlighted (selected) state. */
  active?: boolean;
  onPress?: () => void;
  /** Shows a small close icon and calls this when it is tapped. */
  onRemove?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

/** Small pill used for tags, filters, and kind or status pickers. */
export function Chip({
  label,
  active = false,
  onPress,
  onRemove,
  icon,
  style,
}: ChipProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const color = active ? colors.primary : colors.textSecondary;
  const body = (
    <>
      {icon && <Ionicons name={icon} size={14} color={color} />}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      {onRemove && (
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          onPress={onRemove}
        >
          <Ionicons name="close" size={14} color={color} />
        </Pressable>
      )}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.chip, active && styles.chipActive, style]}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.pressed,
        style,
      ]}
    >
      {body}
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: { borderColor: colors.primary },
    pressed: { opacity: 0.8 },
    label: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    labelActive: { color: colors.primary },
  });
