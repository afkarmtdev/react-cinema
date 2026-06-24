import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMovies, type MovieFilters } from '../api/movies';
import type { Movie } from '../types/movie';

const PAGE_SIZE = 10; // OMDb returns 10 results per page.

// Loads the movie list for the given (debounced) search term and filters, with
// page-by-page loading for infinite scroll.
export function useMovies(search: string, filters: MovieFilters = {}) {
  const { year, type } = filters;
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true); // first page
  const [loadingMore, setLoadingMore] = useState(false); // later pages
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const pageRef = useRef(1);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  // Load page 1 whenever the search term or filters change.
  useEffect(() => {
    let ignore = false;
    pageRef.current = 1;
    setLoading(true);
    setError(false);
    setHasMore(false);

    fetchMovies(search, { year, type }, 1)
      .then((data) => {
        if (ignore) return;
        setMovies(data);
        setHasMore(data.length === PAGE_SIZE); // a full page means there may be more
        setLoading(false);
      })
      .catch(() => {
        if (ignore) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [search, year, type, reloadKey]);

  // Fetch the next page and append it (called when the list nears its end).
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = pageRef.current + 1;
    setLoadingMore(true);

    fetchMovies(search, { year, type }, nextPage)
      .then((data) => {
        pageRef.current = nextPage;
        setMovies((prev) => [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
        setLoadingMore(false);
      })
      .catch(() => {
        setHasMore(false);
        setLoadingMore(false);
      });
  }, [search, year, type, loading, loadingMore, hasMore]);

  return { movies, loading, loadingMore, error, hasMore, refetch, loadMore };
}
