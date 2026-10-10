import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandHeader } from '../../components/BrandHeader';
import { useFloatingTabBarInset } from '../../components/FloatingTabBar';
import {
  EMPTY_FILTERS,
  FilterSheet,
  hasActiveFilters,
  type LibraryFilters,
} from '../../components/FilterSheet';
import { ItemCard, type ItemCardSize } from '../../components/ItemCard';
import { SearchBar } from '../../components/SearchBar';
import { SwipePager } from '../../components/SwipePager';
import { TimelineGrid } from '../../components/TimelineGrid';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { EmptyView, ErrorView, Loading } from '../../components/ui/StateViews';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLibrary } from '../../context/LibraryContext';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { isFavourite, toggleFavourite } from '../../lib/favourites';
import { haptics } from '../../lib/haptics';
import { StorageKeys, storage } from '../../lib/storage';
import { hasTag } from '../../lib/tags';
import { DEFAULT_ZOOM, isZoomLevel, type ZoomLevel } from '../../lib/timeline';
import { radius, spacing, typography, type ThemeColors } from '../../theme';
import {
  ITEM_KINDS,
  type ItemKind,
  type LibraryItem,
} from '../../types/library';
import type { LibraryStackParamList } from '../../navigation/types';
import { useThemedStyles, useTheme } from '../../context/ThemeContext';

type Props = NativeStackScreenProps<LibraryStackParamList, 'Library'>;

type KindFilter = ItemKind | 'all';

const KIND_LABEL: Record<KindFilter, string> = {
  all: 'kindsAll',
  film: 'kindsFilm',
  series: 'kindsSeries',
  book: 'kindsBook',
};

/** One swipeable page per entry, left to right. */
const KIND_FILTERS: KindFilter[] = ['all', ...ITEM_KINDS];

/** The card each zoom level draws, from one wide row to a wall of covers. */
const CARD_SIZE: Record<ZoomLevel, ItemCardSize> = {
  0: 'lg',
  1: 'md',
  2: 'sm',
  3: 'xs',
};

export function LibraryScreen({ navigation }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { items, allTags, ready, loadError, reload } = useLibrary();
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const tabBar = useFloatingTabBarInset();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [zoom, setZoom] = useState<ZoomLevel>(DEFAULT_ZOOM);
  const debouncedQuery = useDebouncedValue(query);

  // The zoom is remembered across launches, like the camera roll's.
  useEffect(() => {
    let cancelled = false;
    storage.get<unknown>(StorageKeys.libraryZoom).then((saved) => {
      if (!cancelled && isZoomLevel(saved)) setZoom(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const changeZoom = (next: ZoomLevel) => {
    haptics.tick();
    setZoom(next);
    storage.set(StorageKeys.libraryZoom, next).catch(() => {});
  };

  // A long press on a card puts the entry on the top four, or takes it off.
  const toggleShelf = (item: LibraryItem) => {
    const next = toggleFavourite(user?.favourites, item.id);
    if (!next) {
      Alert.alert(t('favouritesFullTitle'), t('favouritesFull'));
      return;
    }
    haptics.tap();
    updateProfile({ favourites: next }).catch(() => {});
  };

  // Search, status, and tags apply to every page; the kind is the page.
  const filtered = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.tags.some((tag) => !hasTag(item.tags, tag))) return false;
      if (!term) return true;
      const haystack = [
        item.title,
        item.creator ?? '',
        item.year ? String(item.year) : '',
        ...item.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [items, filters, debouncedQuery]);

  const byKind = useMemo(
    () =>
      Object.fromEntries(
        KIND_FILTERS.map((k) => [
          k,
          k === 'all' ? filtered : filtered.filter((item) => item.kind === k),
        ]),
      ) as Record<KindFilter, LibraryItem[]>,
    [filtered],
  );

  const pages = useMemo(
    () => KIND_FILTERS.map((k) => ({ key: k, label: t(KIND_LABEL[k]) })),
    [t],
  );

  const openDetail = (item: LibraryItem) =>
    navigation.navigate('ItemDetail', { itemId: item.id, title: item.title });

  const openAdd = () =>
    navigation.navigate('ItemForm', {
      kind: kind === 'all' ? undefined : kind,
    });

  const isSearching = !!debouncedQuery.trim() || hasActiveFilters(filters);
  const filtersOn = hasActiveFilters(filters);

  const header = (
    <View style={styles.header}>
      <BrandHeader align="left" />
      <View style={styles.headingRow}>
        <Text style={styles.heading}>{t('libraryHeading')}</Text>
        <Text style={styles.count}>
          {items.length === 1
            ? t('entryCountOne')
            : t('entryCount', { count: items.length })}
        </Text>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchFlex}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchLibrary')}
          />
        </View>
        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('filters')}
          style={[styles.filterBtn, filtersOn && styles.filterBtnActive]}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={filtersOn ? colors.primary : colors.textSecondary}
          />
          {filtersOn && <View style={styles.filterDot} />}
        </Pressable>
      </View>
    </View>
  );

  const renderPage = ({ key }: { key: KindFilter }): ReactNode => {
    if (!ready) return <Loading message={t('loadingLibrary')} />;
    if (loadError) {
      return <ErrorView message={t('libraryLoadError')} onRetry={reload} />;
    }
    return (
      <TimelineGrid
        items={byKind[key]}
        zoom={zoom}
        onZoomChange={changeZoom}
        renderItem={(item) => (
          <ItemCard
            item={item}
            size={CARD_SIZE[zoom]}
            favourite={isFavourite(user?.favourites, item.id)}
            onPress={openDetail}
            onLongPress={toggleShelf}
          />
        )}
        contentContainerStyle={{
          paddingBottom: tabBar.clearance + 60 + spacing.md,
        }}
        ListEmptyComponent={
          items.length === 0 ? (
            <View style={styles.empty}>
              <EmptyView
                icon="albums-outline"
                title={t('emptyLibraryTitle')}
                message={t('emptyLibraryMessage')}
              />
              <Button
                label={t('add')}
                onPress={openAdd}
                style={styles.emptyBtn}
              />
            </View>
          ) : (
            <EmptyView
              icon="search-outline"
              title={t('noMatchesTitle')}
              message={isSearching ? t('noMatchesMessage') : undefined}
            />
          )
        }
      />
    );
  };

  return (
    <Screen padded>
      {header}
      <SwipePager
        pages={pages}
        index={KIND_FILTERS.indexOf(kind)}
        onIndexChange={(i) => setKind(KIND_FILTERS[i])}
        renderPage={renderPage}
        pageInset={spacing.lg}
      />

      <Pressable
        onPress={openAdd}
        accessibilityRole="button"
        accessibilityLabel={t('add')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: tabBar.top + spacing.md },
          pressed && styles.fabPressed,
        ]}
      >
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </Pressable>

      <FilterSheet
        visible={filterOpen}
        filters={filters}
        availableTags={allTags}
        onApply={(next) => {
          setFilters(next);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      paddingTop: spacing.sm,
      gap: spacing.lg,
      marginBottom: spacing.lg,
    },
    headingRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    heading: { ...typography.h1, color: colors.text },
    count: { ...typography.caption, color: colors.textMuted },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    searchFlex: { flex: 1 },
    filterBtn: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBtnActive: { borderColor: colors.primary },
    filterDot: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    empty: { flex: 1, alignItems: 'center', paddingBottom: spacing.xxl },
    emptyBtn: { paddingHorizontal: spacing.xxl },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      width: 60,
      height: 60,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    fabPressed: { backgroundColor: colors.primaryPressed },
  });
