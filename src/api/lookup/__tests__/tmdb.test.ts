import { tmdb } from '../tmdb';

function mockFetch(value: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 401,
    json: async () => value,
  }) as unknown as typeof fetch;
}

const call = () => (global.fetch as jest.Mock).mock.calls[0];

beforeEach(() => {
  process.env.EXPO_PUBLIC_TMDB_API_KEY = 'tmdb-key';
});
afterEach(() => {
  delete process.env.EXPO_PUBLIC_TMDB_API_KEY;
  jest.restoreAllMocks();
});

describe('tmdb.search', () => {
  it('maps film results and builds the poster link', async () => {
    mockFetch({
      results: [
        {
          id: 27205,
          title: 'Inception',
          release_date: '2010-07-15',
          poster_path: '/abc.jpg',
        },
        { id: 1, title: 'No Poster', release_date: '', poster_path: null },
      ],
    });
    expect(await tmdb.search('inception', 'film')).toEqual([
      {
        id: '27205',
        title: 'Inception',
        year: 2010,
        poster: 'https://image.tmdb.org/t/p/w500/abc.jpg',
      },
      { id: '1', title: 'No Poster', year: undefined, poster: undefined },
    ]);
    expect(call()[0]).toContain('/search/movie?');
    expect(call()[0]).toContain('query=inception');
    expect(call()[0]).toContain('api_key=tmdb-key');
  });

  it('searches series by name and air date', async () => {
    mockFetch({
      results: [
        { id: 1396, name: 'Breaking Bad', first_air_date: '2008-01-20' },
      ],
    });
    const [result] = await tmdb.search('breaking bad', 'series');
    expect(call()[0]).toContain('/search/tv?');
    expect(result).toMatchObject({ title: 'Breaking Bad', year: 2008 });
  });

  it('sends a read access token as a Bearer header instead', async () => {
    process.env.EXPO_PUBLIC_TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.token';
    mockFetch({ results: [] });
    await tmdb.search('x', 'film');
    expect(call()[0]).not.toContain('api_key');
    expect(call()[1].headers).toEqual({
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.token',
    });
  });

  it('throws when TMDB rejects the key', async () => {
    mockFetch({ status_message: 'Invalid API key' }, false);
    await expect(tmdb.search('x', 'film')).rejects.toThrow('401');
  });
});

describe('tmdb.details', () => {
  it('takes the director from the film credits', async () => {
    mockFetch({
      id: 27205,
      title: 'Inception',
      release_date: '2010-07-15',
      poster_path: '/abc.jpg',
      overview: 'Dreams within dreams.',
      genres: [{ name: 'Action' }, { name: 'Science Fiction' }],
      credits: {
        crew: [
          { job: 'Producer', name: 'Emma Thomas' },
          { job: 'Director', name: 'Christopher Nolan' },
        ],
      },
    });
    const result = await tmdb.details({ id: '27205', title: 'x' }, 'film');
    expect(call()[0]).toContain('/movie/27205?');
    expect(call()[0]).toContain('append_to_response=credits');
    expect(result).toEqual({
      id: '27205',
      title: 'Inception',
      year: 2010,
      poster: 'https://image.tmdb.org/t/p/w500/abc.jpg',
      creator: 'Christopher Nolan',
      description: 'Dreams within dreams.',
      tags: ['Action', 'Science Fiction'],
    });
  });

  it('takes the creators of a series', async () => {
    mockFetch({
      id: 1396,
      name: 'Breaking Bad',
      first_air_date: '2008-01-20',
      overview: '',
      created_by: [{ name: 'Vince Gilligan' }],
    });
    const result = await tmdb.details({ id: '1396', title: 'x' }, 'series');
    expect(call()[0]).toContain('/tv/1396?');
    expect(result.creator).toBe('Vince Gilligan');
    expect(result.description).toBeUndefined();
  });
});

describe('tmdb.isAvailable', () => {
  it('needs a key', () => {
    expect(tmdb.isAvailable()).toBe(true);
    delete process.env.EXPO_PUBLIC_TMDB_API_KEY;
    expect(tmdb.isAvailable()).toBe(false);
  });
});
