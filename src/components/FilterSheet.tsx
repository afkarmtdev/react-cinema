import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';
import type { MovieFilters } from '../api/movies';

interface FilterSheetProps {
  visible: boolean;
  filters: MovieFilters;
  onApply: (filters: MovieFilters) => void;
  onClose: () => void;
}

export function FilterSheet({
  visible,
  filters,
  onApply,
  onClose,
}: FilterSheetProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [year, setYear] = useState(filters.year ?? '');
  const [type, setType] = useState<'movie' | 'series'>(filters.type ?? 'movie');

  // Sync the draft with the active filters whenever the sheet opens.
  useEffect(() => {
    if (visible) {
      setYear(filters.year ?? '');
      setType(filters.type ?? 'movie');
    }
  }, [visible, filters]);

  const apply = () => onApply({ year: year.trim() || undefined, type });
  const clear = () => {
    setYear('');
    setType('movie');
    onApply({});
  };

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

          <Text style={styles.label}>{t('filterYear')}</Text>
          <TextInput
            value={year}
            onChangeText={(v) => setYear(v.replace(/[^0-9]/g, '').slice(0, 4))}
            placeholder={t('filterYearHint')}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            style={styles.input}
          />

          <Text style={styles.label}>{t('filterType')}</Text>
          <View style={styles.typeRow}>
            <TypeOption
              label={t('filterMovie')}
              active={type === 'movie'}
              onPress={() => setType('movie')}
            />
            <TypeOption
              label={t('filterSeries')}
              active={type === 'series'}
              onPress={() => setType('series')}
            />
          </View>

          <View style={styles.actions}>
            <Button
              label={t('clearFilters')}
              variant="outline"
              onPress={clear}
              style={styles.actionBtn}
            />
            <Button
              label={t('apply')}
              onPress={apply}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TypeOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.typeOption, active && styles.typeOptionActive]}
    >
      <Text style={[styles.typeText, active && styles.typeTextActive]}>
        {label}
      </Text>
    </Pressable>
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
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  input: {
    height: 50,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    ...typography.body,
    fontSize: 16,
  },
  typeRow: { flexDirection: 'row', gap: spacing.md },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typeOptionActive: { borderColor: colors.primary },
  typeText: { ...typography.bodyStrong, color: colors.textSecondary },
  typeTextActive: { color: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  actionBtn: { flex: 1 },
});
