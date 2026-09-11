import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { KIND_ICON, STATUS_ICON, kindKey, statusKey } from '../lib/labels';
import { ScoreBadge } from './ui/ScoreBadge';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import type { LibraryItem } from '../types/library';
import { useThemedStyles, useTheme } from '../context/ThemeContext';

/**
 * How much of the entry the card shows, one per zoom level of the library
 * grid: `lg` is a wide row with the notes, `md` the poster card with every
 * badge, `sm` a poster with the score and a title, `xs` the poster alone.
 * Every size shows the status; the small ones as an icon in a dot.
 */
export type ItemCardSize = 'lg' | 'md' | 'sm' | 'xs';

interface ItemCardProps {
  item: LibraryItem;
  onPress: (item: LibraryItem) => void;
  size?: ItemCardSize;
}

/** Poster-first card for a library entry, drawn at the size the grid asks. */
function ItemCardBase({ item, onPress, size = 'md' }: ItemCardProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const { t } = useLanguage();
  const showImage = !!item.poster && !imageFailed;
  const meta = [item.year, item.creator].filter(Boolean).join(' / ');
  const done = item.status === 'done';
  const label = `${item.title}${item.year ? `, ${item.year}` : ''}`;

  const poster = (
    <View style={[styles.posterWrap, size === 'lg' && styles.posterWrapRow]}>
      {showImage ? (
        <Image
          source={{ uri: item.poster }}
          style={styles.poster}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={[styles.poster, styles.posterFallback]}>
          <Ionicons
            name={KIND_ICON[item.kind]}
            size={size === 'xs' ? 18 : size === 'sm' ? 24 : 32}
            color={colors.textMuted}
          />
          {size !== 'xs' && (
            <Text
              style={[styles.fallbackTitle, size === 'sm' && styles.tinyText]}
              numberOfLines={size === 'sm' ? 2 : 3}
            >
              {item.title}
            </Text>
          )}
        </View>
      )}
      {size === 'md' && (
        <View style={styles.kindBadge}>
          <Ionicons
            name={KIND_ICON[item.kind]}
            size={12}
            color={colors.onOverlay}
          />
        </View>
      )}
      {(size === 'md' || size === 'sm') && typeof item.rating === 'number' && (
        <ScoreBadge value={item.rating} style={styles.ratingBadge} />
      )}
      {size === 'md' && (
        <View style={[styles.statusBadge, done && styles.statusBadgeDone]}>
          <Ionicons
            name={STATUS_ICON[item.status]}
            size={11}
            color={done ? colors.onPrimary : colors.onOverlay}
          />
          <Text style={[styles.statusText, done && styles.statusTextDone]}>
            {t(statusKey(item.status, item.kind))}
          </Text>
        </View>
      )}
      {(size === 'sm' || size === 'xs') && (
        <View
          style={[
            styles.statusDot,
            size === 'xs' && styles.statusDotXs,
            done && styles.statusBadgeDone,
          ]}
          accessibilityLabel={t(statusKey(item.status, item.kind))}
        >
          <Ionicons
            name={done ? 'checkmark' : STATUS_ICON[item.status]}
            size={size === 'xs' ? 9 : 11}
            color={done ? colors.onPrimary : colors.onOverlay}
          />
        </View>
      )}
    </View>
  );

  if (size === 'lg') {
    const notes = item.review || item.description;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => onPress(item)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        {poster}
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.rowMeta}>
            <Ionicons
              name={KIND_ICON[item.kind]}
              size={13}
              color={colors.textMuted}
            />
            <Text style={styles.meta} numberOfLines={1}>
              {meta || t(kindKey(item.kind))}
            </Text>
          </View>
          <View style={styles.rowFacts}>
            <View style={[styles.statusPill, done && styles.statusBadgeDone]}>
              <Ionicons
                name={STATUS_ICON[item.status]}
                size={11}
                color={done ? colors.onPrimary : colors.textSecondary}
              />
              <Text
                style={[styles.statusPillText, done && styles.statusTextDone]}
              >
                {t(statusKey(item.status, item.kind))}
              </Text>
            </View>
            {typeof item.rating === 'number' && (
              <ScoreBadge value={item.rating} />
            )}
          </View>
          {!!notes && (
            <Text style={styles.snippet} numberOfLines={3}>
              {notes}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        size === 'xs' && styles.cardXs,
        pressed && styles.pressed,
      ]}
    >
      {poster}
      {size === 'md' && (
        <>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {meta || t(kindKey(item.kind))}
          </Text>
        </>
      )}
      {size === 'sm' && (
        <Text style={styles.smallTitle} numberOfLines={1}>
          {item.title}
        </Text>
      )}
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) => {
  const badge = {
    position: 'absolute' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  };
  return StyleSheet.create({
    card: { flex: 1, gap: 6 },
    cardXs: { gap: 0 },
    pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    posterWrap: {
      width: '100%',
      aspectRatio: 2 / 3,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    posterWrapRow: { width: 96, borderRadius: radius.sm },
    poster: { width: '100%', height: '100%' },
    posterFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.md,
    },
    fallbackTitle: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
    },
    tinyText: { ...typography.tiny },
    kindBadge: { ...badge, top: spacing.sm, left: spacing.sm, padding: 5 },
    ratingBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm },
    statusBadge: { ...badge, bottom: spacing.sm, left: spacing.sm },
    statusBadgeDone: { backgroundColor: colors.primary },
    statusText: { ...typography.tiny, color: colors.onOverlay },
    statusTextDone: { color: colors.onPrimary },
    // The status on the small tiles: an icon in a dot, yellow once finished.
    statusDot: {
      position: 'absolute',
      bottom: spacing.xs + 2,
      left: spacing.xs + 2,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusDotXs: { width: 14, height: 14, borderRadius: 7, bottom: 3, left: 3 },
    title: { ...typography.bodyStrong, color: colors.text },
    smallTitle: { ...typography.tiny, color: colors.text },
    meta: { ...typography.caption, color: colors.textSecondary },
    // The one-column layout: poster on the left, the facts and notes beside it.
    row: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    rowInfo: { flex: 1, gap: spacing.xs },
    rowTitle: { ...typography.h3, color: colors.text },
    rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rowFacts: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 2,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusPillText: { ...typography.tiny, color: colors.textSecondary },
    snippet: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
};

export const ItemCard = React.memo(ItemCardBase);
