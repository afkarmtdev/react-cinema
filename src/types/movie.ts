/**
 * Normalised movie shape the app works with, mapped from the OMDb API.
 * The id is OMDb's imdbID (e.g. "tt1375666"), so it is a string.
 *
 * Most fields are optional because OMDb does not return every field for every
 * record (and search results carry fewer fields than the detail endpoint), so
 * the UI must degrade gracefully.
 */
export interface Movie {
  id: string;
  title: string;
  year?: number;
  genre?: string[];
  rating?: number;
  director?: string;
  actors?: string[];
  plot?: string;
  poster?: string;
  runtime?: number;
}
