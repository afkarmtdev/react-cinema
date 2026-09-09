import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect, type ReactNode } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScoreInput } from '../../components/ScoreInput';
import { StatusPicker } from '../../components/StatusPicker';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { EmptyView } from '../../components/ui/StateViews';
import { useLanguage } from '../../context/LanguageContext';
import { useLibrary } from '../../context/LibraryContext';
import { KIND_ICON, creatorKey, formatDate, kindKey } from '../../lib/labels';
import { colors, radius, spacing, typography } from '../../theme';
import type { LibraryItem } from '../../types/library';
import type { LibraryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'ItemDetail'>;

export function ItemDetailScreen({ navigation, route }: Props) {
  const { itemId } = route.params;
  const insets = useSafeAreaInsets();
  const { getItem, updateItem } = useLibrary();
  const { t } = useLanguage();
  const item = getItem(itemId);

  // Keep the header in step with edits, and expose the edit action there.
  useLayoutEffect(() => {
    navigation.setOptions({
      title: item?.title ?? '',
      headerRight: item
        ? () => (
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('edit')}
              onPress={() => navigation.navigate('ItemForm', { itemId })}
            >
              <Ionicons
                name="create-outline"
                size={24}
                color={colors.primary}
              />
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, item, itemId, t]);

  if (!item) {
    return (
      <View style={styles.missing}>
        <EmptyView icon="help-circle-outline" title={t('itemNotFound')} />
        <Button
          label={t('backToLibrary')}
          variant="outline"
          onPress={() => navigation.popToTop()}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <Hero item={item} />

      <View style={styles.body}>
        <FactsRow item={item} />

        <StatusPicker
          kind={item.kind}
          value={item.status}
          onChange={(status) => updateItem(item.id, { status })}
        />

        {item.tags.length > 0 && (
          <View style={styles.tags}>
            {item.tags.map((tag) => (
              <Chip key={tag} label={tag} icon="pricetag-outline" />
            ))}
          </View>
        )}

        <Section title={t('about')}>
          <Text style={item.description ? styles.paragraph : styles.muted}>
            {item.description || t('noDescription')}
          </Text>
        </Section>

        <Section title={t('yourRating')}>
          <ScoreInput
            value={item.rating ?? 0}
            onChange={(rating) => updateItem(item.id, { rating })}
          />
          {item.review ? (
            <Text style={styles.paragraph}>{item.review}</Text>
          ) : !item.rating ? (
            <Text style={styles.muted}>{t('noRating')}</Text>
          ) : null}
          <Text style={styles.dates}>
            {item.finishedAt
              ? t('finishedOn', { date: formatDate(item.finishedAt) })
              : t('addedOn', { date: formatDate(item.createdAt) })}
          </Text>
        </Section>
      </View>
    </ScrollView>
  );
}

function Hero({ item }: { item: LibraryItem }) {
  return (
    <View style={styles.hero}>
      {item.poster ? (
        <Image
          source={{ uri: item.poster }}
          style={styles.heroImage}
          blurRadius={6}
        />
      ) : null}
      <View style={styles.heroOverlay} />
      <View style={styles.heroContent}>
        <View style={styles.posterCard}>
          {item.poster ? (
            <Image source={{ uri: item.poster }} style={styles.poster} />
          ) : (
            <View style={[styles.poster, styles.posterFallback]}>
              <Ionicons
                name={KIND_ICON[item.kind]}
                size={40}
                color={colors.textMuted}
              />
            </View>
          )}
        </View>
        <Text style={styles.title}>{item.title}</Text>
        {!!item.creator && <Text style={styles.creator}>{item.creator}</Text>}
      </View>
    </View>
  );
}

function FactsRow({ item }: { item: LibraryItem }) {
  const { t } = useLanguage();
  const facts: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { icon: KIND_ICON[item.kind], label: t(kindKey(item.kind)) },
  ];
  if (item.year) {
    facts.push({ icon: 'calendar-outline', label: String(item.year) });
  }
  if (item.creator) {
    facts.push({
      icon: 'person-outline',
      label: `${t(creatorKey(item.kind))}: ${item.creator}`,
    });
  }

  return (
    <View style={styles.facts}>
      {facts.map((fact) => (
        <View key={fact.label} style={styles.fact}>
          <Ionicons name={fact.icon} size={14} color={colors.primary} />
          <Text style={styles.factText}>{fact.label}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({
  title,
  accessory,
  children,
}: {
  title: string;
  accessory?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {accessory}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  missing: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  hero: { height: 360, justifyContent: 'flex-end' },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    opacity: 0.55,
  },
  heroContent: { alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  posterCard: {
    width: 130,
    aspectRatio: 2 / 3,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  poster: { width: '100%', height: '100%' },
  posterFallback: { alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h1, color: colors.text, textAlign: 'center' },
  creator: { ...typography.caption, color: colors.textSecondary },
  body: { padding: spacing.lg, gap: spacing.xl },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  factText: { ...typography.caption, color: colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  section: { gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.h2, color: colors.text },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  muted: { ...typography.body, color: colors.textMuted },
  dates: { ...typography.tiny, color: colors.textMuted },
});
