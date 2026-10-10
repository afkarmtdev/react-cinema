import type { ItemKind } from '../../types/library';
import type { LookupResult, LookupSource } from '../../types/lookup';
import { getJson, query, yearOf } from '../http';

// OMDb API, films and series. Uses https so iOS ATS / Android cleartext rules
// don't block it. The key comes from EXPO_PUBLIC_OMDB_API_KEY (see
// .env.example). Get a free one (1,000 requests/day) at
// https://www.omdbapi.com/apikey.aspx.
const BASE_URL = 'https://www.omdbapi.com/';
const apiKey = () => process.env.EXPO_PUBLIC_OMDB_API_KEY ?? '';

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
  Writer: string;
  Plot: string;
  Genre: string;
  Poster: string;
  Response: string;
  Error?: string;
}

// OMDb returns "N/A" for missing values; treat those as absent.
const clean = (v?: string) => (!v || v === 'N/A' ? undefined : v);
const toList = (v?: string) =>
  clean(v)
    ?.split(',')
    .map((s) => s.trim());

const typeFor = (kind: ItemKind) => (kind === 'series' ? 'series' : 'movie');

async function search(term: string, kind: ItemKind): Promise<LookupResult[]> {
  const key = apiKey();
  const url = `${BASE_URL}?${query({ apikey: key, s: term, type: typeFor(kind) })}`;
  const data = await getJson<OmdbSearchResponse>(url, { secret: key });

  if (data.Response === 'False') {
    // "Movie not found!" just means no matches, which is an empty list.
    if (data.Error === 'Movie not found!') return [];
    // Other errors are genuine failures, such as a bad key or OMDb's own
    // server glitches. Surface the raw message and fail.
    console.warn('[lookup] OMDb error:', data.Error);
    throw new Error(data.Error ?? 'Search failed');
  }

  return (data.Search ?? []).map((item) => ({
    id: item.imdbID,
    title: item.Title,
    year: yearOf(item.Year),
    poster: clean(item.Poster),
  }));
}

async function details(
  item: LookupResult,
  kind: ItemKind,
): Promise<LookupResult> {
  const key = apiKey();
  const url = `${BASE_URL}?${query({ apikey: key, plot: 'full', i: item.id })}`;
  const d = await getJson<OmdbDetail>(url, { secret: key });
  if (d.Response === 'False') throw new Error(d.Error ?? 'Not found');

  return {
    id: d.imdbID,
    title: d.Title,
    year: yearOf(d.Year),
    // A series has no director in OMDb; its creators are listed as writers.
    creator:
      clean(d.Director) ?? (kind === 'series' ? clean(d.Writer) : undefined),
    description: clean(d.Plot),
    poster: clean(d.Poster) ?? item.poster,
    tags: toList(d.Genre),
  };
}

export const omdb: LookupSource = {
  id: 'omdb',
  label: 'OMDb',
  kinds: ['film', 'series'],
  needsKey: true,
  isAvailable: () => apiKey().length > 0,
  search,
  details,
};
