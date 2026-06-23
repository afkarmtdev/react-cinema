import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';

/** A single pulsing placeholder block. */
export function Skeleton({ style }: { style?: ViewStyle }) {
  // Created once with a lazy initializer so it survives re-renders.
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, { opacity }, style]} />;
}

/** Skeleton matching the poster-grid card while movies load. */
export function MovieCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton style={styles.poster} />
      <Skeleton style={styles.lineWide} />
      <Skeleton style={styles.lineNarrow} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.skeleton, borderRadius: radius.sm },
  card: { flex: 1, margin: spacing.sm, gap: spacing.sm },
  poster: { width: '100%', aspectRatio: 2 / 3, borderRadius: radius.md },
  lineWide: { height: 12, width: '85%' },
  lineNarrow: { height: 10, width: '55%' },
});
