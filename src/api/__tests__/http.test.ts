import { query, stripHtml, yearOf } from '../http';

describe('query', () => {
  it('encodes values and skips empty ones', () => {
    expect(query({ q: 'the thing', page: 2, key: '', y: undefined })).toBe(
      'q=the%20thing&page=2',
    );
  });
});

describe('yearOf', () => {
  it('finds the year in dates and year ranges', () => {
    expect(yearOf('2005-10-04')).toBe(2005);
    expect(yearOf('2008–2013')).toBe(2008);
    expect(yearOf('')).toBeUndefined();
    expect(yearOf(null)).toBeUndefined();
  });
});

describe('stripHtml', () => {
  it('keeps the text and paragraph breaks', () => {
    expect(
      stripHtml(
        '<p>One &amp; <i>two</i>.</p><p>Three<br/>four &#39;five&#39;</p>',
      ),
    ).toBe("One & two.\n\nThree\nfour 'five'");
  });

  it('returns undefined for nothing', () => {
    expect(stripHtml(undefined)).toBeUndefined();
    expect(stripHtml('<p></p>')).toBeUndefined();
  });
});
