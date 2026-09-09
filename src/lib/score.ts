/**
 * Scores run from 1.0 to 10.0 with one decimal, pizza-review style. A 10 is
 * reserved for the one perfect thing in a person's life, so the input warns
 * before letting anyone give it. The highest score you give without that
 * warning is 9.9.
 */
export const SCORE_MIN = 1;
export const SCORE_MAX = 10;
export const SCORE_ALMOST_PERFECT = 9.9;

/** Rounds to one decimal and keeps the value inside 1.0 to 10.0. */
export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return SCORE_MIN;
  const rounded = Math.round(value * 10) / 10;
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, rounded));
}

/** "8.5", "10.0": always one decimal so a column of scores lines up. */
export function formatScore(value: number): string {
  return clampScore(value).toFixed(1);
}

export const isPerfectScore = (value: number): boolean =>
  clampScore(value) === SCORE_MAX;

/** The whole part and the tenths digit, for the two-row picker. */
export function splitScore(value: number): { whole: number; tenth: number } {
  const clamped = clampScore(value);
  const whole = Math.floor(clamped);
  const tenth = Math.round((clamped - whole) * 10);
  return { whole, tenth };
}

/** Old one-to-five star ratings map onto the new scale; five stars stops at 9.9. */
export function starsToScore(stars: number): number {
  const score = clampScore(stars * 2);
  return score === SCORE_MAX ? SCORE_ALMOST_PERFECT : score;
}
