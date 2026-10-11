import {
  finishDates,
  lastFinish,
  monthRange,
  startOfDay,
  summarise,
  yearRange,
} from '../summary';
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
      minutes: 0,
      pages: 0,
    });
  });

  it('ignores entries that are not done or have no finish date', () => {
    const month = summarise(items, monthRange(new Date(2026, 8, 5)));
    expect(month.total).toBe(2);
  });

  it('counts each rewatch in the month it happened, the score once', () => {
    const film = {
      ...done('film', at(2025, 6, 1), 8),
      repeats: [at(2026, 9, 3), at(2026, 9, 20)],
      runtime: 150,
    };
    const month = summarise([film], monthRange(new Date(2026, 8, 10)));
    expect(month.counts.film).toBe(2);
    expect(month.total).toBe(2);
    expect(month.minutes).toBe(300);
    expect(month.avgScore).toBe(8);
    expect(summarise([film], yearRange(new Date(2025, 0, 1))).total).toBe(1);
  });

  it('adds up minutes for films and series and pages for books', () => {
    const month = summarise(
      [
        { ...done('film', at(2026, 9, 2)), runtime: 120 },
        { ...done('series', at(2026, 9, 4)), runtime: 600 },
        { ...done('book', at(2026, 9, 6)), pages: 412 },
        // A length that does not fit the kind is not counted.
        { ...done('book', at(2026, 9, 8)), runtime: 90 },
        { ...done('film', at(2026, 8, 1)), runtime: 100 },
      ],
      monthRange(new Date(2026, 8, 10)),
    );
    expect(month.minutes).toBe(720);
    expect(month.pages).toBe(412);
  });
});

describe('finish dates', () => {
  it('lists the first finish and the repeats, oldest first', () => {
    const item = {
      ...done('film', at(2026, 1, 5)),
      repeats: [at(2026, 9, 1), at(2026, 3, 1)],
    };
    expect(finishDates(item)).toEqual([
      at(2026, 1, 5),
      at(2026, 3, 1),
      at(2026, 9, 1),
    ]);
    expect(lastFinish(item)).toBe(at(2026, 9, 1));
  });

  it('has none for an entry that is not done', () => {
    const item = { ...done('book', at(2026, 1, 5)), status: 'want' as const };
    expect(finishDates(item)).toEqual([]);
    expect(lastFinish(item)).toBeUndefined();
  });
});
