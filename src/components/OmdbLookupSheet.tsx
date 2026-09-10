import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchMovieById, fetchMovies } from '../api/movies';
import { useLanguage } from '../context/LanguageContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import type { ItemKind } from '../types/library';
import type { Movie } from '../types/movie';
import { SearchBar } from './SearchBar';
import { Sheet } from './ui/Sheet';
import { useThemedStyles, useTheme } from '../context/ThemeContext';

interface OmdbLookupSheetProps {
  visible: boolean;
  /** Narrows the OMDb search to movies or series. */
  kind: ItemKind;
  onPick: (movie: Movie) => void;
  onClose: () => void;
}

/**
 * Optional helper for films and series: search OMDb and pick a result to
 * prefill the add form. Only offered when an OMDb key is configured.
 */
export function OmdbLookupSheet({
  visible,
  kind,
  onPick,
  onClose,
}: OmdbLookupSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const [results, setResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const term = debounced.trim();
    if (!term) {
      setResults([]);
      setError(false);
      return;
    }
    let active = true;
    setSearching(true);
    setError(false);
    fetchMovies(term, { type: kind === 'series' ? 'series' : 'movie' })
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
  }, [debounced, kind, visible]);

  const pick = async (movie: Movie) => {
    setPicking(true);
    setError(false);
    try {
      onPick(await fetchMovieById(movie.id));
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
      <Text style={styles.hint}>{t('lookupHint')}</Text>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('lookupPlaceholder')}
      />

      {picking ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>{t('lookupLoading')}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(m) => m.id}
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
                    name="film-outline"
                    size={18}
                    color={colors.textMuted}
                  />
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {!!item.year && <Text style={styles.rowMeta}>{item.year}</Text>}
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
                <Text style={styles.error}>{t('lookupError')}</Text>
              ) : debounced.trim() ? (
                <Text style={styles.muted}>{t('lookupEmpty')}</Text>
              ) : null}
            </View>
          }
        />
      )}
    </Sheet>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    panel: { height: '75%', gap: spacing.md },
    title: { ...typography.h2, color: colors.text },
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
  });
