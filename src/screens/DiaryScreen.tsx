import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { MoodMarks } from '../components/MoodPicker';
import { Screen } from '../components/ui/Screen';
import { EmptyView } from '../components/ui/StateViews';
import { ScoreBadge } from '../components/ui/ScoreBadge';
import { useLanguage } from '../context/LanguageContext';
import { useLibrary } from '../context/LibraryContext';
import {
  KIND_ICON,
  formatDay,
  formatMonth,
  formatPages,
  formatRuntime,
  repeatKey,
} from '../lib/labels';
import { formatScore } from '../lib/score';
import {
  finishDates,
  monthRange,
  summarise,
  yearRange,
  type PeriodSummary,
} from '../lib/summary';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import { ITEM_KINDS, type LibraryItem } from '../types/library';
import type { DiaryStackParamList } from '../navigation/types';
import { useThemedStyles, useTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<DiaryStackParamList, 'Diary'>;

/** One line of the diary: an entry and one of the times it was finished. */
interface DiaryEntry {
  key: string;
  item: LibraryItem;
  at: number;
  /** A rewatch or reread rather than the first time. */
  repeat: boolean;
}

interface MonthSection {
  title: string;
  data: DiaryEntry[];
}

/**
 * Everything finished, newest first, grouped by the month it was finished.
 * A rewatch or reread is a line of its own, in the month it happened.
 */
export function DiaryScreen({ navigation }: Props) {
  const styles = useThemedStyles(makeStyles);
  const tabBar = useFloatingTabBarInset();
  const { items } = useLibrary();
  const { t } = useLanguage();

  const sections = useMemo<MonthSection[]>(() => {
    const entries: DiaryEntry[] = [];
    for (const item of items) {
      if (item.status !== 'done') continue;
      // Done without a date (an old record) still shows, on its last edit.
      const dates =
        item.finishedAt === undefined ? [item.updatedAt] : finishDates(item);
      dates.forEach((at, i) =>
        entries.push({ key: `${item.id}:${i}`, item, at, repeat: i > 0 }),
      );
    }
    entries.sort((a, b) => b.at - a.at);
    const out: MonthSection[] = [];
    for (const entry of entries) {
      const title = formatMonth(entry.at);
      const last = out[out.length - 1];
      if (last && last.title === title) last.data.push(entry);
      else out.push({ title, data: [entry] });
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
    navigation.navigate('ItemDetail', { itemId: item.id, title: item.title });

  return (
    <Screen padded>
      <Text style={styles.heading}>{t('diaryHeading')}</Text>
      <SectionList
        sections={sections}
        keyExtractor={(entry) => entry.key}
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
        renderItem={({ item }) => <DiaryRow entry={item} onPress={open} />}
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

/**
 * One card: total finished, then the count per kind and the average score,
 * then the hours watched and pages read when the entries have them.
 */
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
  const time = formatRuntime(summary.minutes, t);
  const label = [
    `${title}: ${summary.total} ${t('finishedStat')}`,
    summary.minutes > 0 ? t('timeWatched', { time }) : '',
    summary.pages > 0 ? t('pagesRead', { count: summary.pages }) : '',
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <View style={styles.card} accessibilityLabel={label}>
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
      {(summary.minutes > 0 || summary.pages > 0) && (
        <View style={styles.cardFacts}>
          {summary.minutes > 0 && (
            <View style={styles.cardFact}>
              <Ionicons
                name="time-outline"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={styles.cardFactText}>{time}</Text>
            </View>
          )}
          {summary.pages > 0 && (
            <View style={styles.cardFact}>
              <Ionicons
                name="document-text-outline"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={styles.cardFactText}>
                {formatPages(summary.pages, t)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function DiaryRow({
  entry,
  onPress,
}: {
  entry: DiaryEntry;
  onPress: (item: LibraryItem) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { item, repeat } = entry;
  const date = formatDay(entry.at);
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
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
        <View style={styles.facts}>
          {!!item.rating && <ScoreBadge value={item.rating} />}
          <View style={styles.when}>
            <Ionicons
              name={repeat ? 'repeat' : 'calendar-outline'}
              size={12}
              color={repeat ? colors.primary : colors.textMuted}
            />
            <Text style={styles.whenText}>
              {repeat
                ? t(repeatKey(item.kind, 'On'), { date })
                : t('finishedOn', { date })}
            </Text>
          </View>
          <MoodMarks moods={item.moods ?? []} />
        </View>
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
    facts: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    when: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    whenText: { ...typography.tiny, color: colors.textMuted },
    snippet: { ...typography.caption, color: colors.textSecondary },
  });
