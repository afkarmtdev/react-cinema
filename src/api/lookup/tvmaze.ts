import type { LookupResult, LookupSource } from '../../types/lookup';
import { getJson, query, stripHtml, yearOf } from '../http';

// TVmaze, series only. Free and needs no key. The data is CC BY-SA, so the
// lookup sheet credits it under the results.
const BASE_URL = 'https://api.tvmaze.com';

interface TvmazeShow {
  id: number;
  name: string;
  premiered?: string | null;
  genres?: string[];
  summary?: string | null;
  image?: { medium?: string; original?: string } | null;
  _embedded?: { crew?: { type: string; person: { name: string } }[] };
}

function toResult(show: TvmazeShow, image?: string): LookupResult {
  return {
    id: String(show.id),
    title: show.name,
    year: yearOf(show.premiered),
    poster: image,
  };
}

async function search(term: string): Promise<LookupResult[]> {
  const data = await getJson<{ show: TvmazeShow }[]>(
    `${BASE_URL}/search/shows?${query({ q: term })}`,
  );
  return data.map(({ show }) => toResult(show, show.image?.medium));
}

async function details(item: LookupResult): Promise<LookupResult> {
  const show = await getJson<TvmazeShow>(
    `${BASE_URL}/shows/${item.id}?embed=crew`,
  );
  const creators = (show._embedded?.crew ?? [])
    .filter((c) => c.type === 'Creator')
    .map((c) => c.person.name);
  return {
    ...toResult(show, show.image?.original ?? show.image?.medium),
    creator: creators.length ? creators.join(', ') : undefined,
    description: stripHtml(show.summary),
    tags: show.genres,
  };
}

export const tvmaze: LookupSource = {
  id: 'tvmaze',
  label: 'TVmaze',
  kinds: ['series'],
  needsKey: false,
  isAvailable: () => true,
  search,
  details,
};
