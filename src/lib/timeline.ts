import { formatMonth } from './labels';
import type { LibraryItem } from '../types/library';

/**
 * The library grid zooms the way Photos does: a pinch steps the column
 * count through this ladder, from one wide row card to a wall of tiny
 * covers. The index into it is the zoom level.
 */
export const ZOOM_COLUMNS = [1, 2, 3, 5] as const;
export type ZoomLevel = 0 | 1 | 2 | 3;
export const DEFAULT_ZOOM: ZoomLevel = 1;
export const MAX_ZOOM = (ZOOM_COLUMNS.length - 1) as ZoomLevel;

/**
 * Whether a pinch has grown enough to step off `level`. `ratio` is the
 * current finger distance over the distance when the pinch started or last
 * stepped. Fingers moving apart zoom in (fewer columns, -1); together, out
 * (+1). The step lands at the visual midpoint between the two column
 * counts (the geometric mean of their tile widths), so the grid that
 * replaces the scaled one is as close to its natural size as it can be.
 */
export function pinchStep(level: ZoomLevel, ratio: number): -1 | 0 | 1 {
  const cols = ZOOM_COLUMNS[level];
  if (level > 0 && ratio >= Math.sqrt(cols / ZOOM_COLUMNS[level - 1])) {
    return -1;
  }
  if (level < MAX_ZOOM && ratio <= Math.sqrt(cols / ZOOM_COLUMNS[level + 1])) {
    return 1;
  }
  return 0;
}

export function clampZoom(level: number): ZoomLevel {
  return Math.min(MAX_ZOOM, Math.max(0, Math.round(level))) as ZoomLevel;
}

export function isZoomLevel(value: unknown): value is ZoomLevel {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_ZOOM
  );
}

/**
 * Where an entry sits on the timeline: the day it was finished, else the
 * day it was started, else the day it was added. Backlogged reads land on
 * the day they happened instead of the day they were typed in.
 */
export function timelineDate(item: LibraryItem): number {
  return item.finishedAt ?? item.startedAt ?? item.createdAt;
}

export type Period = 'month' | 'year';

/** Zoomed right out the headers step up from months to years. */
export function periodForZoom(level: ZoomLevel): Period {
  return level === MAX_ZOOM ? 'year' : 'month';
}

export interface TimelineSection<T> {
  key: string;
  title: string;
  /** Rows of `columns` entries, the last one possibly short. */
  data: T[][];
}

/** Splits a list into rows of `size`, keeping the order. */
export function chunk<T>(list: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    rows.push(list.slice(i, i + size));
  }
  return rows;
}

/**
 * Sorts entries newest first on their timeline date and groups them into
 * month or year sections, each laid out as rows of `columns`.
 */
export function groupByPeriod<T extends LibraryItem>(
  items: T[],
  period: Period,
  columns: number,
): TimelineSection<T>[] {
  const sorted = [...items].sort((a, b) => timelineDate(b) - timelineDate(a));
  const groups: { key: string; title: string; items: T[] }[] = [];
  for (const item of sorted) {
    const at = timelineDate(item);
    const date = new Date(at);
    const year = date.getFullYear();
    const key =
      period === 'year' ? String(year) : `${year}-${date.getMonth() + 1}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({
        key,
        title: period === 'year' ? String(year) : formatMonth(at),
        items: [item],
      });
    }
  }
  return groups.map(({ key, title, items: group }) => ({
    key,
    title,
    data: chunk(group, columns),
  }));
}
