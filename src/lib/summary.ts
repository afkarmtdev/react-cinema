import { clampScore } from './score';
import {
  ITEM_KINDS,
  isReadKind,
  type ItemKind,
  type LibraryItem,
} from '../types/library';

/**
 * What got finished in a stretch of time: the counts behind the "This month"
 * and "This year" cards on the Diary. An entry counts once for every finish
 * (the first one and each rewatch or reread) that falls inside the range,
 * while its status is done.
 */
export interface PeriodSummary {
  counts: Record<ItemKind, number>;
  total: number;
  /** Average of the scored entries in the range, one decimal; unset if none. */
  avgScore?: number;
  /** Minutes of films and series finished in the range. */
  minutes: number;
  /** Pages of books finished in the range. */
  pages: number;
}

/**
 * Every time a finished entry was finished, oldest first: the first finish,
 * then the rewatches or rereads. Empty when it is not done or has no date.
 */
export function finishDates(item: LibraryItem): number[] {
  if (item.status !== 'done' || item.finishedAt === undefined) return [];
  return [item.finishedAt, ...(item.repeats ?? [])].sort((a, b) => a - b);
}

/** The most recent finish, or undefined when there is none. */
export function lastFinish(item: LibraryItem): number | undefined {
  const dates = finishDates(item);
  return dates.length ? dates[dates.length - 1] : undefined;
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
  let minutes = 0;
  let pages = 0;
  for (const item of items) {
    const inRange = finishDates(item).filter((at) => at >= from && at < to);
    if (!inRange.length) continue;
    counts[item.kind] += inRange.length;
    total += inRange.length;
    // A rewatch takes the time again, so each finish adds the length.
    if (isReadKind(item.kind)) pages += (item.pages ?? 0) * inRange.length;
    else minutes += (item.runtime ?? 0) * inRange.length;
    // The score is the entry's, so it counts once however often it was seen.
    if (typeof item.rating === 'number') {
      scoreSum += item.rating;
      scored += 1;
    }
  }
  return {
    counts,
    total,
    avgScore: scored ? clampScore(scoreSum / scored) : undefined,
    minutes,
    pages,
  };
}
