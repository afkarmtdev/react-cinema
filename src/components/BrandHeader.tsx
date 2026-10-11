import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import { useThemedStyles } from '../context/ThemeContext';

interface BrandHeaderProps {
  /** Optional content rendered on the right (e.g. a coins badge). */
  right?: React.ReactNode;
  align?: 'center' | 'left';
  style?: ViewStyle;
}

/**
 * The pocketJing3 wordmark: a skewed yellow tile holding 應 (jing3, the
 * "respond" half of 反應, react) next to the name, with the tone number in
 * the accent colour.
 */
export function BrandHeader({
  right,
  align = 'center',
  style,
}: BrandHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      style={[
        styles.row,
        align === 'center' ? styles.center : styles.left,
        style,
      ]}
    >
      <View style={styles.brand} accessible accessibilityLabel="pocketJing3">
        <View style={styles.logo}>
          <Text style={styles.logoText}>應</Text>
        </View>
        <Text style={styles.tag}>
          pocketJing<Text style={styles.tone}>3</Text>
        </Text>
      </View>
      {right}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    center: { justifyContent: 'center' },
    left: { justifyContent: 'space-between' },
    brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    logo: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: radius.sm,
      transform: [{ skewX: '-8deg' }],
    },
    logoText: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.onPrimary,
    },
    tag: {
      ...typography.caption,
      color: colors.textSecondary,
      letterSpacing: 1,
      fontWeight: '700',
    },
    tone: { color: colors.primary },
  });
