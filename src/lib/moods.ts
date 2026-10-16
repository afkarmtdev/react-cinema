import { MOODS, type Mood } from '../types/library';

/**
 * Each mood as a spoken-Cantonese character with its jyutping, the same
 * language as the 應 in the logo. They are the same in every app language;
 * the translated name sits under them.
 */
export const MOOD_HANZI: Record<Mood, { char: string; jyutping: string }> = {
  joy: { char: '喜', jyutping: 'hei2' },
  cried: { char: '哭', jyutping: 'huk1' },
  // 嬲, not the written 怒: it is the word people actually say for angry.
  mad: { char: '嬲', jyutping: 'nau1' },
  scared: { char: '驚', jyutping: 'geng1' },
  moved: { char: '感', jyutping: 'gam2' },
  bored: { char: '悶', jyutping: 'mun6' },
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
