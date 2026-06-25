import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { SearchBar } from '../../components/SearchBar';
import { MovieCard } from '../../components/MovieCard';
import { MovieCardSkeleton } from '../../components/ui/Skeleton';
import { BrandHeader } from '../../components/BrandHeader';
import { FilterSheet } from '../../components/FilterSheet';
import { EmptyView, ErrorView } from '../../components/ui/StateViews';
import { useMovies } from '../../hooks/useMovies';
import type { MovieFilters } from '../../api/movies';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useLanguage } from '../../context/LanguageContext';
import { colors, radius, spacing, typography } from '../../theme';
import type { Movie } from '../../types/movie';
import type { MoviesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MoviesStackParamList, 'MoviesList'>;

type Segment = 'now' | 'advance';

export function MoviesListScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<Segment>('now');
  const [filters, setFilters] = useState<MovieFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query);
  const { movies, loading, loadingMore, error, refetch, loadMore } = useMovies(
    debouncedQuery,
    filters,
  );
  const { t } = useLanguage();

  const hasActiveFilters = !!filters.year || !!filters.type;

  // Derive the displayed list: order by the selected segment.
  const displayed = useMemo(() => {
    const sorted = [...movies];
    if (segment === 'advance') {
      sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    } else {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return sorted;
  }, [movies, segment]);

  const openDetail = (movie: Movie) =>
    navigation.navigate('MovieDetail', {
      movieId: movie.id,
      title: movie.title,
      poster: movie.poster,
    });

  // The header (with the search bar) stays mounted across loading/error/data
  // states so the keyboard never loses focus while typing a search.
  const header = (
    <View style={styles.header}>
      <BrandHeader align="left" />
      <Text style={styles.heading}>{t('moviesHeading')}</Text>
      <View style={styles.searchRow}>
        <View style={styles.searchFlex}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchPlaceholder')}
          />
        </View>
        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('filters')}
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={hasActiveFilters ? colors.primary : colors.textSecondary}
          />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </Pressable>
      </View>
      <View style={styles.segments}>
        <SegmentButton
          label={t('nowShowing')}
          active={segment === 'now'}
          onPress={() => setSegment('now')}
        />
        <SegmentButton
          label={t('advanceSales')}
          active={segment === 'advance'}
          onPress={() => setSegment('advance')}
        />
        <Pressable
          onPress={() => setInfoOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={t('segmentInfo')}
          hitSlop={8}
          style={styles.infoBtn}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={infoOpen ? colors.primary : colors.textMuted}
          />
        </Pressable>
      </View>
      {infoOpen && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipRow}>
            <Text style={styles.tooltipLabel}>{t('nowShowing')}: </Text>
            {t('nowShowingDesc')}
          </Text>
          <Text style={styles.tooltipRow}>
            <Text style={styles.tooltipLabel}>{t('advanceSales')}: </Text>
            {t('advanceSalesDesc')}
          </Text>
        </View>
      )}
    </View>
  );

  // Full skeleton only on the first load; a refetch keeps showing prior results.
  const initialLoading = loading && movies.length === 0;

  let content: React.ReactNode;
  if (initialLoading) {
    content = (
      <View style={styles.skeletonGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.skeletonCol}>
            <MovieCardSkeleton />
          </View>
        ))}
      </View>
    );
  } else if (error && movies.length === 0) {
    content = <ErrorView message={t('couldNotLoadMovies')} onRetry={refetch} />;
  } else {
    content = (
      <FlatList
        data={displayed}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        renderItem={({ item }) => (
          <MovieCard movie={item} onPress={openDetail} />
        )}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footer} color={colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          <EmptyView
            icon="search-outline"
            title={t('noMoviesTitle')}
            message={
              debouncedQuery
                ? t('noMoviesNothing', { query: debouncedQuery })
                : t('noMoviesTry')
            }
          />
        }
      />
    );
  }

  return (
    <Screen padded>
      {header}
      <View style={styles.content}>{content}</View>
      <FilterSheet
        visible={filterOpen}
        filters={filters}
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
  return (
    <Pressable onPress={onPress} style={styles.segment}>
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
        {label}
      </Text>
      <View style={[styles.segmentBar, active && styles.segmentBarActive]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.sm, gap: spacing.lg, marginBottom: spacing.md },
  heading: { ...typography.h1, color: colors.text },
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
  infoBtn: { marginLeft: 'auto', padding: spacing.xs },
  tooltip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tooltipRow: { ...typography.caption, color: colors.textSecondary },
  tooltipLabel: { ...typography.bodyStrong, color: colors.text },
  segmentLabel: { ...typography.h3, color: colors.textMuted },
  segmentLabelActive: { color: colors.text },
  segmentBar: {
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
  },
  segmentBarActive: { backgroundColor: colors.primary },
  content: { flex: 1 },
  column: { gap: spacing.sm },
  listContent: { flexGrow: 1, paddingBottom: spacing.xxl },
  footer: { paddingVertical: spacing.lg },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  skeletonCol: { width: '50%' },
});
