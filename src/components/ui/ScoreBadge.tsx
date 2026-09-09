import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { formatScore, isPerfectScore } from '../../lib/score';
import { radius, typography, type ThemeColors } from '../../theme';
import { useThemedStyles, useTheme } from '../../context/ThemeContext';

interface ScoreBadgeProps {
  /** 1.0 to 10.0. */
  value: number;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

/** "8.5" in a pill with a star. A perfect 10 gets the yellow treatment. */
export function ScoreBadge({ value, size = 'sm', style }: ScoreBadgeProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const perfect = isPerfectScore(value);
  const textStyle = sizes[size];
  const iconSize = size === 'lg' ? 16 : size === 'md' ? 13 : 11;
  return (
    <View
      style={[styles.badge, perfect && styles.badgePerfect, style]}
      accessibilityLabel={`${formatScore(value)} out of 10`}
    >
      <Ionicons
        name="star"
        size={iconSize}
        color={perfect ? colors.onPrimary : colors.star}
      />
      <Text style={[styles.text, textStyle, perfect && styles.textPerfect]}>
        {formatScore(value)}
      </Text>
    </View>
  );
}

const sizes = {
  sm: { ...typography.tiny },
  md: { ...typography.caption, fontWeight: '700' as const },
  lg: { ...typography.h3 },
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      alignSelf: 'flex-start',
      backgroundColor: colors.overlay,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgePerfect: { backgroundColor: colors.primary },
    text: { color: colors.onOverlay, fontVariant: ['tabular-nums'] },
    textPerfect: { color: colors.onPrimary },
  });
