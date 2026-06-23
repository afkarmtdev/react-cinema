import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Button } from './ui/Button';
import { StarRating } from './ui/StarRating';
import { useLanguage } from '../context/LanguageContext';
import type { Review } from '../context/ReviewsContext';

interface ReviewComposerProps {
  /** The current user's existing review, if any, to prefill the form. */
  existing?: Review;
  onSubmit: (rating: number, text: string) => Promise<void>;
}

/** Star picker + text box for creating or editing the user's own review. */
export function ReviewComposer({ existing, onSubmit }: ReviewComposerProps) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [text, setText] = useState(existing?.text ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (rating < 1) {
      setError(t('tapStarFirst'));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit(rating, text.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {existing ? t('yourReview') : t('rateThisMovie')}
      </Text>

      <View style={styles.ratingRow}>
        <StarRating value={rating} onChange={setRating} size={32} />
        {rating > 0 && <Text style={styles.ratingValue}>{rating}/5</Text>}
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={t('shareThoughts')}
        placeholderTextColor={colors.textMuted}
        multiline
        style={styles.input}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Button
        label={existing ? t('updateReview') : t('postReview')}
        onPress={submit}
        loading={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { ...typography.h3, color: colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ratingValue: { ...typography.bodyStrong, color: colors.star },
  input: {
    minHeight: 90,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.text,
    ...typography.body,
    textAlignVertical: 'top',
  },
  error: { ...typography.caption, color: colors.error },
});
