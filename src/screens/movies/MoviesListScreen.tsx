import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { SearchBar } from '../../components/SearchBar';
import { MovieCard } from '../../components/MovieCard';
import { MovieCardSkeleton } from '../../components/ui/Skeleton';
import { BrandHeader } from '../../components/BrandHeader';
import { EmptyView, ErrorView } from '../../components/ui/StateViews';
import { useMovies } from '../../hooks/useMovies';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useLanguage } from '../../context/LanguageContext';
import { colors, radius, spacing, typography } from '../../theme';
import type { Movie } from '../../types/movie';
import type { MoviesStackParamList } from '../../navigation/types';

// Enable smooth list re-layout on Android.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MAX_ITEMS = 20; // Optional requirement: cap the list at 20 items.

type Props = NativeStackScreenProps<MoviesStackParamList, 'MoviesList'>;

type Segment = 'now' | 'advance';

export function MoviesListScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<Segment>('now');
  const debouncedQuery = useDebouncedValue(query);
  const { movies, loading, error, refetch } = useMovies(debouncedQuery);
  const { t } = useLanguage();

  // Derive the displayed list: order by segment, then cap to 20.
  const displayed = useMemo(() => {
    const sorted = [...movies];
    if (segment === 'advance') {
      sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    } else {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return sorted.slice(0, MAX_ITEMS);
  }, [movies, segment]);

  // Animate whenever the rendered set changes (search / segment switch).
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [displayed]);

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
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('searchPlaceholder')}
      />
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
      </View>
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
  segments: { flexDirection: 'row', gap: spacing.xl },
  segment: { gap: spacing.sm },
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
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  skeletonCol: { width: '50%' },
});
