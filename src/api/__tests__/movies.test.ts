import { fetchMovies, fetchMovieById } from '../movies';

function mockFetch(value: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => value,
  }) as unknown as typeof fetch;
}

describe('fetchMovies', () => {
  afterEach(() => jest.restoreAllMocks());

  it('maps OMDb search results to movies', async () => {
    mockFetch({
      Response: 'True',
      Search: [
        {
          Title: 'Star Wars',
          Year: '1977',
          imdbID: 'tt0076759',
          Poster: 'https://img/x.jpg',
        },
      ],
    });
    const result = await fetchMovies('star wars');
    expect(result).toEqual([
      {
        id: 'tt0076759',
        title: 'Star Wars',
        year: 1977,
        poster: 'https://img/x.jpg',
      },
    ]);
  });

  it('puts the search term in the request URL', async () => {
    mockFetch({ Response: 'True', Search: [] });
    await fetchMovies('batman');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('s=batman'),
    );
  });

  it('uses a default query when the search box is empty', async () => {
    mockFetch({ Response: 'True', Search: [] });
    await fetchMovies('');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('s=star'),
    );
  });

  it('adds the year filter to the request URL', async () => {
    mockFetch({ Response: 'True', Search: [] });
    await fetchMovies('batman', { year: '2008' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('y=2008'),
    );
  });

  it('passes the type filter through', async () => {
    mockFetch({ Response: 'True', Search: [] });
    await fetchMovies('batman', { type: 'series' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('type=series'),
    );
  });

  it('requests the given page', async () => {
    mockFetch({ Response: 'True', Search: [] });
    await fetchMovies('star', {}, 3);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=3'),
    );
  });

  it('returns an empty list when OMDb finds nothing', async () => {
    mockFetch({ Response: 'False', Error: 'Movie not found!' });
    expect(await fetchMovies('zzzzz')).toEqual([]);
  });

  it('throws on an OMDb error such as a bad key', async () => {
    mockFetch({ Response: 'False', Error: 'Invalid API key!' });
    await expect(fetchMovies('star')).rejects.toThrow('Invalid API key!');
  });

  it('drops "N/A" poster values', async () => {
    mockFetch({
      Response: 'True',
      Search: [{ Title: 'X', Year: '2020', imdbID: 'tt1', Poster: 'N/A' }],
    });
    const [movie] = await fetchMovies('x');
    expect(movie.poster).toBeUndefined();
  });
});

describe('fetchMovieById', () => {
  afterEach(() => jest.restoreAllMocks());

  it('maps the OMDb detail record', async () => {
    mockFetch({
      Response: 'True',
      imdbID: 'tt0816692',
      Title: 'Interstellar',
      Year: '2014',
      Director: 'Christopher Nolan',
      Genre: 'Adventure, Drama, Sci-Fi',
      Actors: 'Matthew McConaughey, Anne Hathaway',
      Plot: 'A team of explorers.',
      Runtime: '169 min',
      imdbRating: '8.6',
      Poster: 'https://img/i.jpg',
    });
    const movie = await fetchMovieById('tt0816692');
    expect(movie).toEqual({
      id: 'tt0816692',
      title: 'Interstellar',
      year: 2014,
      director: 'Christopher Nolan',
      genre: ['Adventure', 'Drama', 'Sci-Fi'],
      actors: ['Matthew McConaughey', 'Anne Hathaway'],
      plot: 'A team of explorers.',
      runtime: 169,
      rating: 8.6,
      poster: 'https://img/i.jpg',
    });
  });

  it('throws when OMDb cannot find the id', async () => {
    mockFetch({ Response: 'False', Error: 'Incorrect IMDb ID.' });
    await expect(fetchMovieById('tt0')).rejects.toThrow('Incorrect IMDb ID.');
  });
});
