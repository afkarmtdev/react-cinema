import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { KIND_ICON, kindKey } from '../lib/labels';
import { colors, radius, spacing, typography } from '../theme';
import { ITEM_KINDS, type ItemKind } from '../types/library';

interface KindPickerProps {
  value: ItemKind;
  onChange: (kind: ItemKind) => void;
}

/** Three-way selector for film, series, or book. */
export function KindPicker({ value, onChange }: KindPickerProps) {
  const { t } = useLanguage();
  return (
    <View style={styles.row}>
      {ITEM_KINDS.map((kind) => {
        const active = kind === value;
        return (
          <Pressable
            key={kind}
            onPress={() => onChange(kind)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.option, active && styles.optionActive]}
          >
            <Ionicons
              name={KIND_ICON[kind]}
              size={20}
              color={active ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.label, active && styles.labelActive]}>
              {t(kindKey(kind))}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionActive: { borderColor: colors.primary },
  label: { ...typography.bodyStrong, color: colors.textSecondary },
  labelActive: { color: colors.primary },
});
