import { StyleSheet, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { STATUS_ICON, statusKey } from '../lib/labels';
import { spacing } from '../theme';
import {
  ITEM_STATUSES,
  type ItemKind,
  type ItemStatus,
} from '../types/library';
import { Chip } from './ui/Chip';

interface StatusPickerProps {
  value: ItemStatus;
  onChange: (status: ItemStatus) => void;
  /** Picks the wording: watchlist / watching / watched, or to read / reading / read. */
  kind: ItemKind;
}

/** Chips for the three progress states, worded for the entry's kind. */
export function StatusPicker({ value, onChange, kind }: StatusPickerProps) {
  const { t } = useLanguage();
  return (
    <View style={styles.row}>
      {ITEM_STATUSES.map((status) => (
        <Chip
          key={status}
          label={t(statusKey(status, kind))}
          icon={STATUS_ICON[status]}
          active={status === value}
          onPress={() => onChange(status)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
