import { hasTag, normaliseTag, splitTags, uniqueTags } from '../tags';

describe('tags', () => {
  it('trims and collapses whitespace', () => {
    expect(normaliseTag('  slow   burn ')).toBe('slow burn');
  });

  it('drops blanks and case-insensitive duplicates, keeping the first spelling', () => {
    expect(uniqueTags(['Horror', 'horror', '', '  ', 'Comedy'])).toEqual([
      'Horror',
      'Comedy',
    ]);
  });

  it('splits comma and newline separated input', () => {
    expect(splitTags('sci-fi, classic\nepic,')).toEqual([
      'sci-fi',
      'classic',
      'epic',
    ]);
  });

  it('matches tags regardless of case', () => {
    expect(hasTag(['Sci-Fi'], 'sci-fi')).toBe(true);
    expect(hasTag(['Sci-Fi'], 'drama')).toBe(false);
  });
});
