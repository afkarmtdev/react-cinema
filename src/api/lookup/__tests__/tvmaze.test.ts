import { tvmaze } from '../tvmaze';

function mockFetch(value: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => value,
  }) as unknown as typeof fetch;
}

const requestedUrl = () => (global.fetch as jest.Mock).mock.calls[0][0];

afterEach(() => jest.restoreAllMocks());

describe('tvmaze', () => {
  it('is always available, since it needs no key', () => {
    expect(tvmaze.isAvailable()).toBe(true);
    expect(tvmaze.kinds).toEqual(['series']);
  });

  it('maps search results', async () => {
    mockFetch([
      {
        score: 0.9,
        show: {
          id: 169,
          name: 'Breaking Bad',
          premiered: '2008-01-20',
          image: { medium: 'https://tvm/m.jpg', original: 'https://tvm/o.jpg' },
        },
      },
      {
        score: 0.5,
        show: { id: 2, name: 'No Image', premiered: null, image: null },
      },
    ]);
    expect(await tvmaze.search('breaking bad', 'series')).toEqual([
      {
        id: '169',
        title: 'Breaking Bad',
        year: 2008,
        poster: 'https://tvm/m.jpg',
      },
      { id: '2', title: 'No Image', year: undefined, poster: undefined },
    ]);
    expect(requestedUrl()).toBe(
      'https://api.tvmaze.com/search/shows?q=breaking%20bad',
    );
  });

  it('maps the details with creators and a plain-text summary', async () => {
    mockFetch({
      id: 169,
      name: 'Breaking Bad',
      premiered: '2008-01-20',
      genres: ['Drama', 'Crime'],
      summary:
        '<p><b>Breaking Bad</b> follows a teacher &amp; his partner.</p>',
      image: { medium: 'https://tvm/m.jpg', original: 'https://tvm/o.jpg' },
      averageRuntime: 50,
      _embedded: {
        crew: [
          { type: 'Creator', person: { name: 'Vince Gilligan' } },
          { type: 'Executive Producer', person: { name: 'Mark Johnson' } },
        ],
        episodes: [{ runtime: 58 }, { runtime: 48 }, { runtime: null }],
      },
    });
    const result = await tvmaze.details({ id: '169', title: 'x' }, 'series');
    expect(requestedUrl()).toBe(
      'https://api.tvmaze.com/shows/169?embed[]=crew&embed[]=episodes',
    );
    expect(result).toEqual({
      id: '169',
      title: 'Breaking Bad',
      year: 2008,
      poster: 'https://tvm/o.jpg',
      creator: 'Vince Gilligan',
      description: 'Breaking Bad follows a teacher & his partner.',
      tags: ['Drama', 'Crime'],
      // The episode without a length counts as the average.
      runtime: 156,
    });
  });
});
