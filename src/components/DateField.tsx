import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useThemedStyles, useTheme } from '../context/ThemeContext';
import { formatDate } from '../lib/labels';
import { startOfDay } from '../lib/summary';
import { radius, spacing, typography, type ThemeColors } from '../theme';

interface DateFieldProps {
  label: string;
  /** Local midnight of the chosen day, or unset. */
  value?: number;
  onChange: (value: number | undefined) => void;
}

/**
 * A day picker that looks like a TextField. Tapping it opens the system
 * calendar: a dialog on Android, an inline calendar under the field on iOS.
 * Days after today cannot be picked. The x clears it. On web, where the
 * native picker is not available, it is a plain YYYY-MM-DD input.
 */
export function DateField({ label, value, onChange }: DateFieldProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors, isLight } = useTheme();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  // Read the clock once per mount: the latest pickable day, and where the
  // calendar opens when nothing is chosen yet.
  const [today] = useState(() => new Date());

  if (Platform.OS === 'web') {
    return <WebDateField label={label} value={value} onChange={onChange} />;
  }

  const current = value === undefined ? today : new Date(value);

  const handleChange = (event: DateTimePickerEvent, picked?: Date) => {
    setOpen(false);
    if (event.type === 'set' && picked) onChange(startOfDay(picked));
  };

  const press = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        maximumDate: today,
        onChange: handleChange,
      });
      return;
    }
    setOpen((o) => !o);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={press}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ? formatDate(value) : t('pickDate') }}
        style={[styles.field, open && styles.fieldFocused]}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color={value ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value ? formatDate(value) : t('pickDate')}
        </Text>
        {value !== undefined && (
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('clearDate')}
            onPress={() => {
              setOpen(false);
              onChange(undefined);
            }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </Pressable>
      {open && Platform.OS === 'ios' && (
        <View style={styles.picker}>
          <DateTimePicker
            value={current}
            mode="date"
            display="inline"
            maximumDate={today}
            onChange={handleChange}
            themeVariant={isLight ? 'light' : 'dark'}
            accentColor={colors.primary}
          />
        </View>
      )}
    </View>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

const toIsoDay = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const parseIsoDay = (text: string): number | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!match) return undefined;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(d.getTime()) ? undefined : startOfDay(d);
};

function WebDateField({ label, value, onChange }: DateFieldProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [text, setText] = useState(value ? toIsoDay(value) : '');
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        <Ionicons
          name="calendar-outline"
          size={18}
          color={value ? colors.primary : colors.textMuted}
        />
        <TextInput
          value={text}
          onChangeText={(next) => {
            setText(next);
            if (!next.trim()) onChange(undefined);
            else {
              const parsed = parseIsoDay(next);
              if (parsed !== undefined) onChange(parsed);
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.text}
        />
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: { gap: spacing.xs },
    label: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      height: 52,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
    },
    fieldFocused: { borderColor: colors.primary },
    text: { flex: 1, ...typography.body, fontSize: 16, color: colors.text },
    placeholder: { color: colors.textMuted },
    picker: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      paddingHorizontal: spacing.sm,
    },
  });
