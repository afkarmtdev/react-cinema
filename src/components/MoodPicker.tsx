import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useThemedStyles } from '../context/ThemeContext';
import { MOOD_HANZI, moodKey, toggleMood } from '../lib/moods';
import { motion, radius, spacing, type ThemeColors } from '../theme';
import { MOODS, type Mood } from '../types/library';

interface MoodPickerProps {
  value: Mood[];
  onChange: (moods: Mood[]) => void;
}

/**
 * How an entry felt, as six Cantonese tiles. Any number can be on at once;
 * picking one flips its tile over to the logo's skewed yellow face.
 */
export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const styles = useThemedStyles(makeStyles);
  const reduceMotion = useReduceMotion();
  return (
    <View style={styles.grid}>
      {MOODS.map((mood) => (
        <MoodTile
          key={mood}
          mood={mood}
          on={value.includes(mood)}
          reduceMotion={reduceMotion}
          onPress={() => onChange(toggleMood(value, mood))}
        />
      ))}
    </View>
  );
}

function MoodTile({
  mood,
  on,
  reduceMotion,
  onPress,
}: {
  mood: Mood;
  on: boolean;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useLanguage();
  const { char, jyutping } = MOOD_HANZI[mood];
  const label = t(moodKey(mood));
  // 0 is the plain face, 1 the yellow one turned a half turn.
  const [flip] = useState(() => new Animated.Value(on ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) {
      flip.setValue(on ? 1 : 0);
      return;
    }
    const turn = Animated.spring(flip, {
      toValue: on ? 1 : 0,
      ...motion.glide,
      useNativeDriver: true,
    });
    turn.start();
    return () => turn.stop();
  }, [flip, on, reduceMotion]);

  // The faces swap at the edge-on midpoint, so neither relies on
  // backface culling, which Android and the web do not agree on.
  const rotateY = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const frontOpacity = flip.interpolate({
    inputRange: [0.5, 0.501],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const backOpacity = flip.interpolate({
    inputRange: [0.5, 0.501],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  // The character lands a beat after the turn, with the spring's overshoot.
  const inkScale = flip.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.6, 1],
    extrapolateLeft: 'clamp',
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      style={styles.tile}
    >
      <Animated.View
        style={[
          styles.card,
          { transform: [{ perspective: 600 }, { rotateY }] },
        ]}
      >
        <Animated.View
          style={[styles.face, styles.front, { opacity: frontOpacity }]}
        >
          <Text style={[styles.char, styles.charOff]}>{char}</Text>
          <Text style={[styles.jyutping, styles.textOff]}>{jyutping}</Text>
          <Text style={[styles.label, styles.labelOff]}>{label}</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.face,
            styles.back,
            { opacity: backOpacity, transform: [{ rotateY: '180deg' }] },
          ]}
        >
          <View style={styles.yellow} />
          <Animated.Text
            style={[
              styles.char,
              styles.charOn,
              { transform: [{ scale: inkScale }] },
            ]}
          >
            {char}
          </Animated.Text>
          <Text style={[styles.jyutping, styles.textOn]}>{jyutping}</Text>
          <Text style={[styles.label, styles.textOn]}>{label}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * An entry's moods as small yellow tiles, the character only, for rows that
 * have no room for the full picker (the Diary).
 */
export function MoodMarks({ moods }: { moods: Mood[] }) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useLanguage();
  if (!moods.length) return null;
  return (
    <View
      style={styles.marks}
      accessible
      accessibilityLabel={moods.map((m) => t(moodKey(m))).join(', ')}
    >
      {moods.map((mood) => (
        <View key={mood} style={styles.mark}>
          <Text style={styles.markChar}>{MOOD_HANZI[mood].char}</Text>
        </View>
      ))}
    </View>
  );
}

/** The system's reduce motion setting, kept in step while mounted. */
function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => active && setReduce(on))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduce,
    );
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: spacing.sm,
    },
    tile: { width: '31.5%', height: 104 },
    card: { flex: 1 },
    face: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      borderRadius: radius.md,
    },
    front: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    back: { backgroundColor: colors.background },
    // The 應 logo's tile: yellow, skewed.
    yellow: {
      ...StyleSheet.absoluteFill,
      margin: 5,
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      transform: [{ skewX: '-8deg' }],
    },
    char: { fontSize: 36, lineHeight: 42, fontWeight: '900' },
    charOff: { color: colors.textMuted },
    charOn: { color: colors.onPrimary },
    jyutping: { fontSize: 10, fontWeight: '500', letterSpacing: 0.4 },
    label: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
    },
    textOff: { color: colors.textMuted },
    labelOff: { color: colors.textSecondary },
    textOn: { color: colors.onPrimary },
    marks: { flexDirection: 'row', gap: 5 },
    mark: {
      width: 22,
      height: 22,
      borderRadius: 4,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ skewX: '-8deg' }],
    },
    markChar: {
      fontSize: 13,
      lineHeight: 16,
      fontWeight: '900',
      color: colors.onPrimary,
    },
  });
