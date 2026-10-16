import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { hasTag } from '../lib/tags';
import { spacing, typography, type ThemeColors } from '../theme';
import type { Mood } from '../types/library';
import { MoodPicker } from './MoodPicker';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { Sheet } from './ui/Sheet';
import { useThemedStyles } from '../context/ThemeContext';

/**
 * The filters behind the button next to the search. The status is not in
 * here: it has its own row of chips under the library tabs.
 */
export interface LibraryFilters {
  /** An entry must carry every selected tag. */
  tags: string[];
  /** An entry must carry every selected mood. */
  moods: Mood[];
}

export const EMPTY_FILTERS: LibraryFilters = { tags: [], moods: [] };

export const hasActiveFilters = (f: LibraryFilters) =>
  f.tags.length > 0 || f.moods.length > 0;

interface FilterSheetProps {
  visible: boolean;
  filters: LibraryFilters;
  /** Every tag in the library, offered as toggles. */
  availableTags: string[];
  onApply: (filters: LibraryFilters) => void;
  onClose: () => void;
}

/** Bottom sheet to narrow the library by tags and moods. */
export function FilterSheet({
  visible,
  filters,
  availableTags,
  onApply,
  onClose,
}: FilterSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useLanguage();
  const [draft, setDraft] = useState<LibraryFilters>(filters);

  // Sync the draft with the active filters whenever the sheet opens.
  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const toggleTag = (tag: string) =>
    setDraft((d) => ({
      ...d,
      tags: hasTag(d.tags, tag)
        ? d.tags.filter((x) => x.toLowerCase() !== tag.toLowerCase())
        : [...d.tags, tag],
    }));

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>{t('filters')}</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t('filterMoods')}</Text>
        <MoodPicker
          value={draft.moods}
          onChange={(moods) => setDraft((d) => ({ ...d, moods }))}
        />

        <Text style={styles.label}>{t('filterTags')}</Text>
        {availableTags.length === 0 ? (
          <Text style={styles.muted}>{t('noTagsYet')}</Text>
        ) : (
          <View style={styles.chips}>
            {availableTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                active={hasTag(draft.tags, tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <Button
          label={t('clearFilters')}
          variant="outline"
          onPress={() => onApply(EMPTY_FILTERS)}
          style={styles.actionBtn}
        />
        <Button
          label={t('apply')}
          onPress={() => onApply(draft)}
          style={styles.actionBtn}
        />
      </View>
    </Sheet>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { ...typography.h2, color: colors.text },
    scroll: { flexGrow: 0 },
    scrollContent: { gap: spacing.sm, paddingBottom: spacing.sm },
    label: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    muted: { ...typography.caption, color: colors.textMuted },
    actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    actionBtn: { flex: 1 },
  });
