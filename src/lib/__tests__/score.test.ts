import {
  clampScore,
  formatScore,
  isPerfectScore,
  splitScore,
  starsToScore,
} from '../score';

describe('score', () => {
  it('rounds to one decimal and stays between 1 and 10', () => {
    expect(clampScore(8.46)).toBe(8.5);
    expect(clampScore(0.2)).toBe(1);
    expect(clampScore(12)).toBe(10);
    expect(clampScore(Number.NaN)).toBe(1);
  });

  it('formats with one decimal', () => {
    expect(formatScore(7)).toBe('7.0');
    expect(formatScore(9.95)).toBe('10.0');
  });

  it('knows a perfect score when it sees one', () => {
    expect(isPerfectScore(10)).toBe(true);
    expect(isPerfectScore(9.9)).toBe(false);
  });

  it('splits into whole and tenth for the picker', () => {
    expect(splitScore(8.5)).toEqual({ whole: 8, tenth: 5 });
    expect(splitScore(10)).toEqual({ whole: 10, tenth: 0 });
    expect(splitScore(6.96)).toEqual({ whole: 7, tenth: 0 });
  });

  it('maps old star ratings onto the scale without handing out a 10', () => {
    expect(starsToScore(1)).toBe(2);
    expect(starsToScore(4)).toBe(8);
    expect(starsToScore(5)).toBe(9.9);
  });
});
