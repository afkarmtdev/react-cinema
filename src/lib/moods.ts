import type { Ionicons } from '@expo/vector-icons';
import { MOODS, type Mood } from '../types/library';

type IconName = keyof typeof Ionicons.glyphMap;

export const MOOD_ICON: Record<Mood, IconName> = {
  joy: 'happy-outline',
  cried: 'water-outline',
  mad: 'flame-outline',
  scared: 'skull-outline',
  moved: 'sparkles-outline',
  bored: 'bed-outline',
};

/** Translation key for a mood's name ("moodJoy"). */
export const moodKey = (mood: Mood): string =>
  `mood${mood.charAt(0).toUpperCase()}${mood.slice(1)}`;

/**
 * A stored or typed-in list back to known moods: anything else is dropped,
 * duplicates go, and the order is always that of MOODS.
 */
export function parseMoods(value: unknown): Mood[] {
  const list: unknown[] = Array.isArray(value) ? value : [];
  return MOODS.filter((mood) => list.includes(mood));
}

/** Adds the mood when it is missing, takes it off when it is there. */
export const toggleMood = (moods: Mood[], mood: Mood): Mood[] =>
  moods.includes(mood)
    ? moods.filter((m) => m !== mood)
    : parseMoods([...moods, mood]);
