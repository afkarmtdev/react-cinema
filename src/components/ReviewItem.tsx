import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import type { Review } from '../context/ReviewsContext';
import { StarRating } from './ui/StarRating';

interface ReviewItemProps {
  review: Review;
  /** When provided, shows a delete affordance (used for the user's own reviews). */
  onDelete?: (review: Review) => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ReviewItem({ review, onDelete }: ReviewItemProps) {
  const initial = review.userName.charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{review.userName}</Text>
          <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
        </View>
        <StarRating value={review.rating} size={15} />
        {onDelete && (
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Delete review"
            onPress={() => onDelete(review)}
            style={styles.delete}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {!!review.text && <Text style={styles.text}>{review.text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.bodyStrong, color: colors.onPrimary },
  headerText: { flex: 1 },
  name: { ...typography.bodyStrong, color: colors.text },
  date: { ...typography.tiny, color: colors.textMuted },
  delete: { marginLeft: spacing.sm },
  text: { ...typography.body, color: colors.textSecondary, lineHeight: 21 },
});
