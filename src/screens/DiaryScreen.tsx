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
import { Screen } from '../components/ui/Screen';
import { EmptyView } from '../components/ui/StateViews';
import { ScoreBadge } from '../components/ui/ScoreBadge';
import { useLanguage } from '../context/LanguageContext';
import { useLibrary } from '../context/LibraryContext';
import { KIND_ICON, formatMonth } from '../lib/labels';
import { colors, radius, spacing, typography } from '../theme';
import type { LibraryItem } from '../types/library';
import type { TabParamList } from '../navigation/types';

type Props = BottomTabScreenProps<TabParamList, 'DiaryTab'>;

interface MonthSection {
  title: string;
  data: LibraryItem[];
}

/** Everything finished, newest first, grouped by the month it was finished. */
export function DiaryScreen({ navigation }: Props) {
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
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

function DiaryRow({
  item,
  onPress,
}: {
  item: LibraryItem;
  onPress: (item: LibraryItem) => void;
}) {
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

const styles = StyleSheet.create({
  heading: {
    ...typography.h1,
    color: colors.text,
    paddingVertical: spacing.lg,
  },
  content: { flexGrow: 1, paddingBottom: spacing.xxl },
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
