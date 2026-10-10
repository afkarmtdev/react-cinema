import { formatMonth } from '../labels';
import {
  MAX_ZOOM,
  ZOOM_COLUMNS,
  chunk,
  clampZoom,
  groupByPeriod,
  isZoomLevel,
  periodForZoom,
  pinchStep,
  timelineDate,
} from '../timeline';
import type { LibraryItem } from '../../types/library';

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d).getTime();

let seq = 0;
const entry = (dates: Partial<LibraryItem> = {}): LibraryItem => ({
  id: `i${++seq}`,
  ownerId: 'u1',
  kind: 'film',
  title: `Entry ${seq}`,
  tags: [],
  status: 'want',
  createdAt: at(2026, 9, 1),
  updatedAt: at(2026, 9, 1),
  ...dates,
});

describe('pinch zoom', () => {
  it('steps at the visual midpoint between two column counts', () => {
    // Two columns: one column is sqrt(2) wider, three are sqrt(2/3) as wide.
    expect(pinchStep(1, 1)).toBe(0);
    expect(pinchStep(1, 1.4)).toBe(0);
    expect(pinchStep(1, Math.SQRT2)).toBe(-1);
    expect(pinchStep(1, 0.83)).toBe(0);
    expect(pinchStep(1, Math.sqrt(2 / 3))).toBe(1);
    // Three to five columns.
    expect(pinchStep(2, Math.sqrt(3 / 5) + 0.01)).toBe(0);
    expect(pinchStep(2, Math.sqrt(3 / 5))).toBe(1);
  });

  it('has nothing to step to past either end of the ladder', () => {
    expect(pinchStep(0, 3)).toBe(0);
    expect(pinchStep(0, Math.SQRT1_2)).toBe(1);
    expect(pinchStep(MAX_ZOOM, 0.2)).toBe(0);
    expect(pinchStep(MAX_ZOOM, Math.sqrt(5 / 3))).toBe(-1);
  });

  it('keeps the level on the ladder', () => {
    expect(clampZoom(-1)).toBe(0);
    expect(clampZoom(MAX_ZOOM + 1)).toBe(MAX_ZOOM);
    expect(clampZoom(2)).toBe(2);
    expect(ZOOM_COLUMNS[clampZoom(9)]).toBe(5);
  });

  it('accepts only whole levels on the ladder when restoring', () => {
    expect(isZoomLevel(0)).toBe(true);
    expect(isZoomLevel(MAX_ZOOM)).toBe(true);
    expect(isZoomLevel(MAX_ZOOM + 1)).toBe(false);
    expect(isZoomLevel(1.5)).toBe(false);
    expect(isZoomLevel('1')).toBe(false);
    expect(isZoomLevel(null)).toBe(false);
  });

  it('shows years only at the widest zoom', () => {
    expect(periodForZoom(0)).toBe('month');
    expect(periodForZoom(1)).toBe('month');
    expect(periodForZoom(MAX_ZOOM)).toBe('year');
  });
});

describe('timelineDate', () => {
  it('prefers finished, then started, then added', () => {
    expect(
      timelineDate(
        entry({ finishedAt: at(2025, 1, 5), startedAt: at(2024, 12, 1) }),
      ),
    ).toBe(at(2025, 1, 5));
    expect(timelineDate(entry({ startedAt: at(2024, 12, 1) }))).toBe(
      at(2024, 12, 1),
    );
    expect(timelineDate(entry())).toBe(at(2026, 9, 1));
  });
});

describe('chunk', () => {
  it('splits into rows and keeps a short last row', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });
});

describe('groupByPeriod', () => {
  const items = [
    entry({ createdAt: at(2026, 8, 3) }),
    entry({ finishedAt: at(2026, 9, 7) }),
    entry({ startedAt: at(2025, 3, 1) }),
    entry({ finishedAt: at(2026, 9, 2) }),
    entry({ finishedAt: at(2026, 8, 30) }),
  ];

  it('groups by month, newest first, in rows of the column count', () => {
    const sections = groupByPeriod(items, 'month', 2);
    expect(sections.map((s) => s.title)).toEqual([
      formatMonth(at(2026, 9, 1)),
      formatMonth(at(2026, 8, 1)),
      formatMonth(at(2025, 3, 1)),
    ]);
    expect(sections[0].data).toEqual([[items[1], items[3]]]);
    expect(sections[1].data).toEqual([[items[4], items[0]]]);
    expect(sections[2].data).toEqual([[items[2]]]);
  });

  it('groups by year when asked', () => {
    const sections = groupByPeriod(items, 'year', 3);
    expect(sections.map((s) => s.title)).toEqual(['2026', '2025']);
    expect(sections[0].data).toEqual([
      [items[1], items[3], items[4]],
      [items[0]],
    ]);
  });

  it('keys sections so two Septembers do not merge', () => {
    const sections = groupByPeriod(
      [
        entry({ createdAt: at(2025, 9, 1) }),
        entry({ createdAt: at(2026, 9, 1) }),
      ],
      'month',
      2,
    );
    expect(sections.map((s) => s.key)).toEqual(['2026-9', '2025-9']);
  });

  it('returns nothing for an empty library', () => {
    expect(groupByPeriod([], 'month', 2)).toEqual([]);
  });
});
