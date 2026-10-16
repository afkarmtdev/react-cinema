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
import { motion, radius, type ThemeColors } from '../theme';
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

  // A quarter turn to edge-on, the faces swap, then a quarter turn back, so
  // either state comes to rest flat. A tile left at 180deg (with its face
  // turned back another 180deg) looks the same but stays a 3D layer, and
  // its text is drawn blurred. Swapping at edge-on also means neither face
  // relies on backface culling, which Android and the web do not agree on.
  const rotateY = flip.interpolate({
    inputRange: [0, 0.5, 0.501, 1],
    outputRange: ['0deg', '90deg', '-90deg', '0deg'],
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
      // The jyutping has no room on a tile this size; it is read out instead.
      accessibilityLabel={`${label}, ${jyutping}`}
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
          <Text
            style={[styles.label, styles.labelOff]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {label}
          </Text>
        </Animated.View>
        <Animated.View
          style={[styles.face, styles.back, { opacity: backOpacity }]}
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
          <Text
            style={[styles.label, styles.textOn]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {label}
          </Text>
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
    // One row of six, the same rhythm as the score's row of cells above it.
    grid: { flexDirection: 'row', gap: 6 },
    tile: { flex: 1, height: 60 },
    card: { flex: 1 },
    face: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingHorizontal: 2,
      borderRadius: radius.sm,
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
      margin: 4,
      backgroundColor: colors.primary,
      borderRadius: 4,
      transform: [{ skewX: '-8deg' }],
    },
    char: { fontSize: 22, lineHeight: 26, fontWeight: '900' },
    charOff: { color: colors.textMuted },
    charOn: { color: colors.onPrimary },
    label: {
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
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
