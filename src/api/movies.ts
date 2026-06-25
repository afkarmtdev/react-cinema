import type { Movie } from '../types/movie';

// OMDb API. Uses https so iOS ATS / Android cleartext rules don't block it.
// The key comes from EXPO_PUBLIC_OMDB_API_KEY (see .env.example). Get a free
// one (1,000 requests/day) at https://www.omdbapi.com/apikey.aspx.
const BASE_URL = 'https://www.omdbapi.com/';
const API_KEY = process.env.EXPO_PUBLIC_OMDB_API_KEY ?? '';
// OMDb only searches by a term, so the empty home screen uses a default query.
const DEFAULT_QUERY = 'star';
const TIMEOUT_MS = 10000;

interface OmdbSearchItem {
  Title: string;
  Year: string;
  imdbID: string;
  Poster: string;
}
interface OmdbSearchResponse {
  Search?: OmdbSearchItem[];
  Response: string;
  Error?: string;
}
interface OmdbDetail {
  imdbID: string;
  Title: string;
  Year: string;
  Director: string;
  Plot: string;
  Genre: string;
  Actors: string;
  Runtime: string;
  imdbRating: string;
  Poster: string;
  Response: string;
  Error?: string;
}

// Rejects after a delay so a hung request fails instead of loading forever.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Request timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Single request point, with a timeout and step-by-step logging (visible in the
// Metro terminal). The key is masked in the log.
async function getJson<T>(url: string): Promise<T> {
  console.log('[movies] GET', API_KEY ? url.replace(API_KEY, '***') : url);
  const res = await withTimeout(fetch(url), TIMEOUT_MS);
  console.log('[movies] status', res.status, 'ok:', res.ok);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

// OMDb returns "N/A" for missing values; treat those as absent.
const clean = (v?: string) => (!v || v === 'N/A' ? undefined : v);
const toInt = (v?: string) => {
  const c = clean(v);
  if (!c) return undefined;
  const n = parseInt(c, 10);
  return Number.isNaN(n) ? undefined : n;
};
const toList = (v?: string) =>
  clean(v)
    ?.split(',')
    .map((s) => s.trim());

// Filters OMDb can actually apply on a search (the only two it supports).
export interface MovieFilters {
  year?: string;
  type?: 'movie' | 'series';
}

// Fetch one page of the movie list (OMDb returns 10 results per page). An empty
// search box falls back to a default query so the home screen is never blank.
// `year` and `type` map to OMDb's y= and type= parameters.
export async function fetchMovies(
  search?: string,
  filters: MovieFilters = {},
  page = 1,
): Promise<Movie[]> {
  const query = search?.trim() || DEFAULT_QUERY;
  let url = `${BASE_URL}?apikey=${API_KEY}&page=${page}&s=${encodeURIComponent(query)}`;
  // type is optional in OMDb: omit it to return all types (movies and series).
  if (filters.type) {
    url += `&type=${filters.type}`;
  }
  if (filters.year && /^\d{4}$/.test(filters.year)) {
    url += `&y=${filters.year}`;
  }
  const data = await getJson<OmdbSearchResponse>(url);

  if (data.Response === 'False') {
    // "Movie not found!" just means no matches, which is an empty list.
    if (data.Error === 'Movie not found!') {
      console.log('[movies] received 0 items (no matches for', `"${query}")`);
      return [];
    }
    // Other errors are genuine failures, including OMDb's own server glitches
    // on some search/year/type combos. Surface the raw message and fail.
    console.warn('[movies] OMDb error:', data.Error);
    throw new Error(data.Error ?? 'Search failed');
  }

  const results = data.Search ?? [];
  console.log('[movies] received', results.length, 'items');
  return results.map((item) => ({
    id: item.imdbID,
    title: item.Title,
    year: toInt(item.Year),
    poster: clean(item.Poster),
  }));
}

// Fetch a single movie (full details) by its imdb id.
export async function fetchMovieById(id: string): Promise<Movie> {
  const url = `${BASE_URL}?apikey=${API_KEY}&plot=full&i=${encodeURIComponent(id)}`;
  const d = await getJson<OmdbDetail>(url);
  if (d.Response === 'False') throw new Error(d.Error ?? 'Movie not found');

  return {
    id: d.imdbID,
    title: d.Title,
    year: toInt(d.Year),
    director: clean(d.Director),
    plot: clean(d.Plot),
    genre: toList(d.Genre),
    actors: toList(d.Actors),
    runtime: toInt(d.Runtime),
    rating: clean(d.imdbRating) ? parseFloat(d.imdbRating) : undefined,
    poster: clean(d.Poster),
  };
}
