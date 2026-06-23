/**
 * Shape of a movie record returned by FreeTestAPI.
 * https://freetestapi.com/api/v1/movies
 *
 * Most fields are optional because the public API is not guaranteed to return
 * every field for every record, so the UI must degrade gracefully.
 */
export interface Movie {
  id: number;
  title: string;
  year?: number;
  genre?: string[];
  rating?: number;
  director?: string;
  actors?: string[];
  plot?: string;
  poster?: string;
  trailer?: string;
  runtime?: number;
  awards?: string;
  country?: string;
  language?: string;
  boxOffice?: string;
  production?: string;
  website?: string;
}
