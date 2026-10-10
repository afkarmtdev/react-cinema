import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { pickSource, sourcesFor } from '../api/lookup';
import { useLanguage } from '../context/LanguageContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { storage, StorageKeys } from '../lib/storage';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import type { ItemKind } from '../types/library';
import type { LookupResult, LookupSourceId } from '../types/lookup';
import { SearchBar } from './SearchBar';
import { Chip } from './ui/Chip';
import { Sheet } from './ui/Sheet';
import { useThemedStyles, useTheme } from '../context/ThemeContext';

type SavedSources = Partial<Record<ItemKind, LookupSourceId>>;

interface LookupSheetProps {
  visible: boolean;
  /** Decides which sources are offered and what they search for. */
  kind: ItemKind;
  onPick: (result: LookupResult) => void;
  onClose: () => void;
}

/**
 * Optional helper for the add form: search one of the free sources for the
 * kind (TMDB, OMDb, TVmaze, Open Library, Google Books) and pick a result to
 * prefill the form. Sources that need a key only appear when it is set, and
 * the last source picked for each kind is remembered.
 */
export function LookupSheet({
  visible,
  kind,
  onPick,
  onClose,
}: LookupSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const available = useMemo(() => sourcesFor(kind), [kind]);
  const [sourceId, setSourceId] = useState<LookupSourceId | null>(null);
  const source = pickSource(available, sourceId);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const [results, setResults] = useState<LookupResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    storage.get<SavedSources>(StorageKeys.lookupSource).then((saved) => {
      if (active) setSourceId(saved?.[kind] ?? null);
    });
    return () => {
      active = false;
    };
  }, [visible, kind]);

  useEffect(() => {
    if (!visible || !source) return;
    const term = debounced.trim();
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
  }, [debounced, kind, visible, source]);

  const choose = async (id: LookupSourceId) => {
    if (id === source?.id) return;
    setSourceId(id);
    setResults([]);
    const saved =
      (await storage.get<SavedSources>(StorageKeys.lookupSource)) ?? {};
    await storage.set(StorageKeys.lookupSource, { ...saved, [kind]: id });
  };

  const pick = async (item: LookupResult) => {
    if (!source) return;
    setPicking(true);
    setError(false);
    try {
      onPick(await source.details(item, kind));
      setQuery('');
      setResults([]);
    } catch {
      setError(true);
    } finally {
      setPicking(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      style={styles.panel}
      avoidKeyboard
    >
      <Text style={styles.title}>{t('lookupTitle')}</Text>
      {available.length > 1 && (
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
      <Text style={styles.hint}>{t('lookupHint')}</Text>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t(
          kind === 'book' ? 'lookupPlaceholderBook' : 'lookupPlaceholder',
        )}
      />

      {picking ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>{t('lookupLoading')}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => pick(item)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              {item.poster ? (
                <Image source={{ uri: item.poster }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Ionicons
                    name={kind === 'book' ? 'book-outline' : 'film-outline'}
                    size={18}
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
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              {searching ? (
                <ActivityIndicator color={colors.primary} />
              ) : error ? (
                <Text style={styles.error}>
                  {t(source?.needsKey ? 'lookupErrorKey' : 'lookupError')}
                </Text>
              ) : debounced.trim() ? (
                <Text style={styles.muted}>{t('lookupEmpty')}</Text>
              ) : null}
            </View>
          }
        />
      )}

      {source && (
        <Text style={styles.credit}>
          {t('lookupCredit', { name: source.label })}
          {source.id === 'tmdb' ? ` ${t('lookupTmdbNotice')}` : ''}
        </Text>
      )}
    </Sheet>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    panel: { height: '75%', gap: spacing.md },
    title: { ...typography.h2, color: colors.text },
    sources: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    hint: { ...typography.caption, color: colors.textSecondary },
    list: { flex: 1 },
    gap: { height: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    pressed: { opacity: 0.8 },
    thumb: {
      width: 40,
      height: 60,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
    },
    thumbFallback: { alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, gap: 2 },
    rowTitle: { ...typography.bodyStrong, color: colors.text },
    rowMeta: { ...typography.caption, color: colors.textSecondary },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.sm,
    },
    muted: { ...typography.caption, color: colors.textMuted },
    error: {
      ...typography.caption,
      color: colors.error,
      textAlign: 'center',
    },
    credit: { ...typography.caption, color: colors.textMuted },
  });
