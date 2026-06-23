import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

interface StarRatingProps {
  value: number;
  /** When provided, stars become tappable to set a 1..5 rating. */
  onChange?: (value: number) => void;
  size?: number;
  max?: number;
}

/** Displays (or, when `onChange` is given, captures) a 1..5 star rating. */
export function StarRating({
  value,
  onChange,
  size = 18,
  max = 5,
}: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const interactive = !!onChange;

  return (
    <View
      style={styles.row}
      accessibilityRole={interactive ? 'adjustable' : 'image'}
    >
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        const icon = (
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? colors.star : colors.textMuted}
            style={styles.star}
          />
        );
        if (!interactive) return <View key={star}>{icon}</View>;
        return (
          <Pressable
            key={star}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} of ${max} stars`}
            onPress={() => onChange?.(star)}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { marginRight: 2 },
});
