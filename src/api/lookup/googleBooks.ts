import type { LookupResult, LookupSource } from '../../types/lookup';
import { getJson, query, stripHtml, yearOf } from '../http';

// Google Books, books. Free and works without a key; a key in
// EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY only raises the daily quota, which is
// otherwise shared by everyone calling without one.
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const apiKey = () => process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY ?? '';

interface GoogleVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    /** Paths such as "Fiction / Fantasy / Epic". */
    categories?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

// Cover links come back as http with a page-curl effect. Use https, which
// iOS and the web require, and drop the curl.
function cover(links?: GoogleVolume['volumeInfo']['imageLinks']) {
  const url = links?.thumbnail ?? links?.smallThumbnail;
  return url?.replace(/^http:/, 'https:').replace('&edge=curl', '');
}

function tags(categories?: string[]) {
  const names = (categories ?? []).map((c) => c.split('/').pop()!.trim());
  const unique = [...new Set(names.filter(Boolean))];
  return unique.length ? unique : undefined;
}

function toResult({ id, volumeInfo: v }: GoogleVolume): LookupResult {
  return {
    id,
    title: v.subtitle ? `${v.title}: ${v.subtitle}` : v.title,
    year: yearOf(v.publishedDate),
    creator: v.authors?.join(', '),
    description: stripHtml(v.description),
    poster: cover(v.imageLinks),
    tags: tags(v.categories),
  };
}

async function search(term: string): Promise<LookupResult[]> {
  const key = apiKey();
  const data = await getJson<{ items?: GoogleVolume[] }>(
    `${BASE_URL}?${query({ q: term, printType: 'books', maxResults: 20, key })}`,
    { secret: key },
  );
  return (data.items ?? []).map(toResult);
}

// The single-volume call has the full description and finer categories.
async function details(item: LookupResult): Promise<LookupResult> {
  const key = apiKey();
  const volume = await getJson<GoogleVolume>(
    `${BASE_URL}/${encodeURIComponent(item.id)}?${query({ key })}`,
    { secret: key },
  );
  const full = toResult(volume);
  return {
    ...full,
    description: full.description ?? item.description,
    poster: full.poster ?? item.poster,
    tags: full.tags ?? item.tags,
  };
}

export const googleBooks: LookupSource = {
  id: 'googleBooks',
  label: 'Google Books',
  kinds: ['book'],
  needsKey: false,
  isAvailable: () => true,
  search,
  details,
};
