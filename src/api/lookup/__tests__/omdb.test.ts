import { omdb } from '../omdb';

function mockFetch(value: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => value,
  }) as unknown as typeof fetch;
}

const requestedUrl = () => (global.fetch as jest.Mock).mock.calls[0][0];

beforeEach(() => {
  process.env.EXPO_PUBLIC_OMDB_API_KEY = 'omdb-key';
});
afterEach(() => {
  delete process.env.EXPO_PUBLIC_OMDB_API_KEY;
  jest.restoreAllMocks();
});

describe('omdb.search', () => {
  it('maps search results', async () => {
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
    expect(await omdb.search('star wars', 'film')).toEqual([
      {
        id: 'tt0076759',
        title: 'Star Wars',
        year: 1977,
        poster: 'https://img/x.jpg',
      },
    ]);
  });

  it('sends the term, the key, and the type for the kind', async () => {
    mockFetch({ Response: 'True', Search: [] });
    await omdb.search('breaking bad', 'series');
    expect(requestedUrl()).toContain('s=breaking%20bad');
    expect(requestedUrl()).toContain('apikey=omdb-key');
    expect(requestedUrl()).toContain('type=series');
  });

  it('searches films as movies', async () => {
    mockFetch({ Response: 'True', Search: [] });
    await omdb.search('alien', 'film');
    expect(requestedUrl()).toContain('type=movie');
  });

  it('returns an empty list when OMDb finds nothing', async () => {
    mockFetch({ Response: 'False', Error: 'Movie not found!' });
    expect(await omdb.search('zzzz', 'film')).toEqual([]);
  });

  it('throws on an OMDb error such as a bad key', async () => {
    mockFetch({ Response: 'False', Error: 'Invalid API key!' });
    await expect(omdb.search('star', 'film')).rejects.toThrow(
      'Invalid API key!',
    );
  });

  it('drops "N/A" poster values', async () => {
    mockFetch({
      Response: 'True',
      Search: [{ Title: 'X', Year: '2000', imdbID: 'tt1', Poster: 'N/A' }],
    });
    const [result] = await omdb.search('x', 'film');
    expect(result.poster).toBeUndefined();
  });
});

describe('omdb.details', () => {
  const detail = {
    Response: 'True',
    imdbID: 'tt1375666',
    Title: 'Inception',
    Year: '2010',
    Director: 'Christopher Nolan',
    Writer: 'Christopher Nolan',
    Plot: 'A thief who steals corporate secrets.',
    Genre: 'Action, Sci-Fi',
    Poster: 'https://img/inception.jpg',
    Runtime: '148 min',
  };

  it('maps the detail record to the form fields', async () => {
    mockFetch(detail);
    const result = await omdb.details(
      { id: 'tt1375666', title: 'Inception' },
      'film',
    );
    expect(requestedUrl()).toContain('i=tt1375666');
    expect(result).toEqual({
      id: 'tt1375666',
      title: 'Inception',
      year: 2010,
      creator: 'Christopher Nolan',
      description: 'A thief who steals corporate secrets.',
      poster: 'https://img/inception.jpg',
      tags: ['Action', 'Sci-Fi'],
      runtime: 148,
    });
  });

  it('uses the writers as creators for a series', async () => {
    mockFetch({ ...detail, Director: 'N/A', Writer: 'Vince Gilligan' });
    const result = await omdb.details({ id: 'tt1', title: 'X' }, 'series');
    expect(result.creator).toBe('Vince Gilligan');
    // One episode's length is no use as the whole series.
    expect(result.runtime).toBeUndefined();
  });

  it('throws when OMDb cannot find the id', async () => {
    mockFetch({ Response: 'False', Error: 'Incorrect IMDb ID.' });
    await expect(
      omdb.details({ id: 'bad', title: 'X' }, 'film'),
    ).rejects.toThrow('Incorrect IMDb ID.');
  });
});

describe('omdb.isAvailable', () => {
  it('needs a key', () => {
    expect(omdb.isAvailable()).toBe(true);
    delete process.env.EXPO_PUBLIC_OMDB_API_KEY;
    expect(omdb.isAvailable()).toBe(false);
  });
});
