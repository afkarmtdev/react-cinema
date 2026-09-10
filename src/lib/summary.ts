import { clampScore } from './score';
import { ITEM_KINDS, type ItemKind, type LibraryItem } from '../types/library';

/**
 * What got finished in a stretch of time: the counts behind the "This month"
 * and "This year" cards on the Diary. An entry counts when its status is done
 * and its finish date falls inside the range.
 */
export interface PeriodSummary {
  counts: Record<ItemKind, number>;
  total: number;
  /** Average of the scored entries in the range, one decimal; unset if none. */
  avgScore?: number;
}

/** Milliseconds, half open: from is included, to is not. */
export type TimeRange = [from: number, to: number];

/** The calendar month around `now`, in local time. */
export function monthRange(now: Date): TimeRange {
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return [from.getTime(), to.getTime()];
}

/** The calendar year around `now`, in local time. */
export function yearRange(now: Date): TimeRange {
  const from = new Date(now.getFullYear(), 0, 1);
  const to = new Date(now.getFullYear() + 1, 0, 1);
  return [from.getTime(), to.getTime()];
}

/** Local midnight of the given day, so dates from the picker sort cleanly. */
export function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

export function summarise(
  items: LibraryItem[],
  [from, to]: TimeRange,
): PeriodSummary {
  const counts = Object.fromEntries(ITEM_KINDS.map((k) => [k, 0])) as Record<
    ItemKind,
    number
  >;
  let total = 0;
  let scoreSum = 0;
  let scored = 0;
  for (const item of items) {
    if (item.status !== 'done' || item.finishedAt === undefined) continue;
    if (item.finishedAt < from || item.finishedAt >= to) continue;
    counts[item.kind] += 1;
    total += 1;
    if (typeof item.rating === 'number') {
      scoreSum += item.rating;
      scored += 1;
    }
  }
  return {
    counts,
    total,
    avgScore: scored ? clampScore(scoreSum / scored) : undefined,
  };
}
