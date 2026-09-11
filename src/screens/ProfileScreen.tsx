import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EditProfileSheet } from '../components/EditProfileSheet';
import { useFloatingTabBarInset } from '../components/FloatingTabBar';
import { Screen } from '../components/ui/Screen';
import { Button } from '../components/ui/Button';
import { StorageSettings } from '../components/StorageSettings';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { useLanguage } from '../context/LanguageContext';
import { MAX_FAVOURITES } from '../lib/favourites';
import { KIND_ICON } from '../lib/labels';
import { formatScore } from '../lib/score';
import {
  THEME_NAMES,
  radius,
  spacing,
  themes,
  typography,
  type ThemeColors,
  type ThemeName,
} from '../theme';
import type { ItemKind, LibraryItem } from '../types/library';
import type { TabParamList } from '../navigation/types';
import { useThemedStyles, useTheme } from '../context/ThemeContext';

type Props = BottomTabScreenProps<TabParamList, 'ProfileTab'>;

export function ProfileScreen({ navigation }: Props) {
  const styles = useThemedStyles(makeStyles);
  const tabBar = useFloatingTabBarInset();
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { items, getItem } = useLibrary();
  const { t, language, setLanguage } = useLanguage();
  const { name: themeName, setTheme } = useTheme();
  const [editing, setEditing] = useState(false);

  const stats = useMemo(() => {
    const done = items.filter((item) => item.status === 'done');
    const rated = items.filter((item) => typeof item.rating === 'number');
    const count = (kind: ItemKind) =>
      String(done.filter((item) => item.kind === kind).length);
    const avg =
      rated.length === 0
        ? 'N/A'
        : formatScore(
            rated.reduce((acc, item) => acc + (item.rating ?? 0), 0) /
              rated.length,
          );
    return {
      films: count('film'),
      series: count('series'),
      books: count('book'),
      avg,
    };
  }, [items]);

  // The shelf, skipping ids whose entry has since been deleted.
  const shelf = useMemo(
    () =>
      (user?.favourites ?? [])
        .map((id) => getItem(id))
        .filter((item): item is LibraryItem => !!item),
    [user?.favourites, getItem],
  );

  if (!user) return null;

  const openItem = (item: LibraryItem) =>
    navigation.navigate('LibraryTab', {
      screen: 'ItemDetail',
      params: { itemId: item.id, title: item.title },
      initial: false,
    });

  return (
    <Screen padded>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBar.clearance },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>{t('meHeading')}</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Pressable
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editText}>{t('editProfile')}</Text>
          </Pressable>
        </View>

        <View style={styles.stats}>
          <Stat
            icon={KIND_ICON.film}
            value={stats.films}
            label={t('filmsWatched')}
          />
          <Stat
            icon={KIND_ICON.series}
            value={stats.series}
            label={t('seriesWatched')}
          />
          <Stat
            icon={KIND_ICON.book}
            value={stats.books}
            label={t('booksRead')}
          />
          <Stat icon="star" value={stats.avg} label={t('avgRating')} />
        </View>

        <Text style={styles.settingsHeading}>{t('favourites')}</Text>
        <View style={styles.shelf}>
          {Array.from({ length: MAX_FAVOURITES }, (_, i) => {
            const item = shelf[i];
            return item ? (
              <ShelfSlot key={item.id} item={item} onPress={openItem} />
            ) : (
              <View key={`empty-${i}`} style={[styles.slot, styles.slotEmpty]}>
                <Ionicons
                  name="heart-outline"
                  size={20}
                  color={colors.textMuted}
                />
              </View>
            );
          })}
        </View>
        {shelf.length === 0 && (
          <Text style={styles.hint}>{t('favouritesHint')}</Text>
        )}

        <Text style={styles.settingsHeading}>{t('settings')}</Text>

        <View style={styles.languageBlock}>
          <Text style={styles.languageLabel}>{t('appearance')}</Text>
          <View style={styles.themeRow}>
            {THEME_NAMES.map((name) => (
              <ThemeOption
                key={name}
                name={name}
                label={t(themeKey(name))}
                active={themeName === name}
                onPress={() => setTheme(name)}
              />
            ))}
          </View>
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

        <Text style={styles.groupHeading}>{t('advanced')}</Text>

        <View style={styles.storageBlock}>
          <Text style={styles.languageLabel}>{t('storage')}</Text>
          <StorageSettings />
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
      </ScrollView>

      <EditProfileSheet visible={editing} onClose={() => setEditing(false)} />
    </Screen>
  );
}

/** One cover on the top four shelf. */
function ShelfSlot({
  item,
  onPress,
}: {
  item: LibraryItem;
  onPress: (item: LibraryItem) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
    >
      {item.poster ? (
        <Image source={{ uri: item.poster }} style={styles.slotImage} />
      ) : (
        <View style={styles.slotFallback}>
          <Ionicons
            name={KIND_ICON[item.kind]}
            size={20}
            color={colors.textMuted}
          />
          <Text style={styles.slotTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** Translation key for a theme's display name ("themeCinema"). */
const themeKey = (name: ThemeName): string =>
  `theme${name.charAt(0).toUpperCase()}${name.slice(1)}`;

/** A theme choice: a two-colour swatch (background and accent) plus a name. */
function ThemeOption({
  name,
  label,
  active,
  onPress,
}: {
  name: ThemeName;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const palette = themes[name];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.langOption,
        styles.themeOption,
        active && styles.langOptionActive,
      ]}
    >
      <View style={[styles.swatch, { backgroundColor: palette.background }]}>
        <View
          style={[styles.swatchDot, { backgroundColor: palette.primary }]}
        />
      </View>
      <Text style={[styles.langText, active && styles.langTextActive]}>
        {label}
      </Text>
    </Pressable>
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
  const styles = useThemedStyles(makeStyles);
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
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      overflow: 'hidden',
    },
    avatarImage: { width: 80, height: 80 },
    avatarText: { fontSize: 34, fontWeight: '800', color: colors.onPrimary },
    name: { ...typography.h2, color: colors.text },
    email: { ...typography.body, color: colors.textSecondary },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    editText: { ...typography.caption, color: colors.primary },
    pressed: { opacity: 0.7 },
    stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
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
    content: { flexGrow: 1 },
    shelf: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    slot: {
      flex: 1,
      aspectRatio: 2 / 3,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    slotEmpty: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    slotImage: { width: '100%', height: '100%' },
    slotFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      padding: spacing.sm,
    },
    slotTitle: {
      ...typography.tiny,
      color: colors.textMuted,
      textAlign: 'center',
    },
    hint: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.sm,
      marginLeft: spacing.xs,
    },
    settingsHeading: {
      ...typography.h2,
      color: colors.text,
      marginTop: spacing.xxl,
    },
    languageBlock: { marginTop: spacing.lg, gap: spacing.sm },
    themeRow: { flexDirection: 'row', gap: spacing.sm },
    themeOption: { gap: spacing.sm, paddingVertical: spacing.sm },
    swatch: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchDot: { width: 18, height: 18, borderRadius: radius.pill },
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
    groupHeading: {
      ...typography.h3,
      color: colors.text,
      marginTop: spacing.xxl,
    },
    storageBlock: { marginTop: spacing.lg, gap: spacing.sm },
    spacer: { flex: 1, minHeight: spacing.xl },
  });
