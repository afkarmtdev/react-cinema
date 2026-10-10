import { pickSource, sourcesFor } from '..';

const ids = (kind: Parameters<typeof sourcesFor>[0]) =>
  sourcesFor(kind).map((s) => s.id);

afterEach(() => {
  delete process.env.EXPO_PUBLIC_TMDB_API_KEY;
  delete process.env.EXPO_PUBLIC_OMDB_API_KEY;
});

describe('sourcesFor', () => {
  it('offers only the no-key sources when no keys are set', () => {
    expect(ids('film')).toEqual([]);
    expect(ids('series')).toEqual(['tvmaze']);
    expect(ids('book')).toEqual(['openLibrary', 'googleBooks']);
  });

  it('adds the keyed sources once their keys are set', () => {
    process.env.EXPO_PUBLIC_TMDB_API_KEY = 'a';
    process.env.EXPO_PUBLIC_OMDB_API_KEY = 'b';
    expect(ids('film')).toEqual(['tmdb', 'omdb']);
    expect(ids('series')).toEqual(['tmdb', 'tvmaze', 'omdb']);
    expect(ids('book')).toEqual(['openLibrary', 'googleBooks']);
  });
});

describe('pickSource', () => {
  const books = sourcesFor('book');

  it('uses the saved source when it is on offer', () => {
    expect(pickSource(books, 'googleBooks')?.id).toBe('googleBooks');
  });

  it('falls back to the first source otherwise', () => {
    expect(pickSource(books, 'tmdb')?.id).toBe('openLibrary');
    expect(pickSource(books, null)?.id).toBe('openLibrary');
    expect(pickSource([], 'tmdb')).toBeUndefined();
  });
});
