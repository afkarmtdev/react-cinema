import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandHeader } from '../../components/BrandHeader';
import { useFloatingTabBarInset } from '../../components/FloatingTabBar';
import {
  EMPTY_FILTERS,
  FilterSheet,
  hasActiveFilters,
  type LibraryFilters,
} from '../../components/FilterSheet';
import { ItemCard } from '../../components/ItemCard';
import { SearchBar } from '../../components/SearchBar';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { EmptyView, ErrorView, Loading } from '../../components/ui/StateViews';
import { useLanguage } from '../../context/LanguageContext';
import { useLibrary } from '../../context/LibraryContext';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { hasTag } from '../../lib/tags';
import { radius, spacing, typography, type ThemeColors } from '../../theme';
import {
  ITEM_KINDS,
  type ItemKind,
  type LibraryItem,
} from '../../types/library';
import type { LibraryStackParamList } from '../../navigation/types';
import { useThemedStyles, useTheme } from '../../context/ThemeContext';

type Props = NativeStackScreenProps<LibraryStackParamList, 'Library'>;

type KindFilter = ItemKind | 'all';

const KIND_LABEL: Record<KindFilter, string> = {
  all: 'kindsAll',
  film: 'kindsFilm',
  series: 'kindsSeries',
  book: 'kindsBook',
};

export function LibraryScreen({ navigation }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { items, allTags, ready, loadError, reload } = useLibrary();
  const { t } = useLanguage();
  const tabBar = useFloatingTabBarInset();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query);

  const filtered = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (kind !== 'all' && item.kind !== kind) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.tags.some((tag) => !hasTag(item.tags, tag))) return false;
      if (!term) return true;
      const haystack = [
        item.title,
        item.creator ?? '',
        item.year ? String(item.year) : '',
        ...item.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [items, kind, filters, debouncedQuery]);

  const openDetail = (item: LibraryItem) =>
    navigation.navigate('ItemDetail', { itemId: item.id, title: item.title });

  const openAdd = () =>
    navigation.navigate('ItemForm', {
      kind: kind === 'all' ? undefined : kind,
    });

  const isSearching = !!debouncedQuery.trim() || hasActiveFilters(filters);
  const filtersOn = hasActiveFilters(filters);

  const header = (
    <View style={styles.header}>
      <BrandHeader align="left" />
      <View style={styles.headingRow}>
        <Text style={styles.heading}>{t('libraryHeading')}</Text>
        <Text style={styles.count}>
          {items.length === 1
            ? t('entryCountOne')
            : t('entryCount', { count: items.length })}
        </Text>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchFlex}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchLibrary')}
          />
        </View>
        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('filters')}
          style={[styles.filterBtn, filtersOn && styles.filterBtnActive]}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={filtersOn ? colors.primary : colors.textSecondary}
          />
          {filtersOn && <View style={styles.filterDot} />}
        </Pressable>
      </View>
      <View style={styles.segments}>
        {(['all', ...ITEM_KINDS] as KindFilter[]).map((k) => (
          <SegmentButton
            key={k}
            label={t(KIND_LABEL[k])}
            active={kind === k}
            onPress={() => setKind(k)}
          />
        ))}
      </View>
    </View>
  );

  let content: ReactNode;
  if (!ready) {
    content = <Loading message={t('loadingLibrary')} />;
  } else if (loadError) {
    content = <ErrorView message={t('libraryLoadError')} onRetry={reload} />;
  } else {
    content = (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <ItemCard item={item} onPress={openDetail} />}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBar.clearance + 60 + spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          items.length === 0 ? (
            <View style={styles.empty}>
              <EmptyView
                icon="albums-outline"
                title={t('emptyLibraryTitle')}
                message={t('emptyLibraryMessage')}
              />
              <Button
                label={t('add')}
                onPress={openAdd}
                style={styles.emptyBtn}
              />
            </View>
          ) : (
            <EmptyView
              icon="search-outline"
              title={t('noMatchesTitle')}
              message={isSearching ? t('noMatchesMessage') : undefined}
            />
          )
        }
      />
    );
  }

  return (
    <Screen padded>
      {header}
      {content}

      <Pressable
        onPress={openAdd}
        accessibilityRole="button"
        accessibilityLabel={t('add')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: tabBar.top + spacing.md },
          pressed && styles.fabPressed,
        ]}
      >
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </Pressable>

      <FilterSheet
        visible={filterOpen}
        filters={filters}
        availableTags={allTags}
        onApply={(next) => {
          setFilters(next);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />
    </Screen>
  );
}

function SegmentButton({
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
    <Pressable onPress={onPress} style={styles.segment}>
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
        {label}
      </Text>
      <View style={[styles.segmentBar, active && styles.segmentBarActive]} />
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      paddingTop: spacing.sm,
      gap: spacing.lg,
      marginBottom: spacing.md,
    },
    headingRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    heading: { ...typography.h1, color: colors.text },
    count: { ...typography.caption, color: colors.textMuted },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    searchFlex: { flex: 1 },
    filterBtn: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBtnActive: { borderColor: colors.primary },
    filterDot: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    segments: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
    segment: { gap: spacing.sm },
    segmentLabel: { ...typography.h3, color: colors.textMuted },
    segmentLabelActive: { color: colors.text },
    segmentBar: {
      height: 3,
      borderRadius: radius.pill,
      backgroundColor: 'transparent',
    },
    segmentBarActive: { backgroundColor: colors.primary },
    column: { gap: spacing.sm },
    listContent: { flexGrow: 1 },
    empty: { flex: 1, alignItems: 'center', paddingBottom: spacing.xxl },
    emptyBtn: { paddingHorizontal: spacing.xxl },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      width: 60,
      height: 60,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    fabPressed: { backgroundColor: colors.primaryPressed },
  });
