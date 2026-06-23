import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Loading, ErrorView } from '../../components/ui/StateViews';
import { ReviewComposer } from '../../components/ReviewComposer';
import { ReviewItem } from '../../components/ReviewItem';
import { StarRating } from '../../components/ui/StarRating';
import { useMovieDetail } from '../../hooks/useMovieDetail';
import { useReviews } from '../../context/ReviewsContext';
import { useLanguage } from '../../context/LanguageContext';
import { colors, radius, spacing, typography } from '../../theme';
import type { Movie } from '../../types/movie';
import type { MoviesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MoviesStackParamList, 'MovieDetail'>;

export function MovieDetailScreen({ route }: Props) {
  const { movieId } = route.params;
  const insets = useSafeAreaInsets();
  const { movie, loading, error, refetch } = useMovieDetail(movieId);
  const { getMovieReviews, getMyReview, saveReview, removeReview } =
    useReviews();
  const { t } = useLanguage();

  const reviews = getMovieReviews(movieId);
  const myReview = getMyReview(movieId);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }, [reviews]);

  if (loading) return <Loading message={t('loadingMovie')} />;
  if (error || !movie) {
    return (
      <ErrorView
        message={error ? t('couldNotLoadMovie') : t('movieNotFound')}
        onRetry={refetch}
      />
    );
  }

  const handleSubmit = (rating: number, text: string) =>
    saveReview({
      movieId: movie.id,
      movieTitle: movie.title,
      moviePoster: movie.poster,
      rating,
      text,
    });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <Hero movie={movie} />

      <View style={styles.body}>
        <FactsRow movie={movie} />

        {!!movie.plot && (
          <Section title={t('synopsis')}>
            <Text style={styles.paragraph}>{movie.plot}</Text>
          </Section>
        )}

        {!!movie.actors?.length && (
          <Section title={t('cast')}>
            <Text style={styles.paragraph}>{movie.actors.join(', ')}</Text>
          </Section>
        )}

        <Section
          title={`${t('reviewsTitle')}${reviews.length ? ` (${reviews.length})` : ''}`}
          accessory={
            averageRating != null ? (
              <View style={styles.avgRow}>
                <StarRating value={averageRating} size={15} />
                <Text style={styles.avgText}>{averageRating.toFixed(1)}</Text>
              </View>
            ) : undefined
          }
        >
          <ReviewComposer existing={myReview} onSubmit={handleSubmit} />

          <View style={styles.reviewList}>
            {reviews.length === 0 ? (
              <Text style={styles.muted}>{t('noReviews')}</Text>
            ) : (
              reviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  onDelete={
                    review.id === myReview?.id
                      ? () => removeReview(review.id)
                      : undefined
                  }
                />
              ))
            )}
          </View>
        </Section>
      </View>
    </ScrollView>
  );
}

function Hero({ movie }: { movie: Movie }) {
  return (
    <View style={styles.hero}>
      {movie.poster ? (
        <Image
          source={{ uri: movie.poster }}
          style={styles.heroImage}
          blurRadius={6}
        />
      ) : null}
      <View style={styles.heroOverlay} />
      <View style={styles.heroContent}>
        <View style={styles.posterCard}>
          {movie.poster ? (
            <Image source={{ uri: movie.poster }} style={styles.poster} />
          ) : (
            <View style={[styles.poster, styles.posterFallback]}>
              <Ionicons
                name="film-outline"
                size={40}
                color={colors.textMuted}
              />
            </View>
          )}
        </View>
        <Text style={styles.title}>{movie.title}</Text>
        {!!movie.genre?.length && (
          <Text style={styles.genres}>{movie.genre.join(' · ')}</Text>
        )}
      </View>
    </View>
  );
}

function FactsRow({ movie }: { movie: Movie }) {
  const facts: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [];
  if (movie.year)
    facts.push({ icon: 'calendar-outline', label: String(movie.year) });
  if (movie.runtime)
    facts.push({ icon: 'time-outline', label: `${movie.runtime} min` });
  if (typeof movie.rating === 'number')
    facts.push({ icon: 'star', label: `${movie.rating.toFixed(1)} IMDb` });
  if (movie.director)
    facts.push({ icon: 'videocam-outline', label: movie.director });

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
  accessory?: React.ReactNode;
  children: React.ReactNode;
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
  genres: { ...typography.caption, color: colors.textSecondary },
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
  section: { gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.h2, color: colors.text },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avgText: { ...typography.bodyStrong, color: colors.star },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  reviewList: { gap: spacing.md, marginTop: spacing.sm },
  muted: { ...typography.body, color: colors.textMuted },
});
