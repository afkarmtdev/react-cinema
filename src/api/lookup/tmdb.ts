import type { ItemKind } from '../../types/library';
import type { LookupResult, LookupSource } from '../../types/lookup';
import { getJson, query, yearOf } from '../http';

// The Movie Database, films and series. Free for non-commercial use with a
// key from https://www.themoviedb.org/settings/api, set as
// EXPO_PUBLIC_TMDB_API_KEY. TMDB hands out two credentials there, a short
// "API key" and a long "API Read Access Token"; either works. Their terms
// ask for a credit line, which the lookup sheet shows under the results.
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const apiKey = () => process.env.EXPO_PUBLIC_TMDB_API_KEY ?? '';

interface TmdbSearchItem {
  id: number;
  /** Films have a title and a release date, series a name and an air date. */
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
}
interface TmdbDetail extends TmdbSearchItem {
  overview?: string;
  genres?: { name: string }[];
  created_by?: { name: string }[];
  credits?: { crew?: { job: string; name: string }[] };
}

function request<T>(path: string, params: Record<string, string> = {}) {
  const key = apiKey();
  // The read access token is a JWT, so it starts like every JWT does.
  const isToken = key.startsWith('eyJ');
  const qs = query(isToken ? params : { ...params, api_key: key });
  return getJson<T>(`${BASE_URL}${path}?${qs}`, {
    secret: key,
    headers: isToken ? { Authorization: `Bearer ${key}` } : undefined,
  });
}

const pathFor = (kind: ItemKind) => (kind === 'series' ? 'tv' : 'movie');
const poster = (path?: string | null) =>
  path ? `${IMAGE_URL}${path}` : undefined;

function toResult(item: TmdbSearchItem): LookupResult {
  return {
    id: String(item.id),
    title: item.title ?? item.name ?? '',
    year: yearOf(item.release_date ?? item.first_air_date),
    poster: poster(item.poster_path),
  };
}

async function search(term: string, kind: ItemKind): Promise<LookupResult[]> {
  const data = await request<{ results?: TmdbSearchItem[] }>(
    `/search/${pathFor(kind)}`,
    { query: term, include_adult: 'false' },
  );
  return (data.results ?? []).map(toResult);
}

async function details(
  item: LookupResult,
  kind: ItemKind,
): Promise<LookupResult> {
  const d = await request<TmdbDetail>(`/${pathFor(kind)}/${item.id}`, {
    append_to_response: 'credits',
  });
  const people =
    kind === 'series'
      ? (d.created_by ?? []).map((p) => p.name)
      : (d.credits?.crew ?? [])
          .filter((p) => p.job === 'Director')
          .map((p) => p.name);
  return {
    ...toResult(d),
    creator: people.length ? people.join(', ') : undefined,
    description: d.overview || undefined,
    tags: d.genres?.map((g) => g.name),
  };
}

export const tmdb: LookupSource = {
  id: 'tmdb',
  label: 'TMDB',
  kinds: ['film', 'series'],
  needsKey: true,
  isAvailable: () => apiKey().length > 0,
  search,
  details,
};
