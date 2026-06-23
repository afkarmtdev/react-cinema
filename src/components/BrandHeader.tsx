import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface BrandHeaderProps {
  /** Optional content rendered on the right (e.g. a coins badge). */
  right?: React.ReactNode;
  align?: 'center' | 'left';
  style?: ViewStyle;
}

/** The CineReact wordmark: a skewed yellow "CINE" tile with a "REACT" tag. */
export function BrandHeader({
  right,
  align = 'center',
  style,
}: BrandHeaderProps) {
  return (
    <View
      style={[
        styles.row,
        align === 'center' ? styles.center : styles.left,
        style,
      ]}
    >
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>CINE</Text>
        </View>
        <Text style={styles.tag}>REACT</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontStyle: 'italic',
    color: colors.onPrimary,
  },
  tag: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 3,
    fontWeight: '700',
  },
});
