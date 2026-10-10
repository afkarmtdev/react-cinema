/** The top shelf on the Me screen holds this many entries. */
export const MAX_FAVOURITES = 4;

export const isFavourite = (
  favourites: string[] | undefined,
  id: string,
): boolean => (favourites ?? []).includes(id);

/**
 * Adds the entry to the shelf, or takes it off if it is already there.
 * Returns null when the shelf is full and the entry is not on it, so the
 * caller can say so instead of silently dropping the tap.
 */
export function toggleFavourite(
  favourites: string[] | undefined,
  id: string,
): string[] | null {
  const current = favourites ?? [];
  if (current.includes(id)) return current.filter((x) => x !== id);
  if (current.length >= MAX_FAVOURITES) return null;
  return [...current, id];
}
