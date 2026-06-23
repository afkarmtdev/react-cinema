import {
  isValidEmail,
  isValidPassword,
  MIN_PASSWORD_LENGTH,
} from '../validation';

describe('isValidEmail', () => {
  it('accepts a normal email', () => {
    expect(isValidEmail('ali@example.com')).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    expect(isValidEmail('  ali@example.com  ')).toBe(true);
  });

  it('rejects a missing @', () => {
    expect(isValidEmail('aliexample.com')).toBe(false);
  });

  it('rejects a missing domain', () => {
    expect(isValidEmail('ali@')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('accepts a password of the minimum length', () => {
    expect(isValidPassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBe(true);
  });

  it('rejects a password shorter than the minimum', () => {
    expect(isValidPassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(false);
  });
});
