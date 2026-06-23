import { fetchMovies, fetchMovieById } from '../movies';

function mockFetchOnce(value: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => value,
  }) as unknown as typeof fetch;
}

describe('fetchMovies', () => {
  afterEach(() => jest.restoreAllMocks());

  it('requests the base URL when there is no search term', async () => {
    const data = [{ id: 1, title: 'A' }];
    mockFetchOnce(data);
    const result = await fetchMovies();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://freetestapi.com/api/v1/movies',
    );
    expect(result).toEqual(data);
  });

  it('appends the search query parameter (URL-encoded)', async () => {
    mockFetchOnce([]);
    await fetchMovies('toy story');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://freetestapi.com/api/v1/movies?search=toy%20story',
    );
  });

  it('normalises a non-array response to an empty array', async () => {
    mockFetchOnce({});
    expect(await fetchMovies('zzz')).toEqual([]);
  });

  it('throws when the response is not ok', async () => {
    mockFetchOnce({}, false, 500);
    await expect(fetchMovies()).rejects.toThrow('Request failed (500)');
  });
});

describe('fetchMovieById', () => {
  afterEach(() => jest.restoreAllMocks());

  it('requests the single-record endpoint', async () => {
    const movie = { id: 7, title: 'Seven' };
    mockFetchOnce(movie);
    const result = await fetchMovieById(7);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://freetestapi.com/api/v1/movies/7',
    );
    expect(result).toEqual(movie);
  });
});
