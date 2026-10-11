import { googleBooks } from '../googleBooks';

function mockFetch(value: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => value,
  }) as unknown as typeof fetch;
}

const requestedUrl = () => (global.fetch as jest.Mock).mock.calls[0][0];

const volume = {
  id: 'B1hSG45JCX4C',
  volumeInfo: {
    title: 'Dune',
    subtitle: 'Deluxe Edition',
    authors: ['Frank Herbert'],
    publishedDate: '2005-08-02',
    description: '<p>Set on the desert planet Arrakis.</p>',
    categories: ['Fiction / Science Fiction / General'],
    pageCount: 896,
    imageLinks: {
      thumbnail:
        'http://books.google.com/books/content?id=B1&printsec=frontcover&img=1&zoom=1&edge=curl',
    },
  },
};

afterEach(() => {
  delete process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
  jest.restoreAllMocks();
});

describe('googleBooks', () => {
  it('works without a key', async () => {
    expect(googleBooks.isAvailable()).toBe(true);
    mockFetch({ items: [] });
    await googleBooks.search('dune', 'book');
    expect(requestedUrl()).not.toContain('key=');
  });

  it('sends the key when one is set', async () => {
    process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY = 'gb-key';
    mockFetch({ items: [] });
    await googleBooks.search('dune', 'book');
    expect(requestedUrl()).toContain('key=gb-key');
  });

  it('maps a volume, with an https cover and the last category', async () => {
    mockFetch({ items: [volume] });
    expect(await googleBooks.search('dune', 'book')).toEqual([
      {
        id: 'B1hSG45JCX4C',
        title: 'Dune: Deluxe Edition',
        year: 2005,
        creator: 'Frank Herbert',
        description: 'Set on the desert planet Arrakis.',
        poster:
          'https://books.google.com/books/content?id=B1&printsec=frontcover&img=1&zoom=1',
        tags: ['General'],
        pages: 896,
      },
    ]);
  });

  it('returns an empty list when nothing matches', async () => {
    mockFetch({ totalItems: 0 });
    expect(await googleBooks.search('zzzz', 'book')).toEqual([]);
  });

  it('fetches the single volume for details, keeping what it lacks', async () => {
    mockFetch({
      id: volume.id,
      volumeInfo: { title: 'Dune', authors: ['Frank Herbert'] },
    });
    const result = await googleBooks.details(
      {
        id: volume.id,
        title: 'Dune',
        description: 'From the search.',
        poster: 'https://cover',
      },
      'book',
    );
    expect(requestedUrl()).toContain(
      'https://www.googleapis.com/books/v1/volumes/B1hSG45JCX4C',
    );
    expect(result).toMatchObject({
      title: 'Dune',
      creator: 'Frank Herbert',
      description: 'From the search.',
      poster: 'https://cover',
    });
  });
});
