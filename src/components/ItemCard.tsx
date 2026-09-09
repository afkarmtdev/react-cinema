import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { KIND_ICON, STATUS_ICON, kindKey, statusKey } from '../lib/labels';
import { ScoreBadge } from './ui/ScoreBadge';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import type { LibraryItem } from '../types/library';
import { useThemedStyles, useTheme } from '../context/ThemeContext';

interface ItemCardProps {
  item: LibraryItem;
  onPress: (item: LibraryItem) => void;
}

/** Poster-first grid card for a library entry. */
function ItemCardBase({ item, onPress }: ItemCardProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const { t } = useLanguage();
  const showImage = !!item.poster && !imageFailed;
  const meta = [item.year, item.creator].filter(Boolean).join(' / ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${item.year ? `, ${item.year}` : ''}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.posterWrap}>
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
              size={32}
              color={colors.textMuted}
            />
            <Text style={styles.fallbackTitle} numberOfLines={3}>
              {item.title}
            </Text>
          </View>
        )}
        <View style={styles.kindBadge}>
          <Ionicons
            name={KIND_ICON[item.kind]}
            size={12}
            color={colors.onOverlay}
          />
        </View>
        {typeof item.rating === 'number' && (
          <ScoreBadge value={item.rating} style={styles.ratingBadge} />
        )}
        <View
          style={[
            styles.statusBadge,
            item.status === 'done' && styles.statusBadgeDone,
          ]}
        >
          <Ionicons
            name={STATUS_ICON[item.status]}
            size={11}
            color={item.status === 'done' ? colors.onPrimary : colors.onOverlay}
          />
          <Text
            style={[
              styles.statusText,
              item.status === 'done' && styles.statusTextDone,
            ]}
          >
            {t(statusKey(item.status, item.kind))}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {meta || t(kindKey(item.kind))}
      </Text>
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
    card: { flex: 1, margin: spacing.sm, gap: 6 },
    pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    posterWrap: {
      width: '100%',
      aspectRatio: 2 / 3,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
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
    kindBadge: { ...badge, top: spacing.sm, left: spacing.sm, padding: 5 },
    ratingBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm },
    statusBadge: { ...badge, bottom: spacing.sm, left: spacing.sm },
    statusBadgeDone: { backgroundColor: colors.primary },
    statusText: { ...typography.tiny, color: colors.onOverlay },
    statusTextDone: { color: colors.onPrimary },
    title: { ...typography.bodyStrong, color: colors.text },
    meta: { ...typography.caption, color: colors.textSecondary },
  });
};

export const ItemCard = React.memo(ItemCardBase);
