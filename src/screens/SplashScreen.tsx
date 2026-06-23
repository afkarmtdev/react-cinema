import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors, radius, spacing, typography } from '../theme';

/** Branded loading screen shown while the persisted session is restored. */
export function SplashScreen() {
  const { t } = useLanguage();
  // Created once with a lazy initializer so it survives re-renders.
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['5%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>CINE</Text>
        </View>
        <Text style={styles.subtitle}>REACT</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width }]} />
        </View>
        <Text style={styles.loadingText}>{t('almostShowtime')}</Text>
        <Text style={styles.copyright}>
          Built with React · powered by your reactions
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl * 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logo: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    transform: [{ skewX: '-8deg' }],
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.onPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    ...typography.h3,
    color: colors.text,
    letterSpacing: 6,
    marginTop: spacing.md,
  },
  bottom: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  loadingText: { ...typography.body, color: colors.textSecondary },
  copyright: {
    ...typography.tiny,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
