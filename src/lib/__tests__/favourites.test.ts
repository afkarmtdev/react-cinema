import { MAX_FAVOURITES, isFavourite, toggleFavourite } from '../favourites';

describe('favourites', () => {
  it('adds an entry to the end of the shelf', () => {
    expect(toggleFavourite(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleFavourite(undefined, 'a')).toEqual(['a']);
  });

  it('takes an entry off when it is already there', () => {
    expect(toggleFavourite(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('refuses a fifth entry but still lets one come off', () => {
    const full = ['a', 'b', 'c', 'd'];
    expect(full).toHaveLength(MAX_FAVOURITES);
    expect(toggleFavourite(full, 'e')).toBeNull();
    expect(toggleFavourite(full, 'd')).toEqual(['a', 'b', 'c']);
  });

  it('reports membership with or without a list', () => {
    expect(isFavourite(['a'], 'a')).toBe(true);
    expect(isFavourite(['a'], 'b')).toBe(false);
    expect(isFavourite(undefined, 'a')).toBe(false);
  });
});
