import { useCallback, useEffect, useState } from 'react';
import { fetchMovieById } from '../api/movies';
import type { Movie } from '../types/movie';

// Loads a single movie by id for the detail screen.
export function useMovieDetail(id: string) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(false);

    fetchMovieById(id)
      .then((data) => {
        if (!ignore) {
          setMovie(data);
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
  }, [id, reloadKey]);

  return { movie, loading, error, refetch };
}
