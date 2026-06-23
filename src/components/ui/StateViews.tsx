import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from './Button';

export function Loading({ message }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {!!message && <Text style={styles.caption}>{message}</Text>}
    </View>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <View style={styles.center}>
      <Ionicons
        name="cloud-offline-outline"
        size={48}
        color={colors.textMuted}
      />
      <Text style={styles.title}>{t('somethingWrong')}</Text>
      <Text style={styles.caption}>{message}</Text>
      {onRetry && (
        <Button
          label={t('tryAgain')}
          variant="outline"
          onPress={onRetry}
          style={styles.retry}
        />
      )}
    </View>
  );
}

export function EmptyView({
  icon = 'film-outline',
  title,
  message,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={48} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.caption}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retry: { marginTop: spacing.md, paddingHorizontal: spacing.xxl },
});
