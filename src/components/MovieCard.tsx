import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors, radius, spacing, typography } from '../theme';
import type { Movie } from '../types/movie';

interface MovieCardProps {
  movie: Movie;
  onPress: (movie: Movie) => void;
}

/** Poster-first grid card matching the GSC "Now Showing" layout. */
function MovieCardBase({ movie, onPress }: MovieCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const { t } = useLanguage();
  const showImage = !!movie.poster && !imageFailed;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${movie.title}${movie.year ? `, ${movie.year}` : ''}`}
      onPress={() => onPress(movie)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.posterWrap}>
        {showImage ? (
          <Image
            source={{ uri: movie.poster }}
            style={styles.poster}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.poster, styles.posterFallback]}>
            <Ionicons name="film-outline" size={32} color={colors.textMuted} />
          </View>
        )}
        {typeof movie.rating === 'number' && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color={colors.star} />
            <Text style={styles.ratingText}>{movie.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {movie.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {[movie.year, movie.director].filter(Boolean).join(' • ') ||
          t('detailsInside')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: spacing.sm, gap: 6 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  posterWrap: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  poster: { width: '100%', height: '100%' },
  posterFallback: { alignItems: 'center', justifyContent: 'center' },
  ratingBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingText: { ...typography.tiny, color: colors.text },
  title: { ...typography.bodyStrong, color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary },
});

export const MovieCard = React.memo(MovieCardBase);
