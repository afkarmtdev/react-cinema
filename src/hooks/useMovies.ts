import { useCallback, useEffect, useState } from 'react';
import { fetchMovies } from '../api/movies';
import type { Movie } from '../types/movie';

// Loads the movie list for the given (debounced) search term.
export function useMovies(search: string) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    // If the search term changes before this request finishes, ignore the old
    // result so only the latest query updates the list.
    let ignore = false;
    setLoading(true);
    setError(false);

    fetchMovies(search)
      .then((data) => {
        if (!ignore) {
          setMovies(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [search, reloadKey]);

  return { movies, loading, error, refetch };
}
