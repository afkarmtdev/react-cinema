import { openLibrary } from '../openLibrary';

function mockFetch(value: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => value,
  }) as unknown as typeof fetch;
}

const requestedUrl = () => (global.fetch as jest.Mock).mock.calls[0][0];

afterEach(() => jest.restoreAllMocks());

describe('openLibrary', () => {
  it('is always available for books, since it needs no key', () => {
    expect(openLibrary.isAvailable()).toBe(true);
    expect(openLibrary.kinds).toEqual(['book']);
  });

  it('maps search results with the author and cover', async () => {
    mockFetch({
      docs: [
        {
          key: '/works/OL82563W',
          title: 'Dune',
          author_name: ['Frank Herbert'],
          first_publish_year: 1965,
          cover_i: 12345,
          number_of_pages_median: 412,
        },
        { key: '/works/OL1W', title: 'No Cover' },
      ],
    });
    expect(await openLibrary.search('dune', 'book')).toEqual([
      {
        id: '/works/OL82563W',
        title: 'Dune',
        year: 1965,
        creator: 'Frank Herbert',
        poster: 'https://covers.openlibrary.org/b/id/12345-M.jpg',
        pages: 412,
      },
      {
        id: '/works/OL1W',
        title: 'No Cover',
        year: undefined,
        creator: undefined,
        poster: undefined,
      },
    ]);
    expect(requestedUrl()).toContain(
      'https://openlibrary.org/search.json?q=dune',
    );
  });

  it('adds the description, a larger cover, and a few short subjects', async () => {
    mockFetch({
      title: 'Dune',
      description: {
        type: '/type/text',
        value:
          'A [desert planet][1] story.\n\n----------\nAlso contained in: [1]: https://x',
      },
      subjects: [
        'Science fiction',
        'nyt:hardcover-fiction=2021',
        'Fiction, science fiction, general',
        'Ecology',
        'Deserts',
        'Politics',
      ],
      covers: [999],
    });
    const result = await openLibrary.details(
      {
        id: '/works/OL82563W',
        title: 'Dune',
        year: 1965,
        creator: 'Frank Herbert',
        pages: 412,
      },
      'book',
    );
    expect(requestedUrl()).toBe('https://openlibrary.org/works/OL82563W.json');
    expect(result).toEqual({
      id: '/works/OL82563W',
      title: 'Dune',
      year: 1965,
      creator: 'Frank Herbert',
      pages: 412,
      description: 'A desert planet story.',
      poster: 'https://covers.openlibrary.org/b/id/999-L.jpg',
      tags: ['Science fiction', 'Ecology', 'Deserts'],
    });
  });

  it('reads a description given as a plain string', async () => {
    mockFetch({ description: 'Just text.' });
    const result = await openLibrary.details(
      { id: '/works/OL1W', title: 'X' },
      'book',
    );
    expect(result.description).toBe('Just text.');
    expect(result.tags).toBeUndefined();
  });
});
