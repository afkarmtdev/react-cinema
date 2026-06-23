import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/ui/Screen';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useReviews } from '../context/ReviewsContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, radius, spacing, typography } from '../theme';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { myReviews } = useReviews();
  const { t, language, setLanguage } = useLanguage();

  const averageGiven = useMemo(() => {
    if (myReviews.length === 0) return 'N/A';
    const sum = myReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / myReviews.length).toFixed(1);
  }, [myReviews]);

  if (!user) return null;

  return (
    <Screen padded>
      <Text style={styles.heading}>{t('meHeading')}</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.stats}>
        <Stat
          icon="albums-outline"
          value={String(myReviews.length)}
          label={t('reviewsStat')}
        />
        <Stat icon="star" value={averageGiven} label={t('avgRating')} />
      </View>

      <View style={styles.languageBlock}>
        <Text style={styles.languageLabel}>{t('language')}</Text>
        <View style={styles.languageRow}>
          <LanguageOption
            label="English"
            active={language === 'en'}
            onPress={() => setLanguage('en')}
          />
          <LanguageOption
            label="Bahasa Melayu"
            active={language === 'ms'}
            onPress={() => setLanguage('ms')}
          />
        </View>
      </View>

      <View style={styles.spacer} />

      <Button
        label={t('logout')}
        variant="outline"
        onPress={logout}
        icon={
          <Ionicons name="log-out-outline" size={20} color={colors.primary} />
        }
      />
    </Screen>
  );
}

function LanguageOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.langOption, active && styles.langOptionActive]}
    >
      <Text style={[styles.langText, active && styles.langTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.h1,
    color: colors.text,
    paddingVertical: spacing.lg,
  },
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 34, fontWeight: '800', color: colors.onPrimary },
  name: { ...typography.h2, color: colors.text },
  email: { ...typography.body, color: colors.textSecondary },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  statValue: { ...typography.h2, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  languageBlock: { marginTop: spacing.xl, gap: spacing.sm },
  languageLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  languageRow: { flexDirection: 'row', gap: spacing.md },
  langOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  langOptionActive: { borderColor: colors.primary },
  langText: { ...typography.bodyStrong, color: colors.textSecondary },
  langTextActive: { color: colors.primary },
  spacer: { flex: 1 },
});
