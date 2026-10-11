import type { ItemKind } from './library';

/**
 * A record from one of the lookup sources, already mapped to the fields the
 * add form has. Search results usually carry only the title, year, and
 * poster; the rest arrives with the details call, so everything but the id
 * and title is optional and the form keeps its own value when one is missing.
 */
export interface LookupResult {
  /** The source's own id, only meaningful to that source. */
  id: string;
  title: string;
  year?: number;
  /** Director for a film, creator for a series, author for a book. */
  creator?: string;
  description?: string;
  poster?: string;
  /** Genres or subjects, offered as tags. */
  tags?: string[];
  /** Minutes: a film's running time, or every episode of a series together. */
  runtime?: number;
  /** A book's page count. */
  pages?: number;
}

export type LookupSourceId =
  | 'tmdb'
  | 'omdb'
  | 'tvmaze'
  | 'openLibrary'
  | 'googleBooks';

/** One place the add form can prefill from. */
export interface LookupSource {
  id: LookupSourceId;
  /** The service's own name. Not translated. */
  label: string;
  kinds: ItemKind[];
  /** True when the source only works with a key from .env. */
  needsKey: boolean;
  /** False when the source needs a key and none is configured. */
  isAvailable: () => boolean;
  search: (term: string, kind: ItemKind) => Promise<LookupResult[]>;
  /** The full record for a search result, merged over what the search gave. */
  details: (item: LookupResult, kind: ItemKind) => Promise<LookupResult>;
}
