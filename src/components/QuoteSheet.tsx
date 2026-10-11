import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useThemedStyles, useTheme } from '../context/ThemeContext';
import { spacing, typography, type ThemeColors } from '../theme';
import type { Quote } from '../types/library';
import { Button } from './ui/Button';
import { Sheet } from './ui/Sheet';
import { TextField } from './ui/TextField';

interface QuoteSheetProps {
  visible: boolean;
  /** The quote being edited, or undefined to add a new one. */
  quote?: Quote;
  onSave: (text: string, page: number | undefined) => Promise<void>;
  /** Only offered while editing. */
  onDelete: () => Promise<void>;
  onClose: () => void;
}

/**
 * Adds or edits one quote from a book: the passage and, if the user knows
 * it, the page. Nothing is saved until Save.
 */
export function QuoteSheet({
  visible,
  quote,
  onSave,
  onDelete,
  onClose,
}: QuoteSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Start from the quote (or a blank one) each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setText(quote?.text ?? '');
    setPage(quote?.page ? String(quote.page) : '');
    setError(null);
    setSaving(false);
  }, [visible, quote]);

  const run = async (task: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    try {
      await task();
      onClose();
    } catch {
      setError(t('errSaveGeneric'));
      setSaving(false);
    }
  };

  const save = () => {
    if (!text.trim()) {
      setError(t('errQuoteEmpty'));
      return;
    }
    const number = parseInt(page, 10);
    run(() => onSave(text.trim(), Number.isNaN(number) ? undefined : number));
  };

  return (
    <Sheet visible={visible} onClose={onClose} avoidKeyboard>
      <Text style={styles.title}>{t(quote ? 'quoteEdit' : 'quoteAdd')}</Text>

      <TextField
        label={t('quoteText')}
        value={text}
        onChangeText={setText}
        placeholder={t('quoteHint')}
        multiline
        error={error}
      />
      <TextField
        label={t('quotePage')}
        value={page}
        onChangeText={(v) => setPage(v.replace(/[^0-9]/g, '').slice(0, 5))}
        placeholder={t('quotePageHint')}
        keyboardType="number-pad"
      />

      <View style={styles.actions}>
        <Button
          label={t('cancel')}
          variant="ghost"
          onPress={onClose}
          style={styles.action}
        />
        <Button
          label={t('save')}
          onPress={save}
          loading={saving}
          style={styles.action}
        />
      </View>
      {quote && (
        <Button
          label={t('quoteDelete')}
          variant="ghost"
          onPress={() => run(onDelete)}
          disabled={saving}
          icon={
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          }
        />
      )}
    </Sheet>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    action: { flex: 1 },
  });
