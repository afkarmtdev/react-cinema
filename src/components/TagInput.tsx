import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { hasTag, splitTags, uniqueTags } from '../lib/tags';
import { colors, radius, spacing, typography } from '../theme';
import { Chip } from './ui/Chip';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Tags the user has used elsewhere, offered as one-tap suggestions. */
  suggestions?: string[];
}

/**
 * Free-text tag editor. Typing a comma or pressing enter turns the text into
 * a chip; suggestions from the rest of the library sit underneath.
 */
export function TagInput({ value, onChange, suggestions = [] }: TagInputProps) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);

  const commit = (text: string) => {
    const parsed = splitTags(text);
    if (parsed.length) onChange(uniqueTags([...value, ...parsed]));
    setDraft('');
  };

  const onChangeText = (text: string) => {
    if (text.includes(',') || text.includes('\n')) commit(text);
    else setDraft(text);
  };

  const remove = (tag: string) =>
    onChange(value.filter((v) => v.toLowerCase() !== tag.toLowerCase()));

  const unused = suggestions.filter((s) => !hasTag(value, s)).slice(0, 12);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        {value.map((tag) => (
          <Chip key={tag} label={tag} active onRemove={() => remove(tag)} />
        ))}
        <TextInput
          value={draft}
          onChangeText={onChangeText}
          onSubmitEditing={() => commit(draft)}
          onBlur={() => {
            setFocused(false);
            if (draft.trim()) commit(draft);
          }}
          onFocus={() => setFocused(true)}
          placeholder={value.length ? '' : t('tagsHint')}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
          returnKeyType="done"
          style={styles.input}
        />
      </View>
      {unused.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsLabel}>{t('yourTags')}</Text>
          <View style={styles.chips}>
            {unused.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                icon="add"
                onPress={() => onChange(uniqueTags([...value, tag]))}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  field: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fieldFocused: { borderColor: colors.primary },
  input: {
    flexGrow: 1,
    minWidth: 120,
    height: 34,
    padding: 0,
    color: colors.text,
    ...typography.body,
    fontSize: 16,
  },
  suggestions: { gap: spacing.xs },
  suggestionsLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
