import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { spacing, type ThemeColors } from '../../theme';
import { useThemedStyles } from '../../context/ThemeContext';

interface ScreenProps {
  children: React.ReactNode;
  /** Apply default horizontal padding. */
  padded?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
}

/** Safe-area dark background container used by every screen. */
export function Screen({
  children,
  padded = false,
  edges = ['top'],
  style,
}: ScreenProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      <View style={[styles.body, padded && styles.padded, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    body: { flex: 1 },
    padded: { paddingHorizontal: spacing.lg },
  });
