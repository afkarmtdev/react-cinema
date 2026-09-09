import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { STATUS_ICON, statusKey } from '../lib/labels';
import { hasTag } from '../lib/tags';
import { colors, radius, spacing, typography } from '../theme';
import { ITEM_STATUSES, type ItemStatus } from '../types/library';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';

export interface LibraryFilters {
  status?: ItemStatus;
  /** An entry must carry every selected tag. */
  tags: string[];
}

export const EMPTY_FILTERS: LibraryFilters = { tags: [] };

export const hasActiveFilters = (f: LibraryFilters) =>
  !!f.status || f.tags.length > 0;

interface FilterSheetProps {
  visible: boolean;
  filters: LibraryFilters;
  /** Every tag in the library, offered as toggles. */
  availableTags: string[];
  onApply: (filters: LibraryFilters) => void;
  onClose: () => void;
}

/** Bottom sheet to narrow the library by status and tags. */
export function FilterSheet({
  visible,
  filters,
  availableTags,
  onApply,
  onClose,
}: FilterSheetProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{t('filters')}</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>{t('filterStatus')}</Text>
            <View style={styles.chips}>
              <Chip
                label={t('filterAll')}
                active={!draft.status}
                onPress={() => setDraft((d) => ({ ...d, status: undefined }))}
              />
              {ITEM_STATUSES.map((status) => (
                <Chip
                  key={status}
                  label={t(statusKey(status))}
                  icon={STATUS_ICON[status]}
                  active={draft.status === status}
                  onPress={() => setDraft((d) => ({ ...d, status }))}
                />
              ))}
            </View>

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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
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
