import type { LookupResult, LookupSource } from '../../types/lookup';
import { getJson, query } from '../http';

// Open Library, books. Free and needs no key.
const BASE_URL = 'https://openlibrary.org';
const COVER_URL = 'https://covers.openlibrary.org/b/id';
const SEARCH_FIELDS =
  'key,title,author_name,first_publish_year,cover_i,number_of_pages_median';
/** Subjects run long and messy, so only a few short ones become tags. */
const MAX_TAGS = 3;

interface OpenLibraryDoc {
  /** The work's path, such as "/works/OL45883W". */
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  /** The middle page count across the work's editions. */
  number_of_pages_median?: number;
}
interface OpenLibraryWork {
  title?: string;
  /** A plain string on some works and a typed object on others. */
  description?: string | { value: string };
  subjects?: string[];
  covers?: number[];
}

const cover = (id: number | undefined, size: 'M' | 'L') =>
  id && id > 0 ? `${COVER_URL}/${id}-${size}.jpg` : undefined;

/**
 * Work descriptions often end with a "----------" rule followed by source
 * links, and inline links are written as [text][1]. Keep just the prose.
 */
function cleanDescription(raw?: string | { value: string }) {
  const text = typeof raw === 'string' ? raw : raw?.value;
  if (!text) return undefined;
  return (
    text
      .split(/\n-{3,}/)[0]
      .replace(/\[([^\]]+)\]\[\d+\]/g, '$1')
      .trim() || undefined
  );
}

function pickTags(subjects?: string[]) {
  const tags = (subjects ?? [])
    .filter((s) => s.length <= 24 && !s.includes(':'))
    .slice(0, MAX_TAGS);
  return tags.length ? tags : undefined;
}

async function search(term: string): Promise<LookupResult[]> {
  const data = await getJson<{ docs?: OpenLibraryDoc[] }>(
    `${BASE_URL}/search.json?${query({ q: term, fields: SEARCH_FIELDS, limit: 20 })}`,
  );
  return (data.docs ?? []).map((doc) => ({
    id: doc.key,
    title: doc.title,
    year: doc.first_publish_year,
    creator: doc.author_name?.join(', '),
    poster: cover(doc.cover_i, 'M'),
    pages: doc.number_of_pages_median || undefined,
  }));
}

// The work record has the description and subjects but names its authors
// only by id, so the author, year, and page count from the search result
// are kept.
async function details(item: LookupResult): Promise<LookupResult> {
  const work = await getJson<OpenLibraryWork>(`${BASE_URL}${item.id}.json`);
  return {
    ...item,
    title: work.title ?? item.title,
    description: cleanDescription(work.description),
    poster: cover(work.covers?.[0], 'L') ?? item.poster,
    tags: pickTags(work.subjects),
  };
}

export const openLibrary: LookupSource = {
  id: 'openLibrary',
  label: 'Open Library',
  kinds: ['book'],
  needsKey: false,
  isAvailable: () => true,
  search,
  details,
};
