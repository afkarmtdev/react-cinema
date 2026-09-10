import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import {
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFloatingTabBarInset } from '../components/FloatingTabBar';
import { Screen } from '../components/ui/Screen';
import { EmptyView } from '../components/ui/StateViews';
import { ScoreBadge } from '../components/ui/ScoreBadge';
import { useLanguage } from '../context/LanguageContext';
import { useLibrary } from '../context/LibraryContext';
import { KIND_ICON, formatMonth } from '../lib/labels';
import { formatScore } from '../lib/score';
import {
  monthRange,
  summarise,
  yearRange,
  type PeriodSummary,
} from '../lib/summary';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import { ITEM_KINDS, type LibraryItem } from '../types/library';
import type { TabParamList } from '../navigation/types';
import { useThemedStyles, useTheme } from '../context/ThemeContext';

type Props = BottomTabScreenProps<TabParamList, 'DiaryTab'>;

interface MonthSection {
  title: string;
  data: LibraryItem[];
}

/** Everything finished, newest first, grouped by the month it was finished. */
export function DiaryScreen({ navigation }: Props) {
  const styles = useThemedStyles(makeStyles);
  const tabBar = useFloatingTabBarInset();
  const { items } = useLibrary();
  const { t } = useLanguage();

  const sections = useMemo<MonthSection[]>(() => {
    const done = items
      .filter((item) => item.status === 'done')
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
    const out: MonthSection[] = [];
    for (const item of done) {
      const title = formatMonth(item.finishedAt ?? item.updatedAt);
      const last = out[out.length - 1];
      if (last && last.title === title) last.data.push(item);
      else out.push({ title, data: [item] });
    }
    return out;
  }, [items]);

  // What got finished this month and this year, for the two cards on top.
  const summary = useMemo(() => {
    const now = new Date();
    return {
      month: summarise(items, monthRange(now)),
      year: summarise(items, yearRange(now)),
    };
  }, [items]);

  const open = (item: LibraryItem) =>
    navigation.navigate('LibraryTab', {
      screen: 'ItemDetail',
      params: { itemId: item.id, title: item.title },
      initial: false,
    });

  return (
    <Screen padded>
      <Text style={styles.heading}>{t('diaryHeading')}</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBar.clearance },
        ]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          sections.length > 0 ? (
            <View style={styles.summary}>
              <SummaryCard title={t('thisMonth')} summary={summary.month} />
              <SummaryCard title={t('thisYear')} summary={summary.year} />
            </View>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.month}>{section.title}</Text>
        )}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        renderItem={({ item }) => <DiaryRow item={item} onPress={open} />}
        ListEmptyComponent={
          <EmptyView
            icon="calendar-outline"
            title={t('diaryEmptyTitle')}
            message={t('diaryEmptyMessage')}
          />
        }
      />
    </Screen>
  );
}

/** One card: total finished, then the count per kind and the average score. */
function SummaryCard({
  title,
  summary,
}: {
  title: string;
  summary: PeriodSummary;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const avg = summary.avgScore ? formatScore(summary.avgScore) : '-';
  return (
    <View
      style={styles.card}
      accessibilityLabel={`${title}: ${summary.total} ${t('finishedStat')}`}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardTotalRow}>
        <Text style={styles.cardTotal}>{summary.total}</Text>
        <Text style={styles.cardTotalLabel}>{t('finishedStat')}</Text>
      </View>
      <View style={styles.cardFacts}>
        {ITEM_KINDS.map((kind) => (
          <View key={kind} style={styles.cardFact}>
            <Ionicons
              name={KIND_ICON[kind]}
              size={13}
              color={colors.textSecondary}
            />
            <Text style={styles.cardFactText}>{summary.counts[kind]}</Text>
          </View>
        ))}
        <View style={styles.cardFact}>
          <Ionicons name="star" size={13} color={colors.star} />
          <Text style={styles.cardFactText}>{avg}</Text>
        </View>
      </View>
    </View>
  );
}

function DiaryRow({
  item,
  onPress,
}: {
  item: LibraryItem;
  onPress: (item: LibraryItem) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const day = new Date(item.finishedAt ?? item.updatedAt).getDate();
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={styles.day}>{day}</Text>
      {item.poster ? (
        <Image source={{ uri: item.poster }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Ionicons
            name={KIND_ICON[item.kind]}
            size={22}
            color={colors.textMuted}
          />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Ionicons
            name={KIND_ICON[item.kind]}
            size={13}
            color={colors.textMuted}
          />
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        {!!item.creator && (
          <Text style={styles.meta} numberOfLines={1}>
            {item.creator}
          </Text>
        )}
        {!!item.rating && <ScoreBadge value={item.rating} />}
        {!!item.review && (
          <Text style={styles.snippet} numberOfLines={2}>
            {item.review}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    heading: {
      ...typography.h1,
      color: colors.text,
      paddingVertical: spacing.lg,
    },
    content: { flexGrow: 1 },
    summary: { flexDirection: 'row', gap: spacing.sm },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.xs,
    },
    cardTitle: {
      ...typography.tiny,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    cardTotalRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
    },
    cardTotal: {
      ...typography.h1,
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    cardTotalLabel: { ...typography.caption, color: colors.textSecondary },
    cardFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    cardFact: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    cardFactText: {
      ...typography.tiny,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    month: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    gap: { height: spacing.md },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    pressed: { opacity: 0.8 },
    day: {
      ...typography.h2,
      color: colors.primary,
      width: 32,
      textAlign: 'center',
    },
    thumb: {
      width: 52,
      height: 78,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
    },
    thumbFallback: { alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, gap: 4 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { ...typography.bodyStrong, color: colors.text, flex: 1 },
    meta: { ...typography.caption, color: colors.textSecondary },
    snippet: { ...typography.caption, color: colors.textSecondary },
  });
