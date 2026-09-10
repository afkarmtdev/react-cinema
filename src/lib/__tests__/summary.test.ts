import { monthRange, startOfDay, summarise, yearRange } from '../summary';
import type { LibraryItem } from '../../types/library';

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d).getTime();

let seq = 0;
const done = (
  kind: LibraryItem['kind'],
  finishedAt: number,
  rating?: number,
): LibraryItem => ({
  id: `i${++seq}`,
  ownerId: 'u1',
  kind,
  title: `Entry ${seq}`,
  tags: [],
  status: 'done',
  rating,
  createdAt: finishedAt,
  updatedAt: finishedAt,
  finishedAt,
});

describe('summary ranges', () => {
  it('spans the calendar month and year around a date', () => {
    const now = new Date(2026, 8, 10, 15, 30);
    expect(monthRange(now)).toEqual([at(2026, 9, 1), at(2026, 10, 1)]);
    expect(yearRange(now)).toEqual([at(2026, 1, 1), at(2027, 1, 1)]);
  });

  it('rolls December into the next year', () => {
    expect(monthRange(new Date(2026, 11, 25))).toEqual([
      at(2026, 12, 1),
      at(2027, 1, 1),
    ]);
  });

  it('drops the time of day', () => {
    expect(startOfDay(new Date(2026, 8, 10, 23, 59))).toBe(at(2026, 9, 10));
  });
});

describe('summarise', () => {
  const items: LibraryItem[] = [
    done('book', at(2026, 9, 2), 9.2),
    done('film', at(2026, 9, 7), 8.2),
    done('series', at(2026, 8, 30), 9.6),
    done('book', at(2026, 8, 18)),
    done('film', at(2025, 12, 31), 7),
    { ...done('film', at(2026, 9, 5)), status: 'inProgress' },
    { ...done('book', at(2026, 9, 5)), finishedAt: undefined },
  ];

  it('counts finished entries per kind inside the range', () => {
    const month = summarise(items, monthRange(new Date(2026, 8, 10)));
    expect(month.counts).toEqual({ film: 1, series: 0, book: 1 });
    expect(month.total).toBe(2);
    expect(month.avgScore).toBe(8.7);
  });

  it('includes the whole year and averages only scored entries', () => {
    const year = summarise(items, yearRange(new Date(2026, 8, 10)));
    expect(year.counts).toEqual({ film: 1, series: 1, book: 2 });
    expect(year.total).toBe(4);
    // 9.2, 8.2, 9.6 scored; the August book is not.
    expect(year.avgScore).toBe(9);
  });

  it('leaves the average unset when nothing in the range is scored', () => {
    const empty = summarise(items, monthRange(new Date(2024, 0, 1)));
    expect(empty).toEqual({
      counts: { film: 0, series: 0, book: 0 },
      total: 0,
      avgScore: undefined,
    });
  });

  it('ignores entries that are not done or have no finish date', () => {
    const month = summarise(items, monthRange(new Date(2026, 8, 5)));
    expect(month.total).toBe(2);
  });
});
