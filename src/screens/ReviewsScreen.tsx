import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Screen } from '../components/ui/Screen';
import { EmptyView } from '../components/ui/StateViews';
import { StarRating } from '../components/ui/StarRating';
import { useReviews, type Review } from '../context/ReviewsContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, radius, spacing, typography } from '../theme';
import type { TabParamList } from '../navigation/types';

type Props = BottomTabScreenProps<TabParamList, 'ReviewsTab'>;

export function ReviewsScreen({ navigation }: Props) {
  const { myReviews, removeReview } = useReviews();
  const { t } = useLanguage();

  const openMovie = (review: Review) =>
    navigation.navigate('MoviesTab', {
      screen: 'MovieDetail',
      params: {
        movieId: review.movieId,
        title: review.movieTitle,
        poster: review.moviePoster,
      },
    });

  return (
    <Screen padded>
      <Text style={styles.heading}>{t('myReviews')}</Text>
      <FlatList
        data={myReviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openMovie(item)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            {item.moviePoster ? (
              <Image source={{ uri: item.moviePoster }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbFallback]}>
                <Ionicons
                  name="film-outline"
                  size={22}
                  color={colors.textMuted}
                />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>
                {item.movieTitle}
              </Text>
              <StarRating value={item.rating} size={14} />
              {!!item.text && (
                <Text style={styles.snippet} numberOfLines={2}>
                  {item.text}
                </Text>
              )}
            </View>
            <Pressable
              hitSlop={10}
              accessibilityLabel="Delete review"
              onPress={() => removeReview(item.id)}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyView
            icon="star-outline"
            title={t('noReviewsYet')}
            message={t('rateAMovie')}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.h1,
    color: colors.text,
    paddingVertical: spacing.lg,
  },
  content: { flexGrow: 1, paddingBottom: spacing.xxl },
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
  title: { ...typography.bodyStrong, color: colors.text },
  snippet: { ...typography.caption, color: colors.textSecondary },
});
