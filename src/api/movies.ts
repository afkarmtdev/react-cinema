import type { Movie } from '../types/movie';

const BASE_URL = 'https://freetestapi.com/api/v1/movies';

// Fetch the movie list, optionally filtered by the `search` query parameter.
export async function fetchMovies(search?: string): Promise<Movie[]> {
  const query = search?.trim();
  const url = query
    ? `${BASE_URL}?search=${encodeURIComponent(query)}`
    : BASE_URL;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);

  const data = await res.json();
  // The API normally returns an array; an empty search can come back as a
  // non-array, so guard against that before the list tries to render it.
  return Array.isArray(data) ? data : [];
}

// Fetch a single movie by its id.
export async function fetchMovieById(id: number): Promise<Movie> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}
