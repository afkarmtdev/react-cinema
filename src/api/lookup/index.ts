import type { ItemKind } from '../../types/library';
import type { LookupSource, LookupSourceId } from '../../types/lookup';
import { googleBooks } from './googleBooks';
import { omdb } from './omdb';
import { openLibrary } from './openLibrary';
import { tmdb } from './tmdb';
import { tvmaze } from './tvmaze';

/**
 * Every source the add form can prefill from, all free. The order is the
 * order of the chips in the lookup sheet, and the first available one for a
 * kind is the default until the user picks another.
 */
export const LOOKUP_SOURCES: LookupSource[] = [
  tmdb,
  tvmaze,
  omdb,
  openLibrary,
  googleBooks,
];

/** The sources that cover this kind and have the key they need, if any. */
export function sourcesFor(kind: ItemKind): LookupSource[] {
  return LOOKUP_SOURCES.filter(
    (s) => s.kinds.includes(kind) && s.isAvailable(),
  );
}

/** The saved choice when it is still on offer, otherwise the first one. */
export function pickSource(
  available: LookupSource[],
  saved?: LookupSourceId | null,
): LookupSource | undefined {
  return available.find((s) => s.id === saved) ?? available[0];
}
