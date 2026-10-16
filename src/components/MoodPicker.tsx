import { StyleSheet, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { MOOD_ICON, moodKey, toggleMood } from '../lib/moods';
import { spacing } from '../theme';
import { MOODS, type Mood } from '../types/library';
import { Chip } from './ui/Chip';

interface MoodPickerProps {
  value: Mood[];
  onChange: (moods: Mood[]) => void;
}

/** Chips for how an entry felt. Any number can be on at once. */
export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const { t } = useLanguage();
  return (
    <View style={styles.row}>
      {MOODS.map((mood) => (
        <Chip
          key={mood}
          label={t(moodKey(mood))}
          icon={MOOD_ICON[mood]}
          active={value.includes(mood)}
          onPress={() => onChange(toggleMood(value, mood))}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
