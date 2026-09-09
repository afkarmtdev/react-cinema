import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import {
  SCORE_ALMOST_PERFECT,
  SCORE_MAX,
  clampScore,
  formatScore,
  splitScore,
} from '../lib/score';
import { colors, radius, spacing, typography } from '../theme';
import { Button } from './ui/Button';

interface ScoreInputProps {
  /** 1.0 to 10.0, or 0 when nothing has been scored yet. */
  value: number;
  onChange: (value: number) => void;
}

const WHOLES = Array.from({ length: SCORE_MAX }, (_, i) => i + 1);
const TENTHS = Array.from({ length: 10 }, (_, i) => i);

/**
 * Two-row score picker: the whole number on top, the tenth underneath, with
 * the result shown large. Tapping 10 asks for a confession first.
 */
export function ScoreInput({ value, onChange }: ScoreInputProps) {
  const { t } = useLanguage();
  const [askingAboutTen, setAskingAboutTen] = useState(false);
  const hasScore = value >= 1;
  const { whole, tenth } = hasScore
    ? splitScore(value)
    : { whole: 0, tenth: 0 };

  const pickWhole = (next: number) => {
    setAskingAboutTen(false);
    if (next === SCORE_MAX) {
      setAskingAboutTen(true);
      return;
    }
    onChange(clampScore(next + tenth / 10));
  };

  const pickTenth = (next: number) => {
    if (!hasScore || whole === SCORE_MAX) return;
    onChange(clampScore(whole + next / 10));
  };

  const clear = () => {
    setAskingAboutTen(false);
    onChange(0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.big}>
          {hasScore ? formatScore(value) : '–'}
          <Text style={styles.outOf}> / {SCORE_MAX}</Text>
        </Text>
        {hasScore && (
          <Pressable
            hitSlop={8}
            onPress={clear}
            accessibilityRole="button"
            accessibilityLabel={t('clearRating')}
          >
            <Text style={styles.clear}>{t('clearRating')}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.row}>
        {WHOLES.map((n) => {
          const active = hasScore && whole === n;
          const isTen = n === SCORE_MAX;
          return (
            <Pressable
              key={n}
              onPress={() => pickWhole(n)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.cell,
                active && styles.cellActive,
                isTen && styles.cellTen,
              ]}
            >
              <Text style={[styles.cellText, active && styles.cellTextActive]}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        {TENTHS.map((n) => {
          const disabled = !hasScore || whole === SCORE_MAX;
          const active = hasScore && !disabled && tenth === n;
          return (
            <Pressable
              key={n}
              onPress={() => pickTenth(n)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              style={[
                styles.cell,
                styles.cellTenth,
                active && styles.cellActive,
                disabled && styles.cellDisabled,
              ]}
            >
              <Text style={[styles.cellText, active && styles.cellTextActive]}>
                .{n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {askingAboutTen && (
        <View style={styles.warning}>
          <View style={styles.warningHeader}>
            <Ionicons name="alert-circle" size={18} color={colors.primary} />
            <Text style={styles.warningTitle}>{t('tenWarningTitle')}</Text>
          </View>
          <Text style={styles.warningBody}>{t('tenWarningBody')}</Text>
          <View style={styles.warningActions}>
            <Button
              label={t('tenKeepNine')}
              onPress={() => {
                setAskingAboutTen(false);
                onChange(SCORE_ALMOST_PERFECT);
              }}
              style={styles.warningBtn}
            />
            <Button
              label={t('tenConfirm')}
              variant="ghost"
              onPress={() => {
                setAskingAboutTen(false);
                onChange(SCORE_MAX);
              }}
              style={styles.warningBtn}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  big: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.star,
    fontVariant: ['tabular-nums'],
  },
  outOf: { ...typography.body, color: colors.textMuted, fontWeight: '500' },
  clear: { ...typography.caption, color: colors.textMuted },
  row: { flexDirection: 'row', gap: 4 },
  cell: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellTenth: { height: 32 },
  cellActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  cellTen: { borderStyle: 'dashed' },
  cellDisabled: { opacity: 0.35 },
  cellText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  cellTextActive: { color: colors.primary },
  warning: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  warningTitle: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  warningBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  warningActions: { flexDirection: 'row', gap: spacing.sm },
  warningBtn: { flex: 1, height: 42 },
});
