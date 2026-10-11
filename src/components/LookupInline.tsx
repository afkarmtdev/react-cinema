import { Ionicons } from '@expo/vector-icons';
import { useEffect, useId, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { pickSource, sourcesFor } from '../api/lookup';
import { useLanguage } from '../context/LanguageContext';
import { useThemedStyles, useTheme } from '../context/ThemeContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { storage, StorageKeys } from '../lib/storage';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import type { ItemKind } from '../types/library';
import type { LookupResult, LookupSourceId } from '../types/lookup';
import { Chip } from './ui/Chip';
import { KeyboardDoneBar } from './ui/KeyboardDoneBar';
import { useKeyboardFocus } from './ui/KeyboardScrollView';

type SavedSources = Partial<Record<ItemKind, LookupSourceId>>;

/** Results shown before "Show more", so the form below stays in view. */
const FIRST_RESULTS = 3;

interface LookupInlineProps {
  /** Decides which sources are offered and what they search for. */
  kind: ItemKind;
  onPick: (result: LookupResult) => void;
  onClose: () => void;
}

/**
 * Optional helper for the add form, opened in place of its "Fill from the
 * web" button: search one of the free sources for the kind (TMDB, OMDb,
 * TVmaze, Open Library, Google Books) and pick a result to prefill the
 * form. It sits in the form rather than in a sheet, so there is nothing to
 * dismiss: the x or a pick closes it. Sources that need a key only appear
 * when it is set, and the last source picked for each kind is remembered.
 */
export function LookupInline({ kind, onPick, onClose }: LookupInlineProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const available = useMemo(() => sourcesFor(kind), [kind]);
  const [sourceId, setSourceId] = useState<LookupSourceId | null>(null);
  const source = pickSource(available, sourceId);
  const [choosing, setChoosing] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const [results, setResults] = useState<LookupResult[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const doneBarId = useId();
  const onKeyboardFocus = useKeyboardFocus();

  useEffect(() => {
    let active = true;
    storage.get<SavedSources>(StorageKeys.lookupSource).then((saved) => {
      if (active) setSourceId(saved?.[kind] ?? null);
    });
    return () => {
      active = false;
    };
  }, [kind]);

  useEffect(() => {
    if (!source) return;
    const term = debounced.trim();
    setShowAll(false);
    if (!term) {
      setResults([]);
      setError(false);
      return;
    }
    let active = true;
    setSearching(true);
    setError(false);
    source
      .search(term, kind)
      .then((data) => {
        if (active) setResults(data);
      })
      .catch(() => {
        if (active) {
          setResults([]);
          setError(true);
        }
      })
      .finally(() => {
        if (active) setSearching(false);
      });
    return () => {
      active = false;
    };
  }, [debounced, kind, source]);

  const choose = async (id: LookupSourceId) => {
    setChoosing(false);
    if (id === source?.id) return;
    setSourceId(id);
    setResults([]);
    const saved =
      (await storage.get<SavedSources>(StorageKeys.lookupSource)) ?? {};
    await storage.set(StorageKeys.lookupSource, { ...saved, [kind]: id });
  };

  const pick = async (item: LookupResult) => {
    if (!source || pickingId) return;
    setPickingId(item.id);
    setError(false);
    try {
      onPick(await source.details(item, kind));
    } catch {
      setError(true);
      setPickingId(null);
    }
  };

  const shown = showAll ? results : results.slice(0, FIRST_RESULTS);
  const hidden = results.length - shown.length;
  const term = debounced.trim();

  return (
    <View style={styles.card} accessibilityLabel={t('lookupTitle')}>
      <View style={styles.inputRow}>
        <Ionicons name="search" size={18} color={colors.primary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t(
            kind === 'book' ? 'lookupPlaceholderBook' : 'lookupPlaceholder',
          )}
          placeholderTextColor={colors.textMuted}
          autoFocus
          onFocus={onKeyboardFocus}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          inputAccessoryViewID={doneBarId}
          style={styles.input}
        />
        <KeyboardDoneBar nativeID={doneBarId} />
        {source &&
          (available.length > 1 ? (
            <Pressable
              onPress={() => setChoosing((c) => !c)}
              accessibilityRole="button"
              accessibilityLabel={`${source.label}. ${t('lookupChangeSource')}`}
              style={styles.sourceButton}
            >
              <Text style={styles.sourceText}>{source.label}</Text>
              <Ionicons
                name={choosing ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.textSecondary}
              />
            </Pressable>
          ) : (
            <Text style={[styles.sourceText, styles.sourceStatic]}>
              {source.label}
            </Text>
          ))}
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('lookupClose')}
          style={styles.close}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {choosing && (
        <View style={styles.sources}>
          {available.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              active={s.id === source?.id}
              onPress={() => choose(s.id)}
            />
          ))}
        </View>
      )}

      {shown.map((item, index) => (
        <Pressable
          key={item.id}
          onPress={() => pick(item)}
          disabled={!!pickingId}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.row,
            index > 0 && styles.rowDivider,
            pressed && styles.pressed,
          ]}
        >
          {item.poster ? (
            <Image source={{ uri: item.poster }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}>
              <Ionicons
                name={kind === 'book' ? 'book-outline' : 'film-outline'}
                size={16}
                color={colors.textMuted}
              />
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {(!!item.year || !!item.creator) && (
              <Text style={styles.rowMeta} numberOfLines={1}>
                {[item.year, item.creator].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
          {pickingId === item.id ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.use}>{t('lookupUse')}</Text>
          )}
        </Pressable>
      ))}

      {results.length === 0 && (
        <View style={styles.status}>
          {searching ? (
            <ActivityIndicator color={colors.primary} />
          ) : error ? (
            <Text style={styles.error}>
              {t(source?.needsKey ? 'lookupErrorKey' : 'lookupError')}
            </Text>
          ) : term ? (
            <Text style={styles.muted}>{t('lookupEmpty')}</Text>
          ) : (
            <Text style={styles.muted}>{t('lookupHint')}</Text>
          )}
        </View>
      )}
      {results.length > 0 && error && (
        <Text style={[styles.error, styles.statusInline]}>
          {t(source?.needsKey ? 'lookupErrorKey' : 'lookupError')}
        </Text>
      )}

      {source && (
        <View style={styles.footer}>
          <Text style={styles.credit}>
            {t('lookupCredit', { name: source.label })}
            {source.id === 'tmdb' ? ` ${t('lookupTmdbNotice')}` : ''}
          </Text>
          {hidden > 0 && (
            <Pressable
              onPress={() => setShowAll(true)}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.more}>
                {t('lookupShowMore', { count: hidden })}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.primary,
      overflow: 'hidden',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      height: 52,
      paddingLeft: spacing.md,
      paddingRight: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    input: {
      flex: 1,
      color: colors.text,
      ...typography.body,
      fontSize: 16,
      padding: 0,
    },
    sourceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      height: 32,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
    },
    sourceText: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    sourceStatic: { paddingHorizontal: spacing.xs },
    close: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sources: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.md,
    },
    rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
    pressed: { opacity: 0.7 },
    thumb: {
      width: 32,
      height: 48,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
    },
    thumbFallback: { alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, gap: 2 },
    rowTitle: { ...typography.bodyStrong, color: colors.text },
    rowMeta: { ...typography.caption, color: colors.textSecondary },
    use: { ...typography.caption, fontWeight: '600', color: colors.primary },
    status: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    statusInline: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    muted: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
    },
    error: {
      ...typography.caption,
      color: colors.error,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surfaceAlt,
    },
    credit: { flex: 1, ...typography.caption, color: colors.textMuted },
    more: { ...typography.caption, fontWeight: '600', color: colors.primary },
  });
