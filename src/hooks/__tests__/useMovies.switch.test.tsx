import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useMovies } from '../useMovies';
import * as api from '../../api/movies';
import type { Movie } from '../../types/movie';

const page = (prefix: string, n: number): Movie[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}${i}`,
    title: `${prefix} ${i}`,
    year: 2020,
  }));

describe('useMovies type switch', () => {
  afterEach(() => jest.restoreAllMocks());

  it('updates the list when type goes series -> movie', async () => {
    const spy = jest
      .spyOn(api, 'fetchMovies')
      .mockImplementation(async (_s, filters) =>
        filters?.type === 'series'
          ? [{ id: 's1', title: 'A Series', year: 2020 }]
          : [{ id: 'm1', title: 'A Movie', year: 2021 }],
      );

    const { result, rerender } = renderHook(
      ({ type }) => useMovies('batman', { type }),
      { initialProps: { type: 'series' as 'movie' | 'series' } },
    );

    await waitFor(() => expect(result.current.movies[0]?.id).toBe('s1'));
    rerender({ type: 'movie' });
    await waitFor(() => expect(result.current.movies[0]?.id).toBe('m1'));
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('clears the list and flags an error when a filter change fails', async () => {
    jest.spyOn(api, 'fetchMovies').mockImplementation(async (_s, filters) => {
      if (filters?.year === '2022') {
        throw new Error("Conversion failed converting 'Cuts' to int.");
      }
      return [{ id: 'm1', title: 'A Movie', year: 2021 }];
    });

    const { result, rerender } = renderHook(
      ({ year }) => useMovies('star', { type: 'movie', year }),
      { initialProps: { year: undefined as string | undefined } },
    );

    await waitFor(() => expect(result.current.movies).toHaveLength(1));

    rerender({ year: '2022' });

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.movies).toHaveLength(0);
  });

  it('does not append a stale page from the previous type after switching', async () => {
    // A loadMore for "series" is in flight when the user switches to "movie".
    // Its late result must not be appended onto the movie list.
    let releaseSeriesPage2: (m: Movie[]) => void = () => {};
    jest.spyOn(api, 'fetchMovies').mockImplementation(
      async (_s, filters, p) => {
        if (filters?.type === 'series') {
          if (p === 1) return page('s', 10); // full page -> hasMore true
          return new Promise<Movie[]>((res) => {
            releaseSeriesPage2 = res; // page 2 stays pending
          });
        }
        return page('m', 3); // movie page 1
      },
    );

    const { result, rerender } = renderHook(
      ({ type }) => useMovies('x', { type }),
      { initialProps: { type: 'series' as 'movie' | 'series' } },
    );

    await waitFor(() => expect(result.current.movies).toHaveLength(10));

    act(() => result.current.loadMore()); // series page 2, pending
    await waitFor(() => expect(result.current.loadingMore).toBe(true));

    rerender({ type: 'movie' }); // switch while page 2 in flight
    await waitFor(() =>
      expect(result.current.movies.every((m) => m.id.startsWith('m'))).toBe(
        true,
      ),
    );

    // Now the stale series page 2 resolves.
    await act(async () => {
      releaseSeriesPage2(page('s', 10));
    });

    // The movie list must remain pure movies, no leaked series rows.
    expect(result.current.movies.every((m) => m.id.startsWith('m'))).toBe(true);
  });
});
