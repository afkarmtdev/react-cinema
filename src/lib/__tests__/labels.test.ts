import { translations, type Language } from '../../i18n/translations';
import { formatPages, formatRuntime, repeatKey } from '../labels';

/** The same lookup and {placeholder} fill as LanguageContext's t(). */
const tFor =
  (language: Language) =>
  (key: string, params: Record<string, string | number> = {}) =>
    Object.entries(params).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      translations[language][key] ?? key,
    );

const en = tFor('en');

describe('formatRuntime', () => {
  it('shows hours and minutes, dropping a zero part', () => {
    expect(formatRuntime(148, en)).toBe('2h 28m');
    expect(formatRuntime(45, en)).toBe('45m');
    expect(formatRuntime(180, en)).toBe('3h');
    expect(formatRuntime(2945.4, en)).toBe('49h 5m');
  });

  it('uses the units of the language', () => {
    expect(formatRuntime(148, tFor('ms'))).toBe('2j 28m');
  });
});

describe('formatPages', () => {
  it('says page for one and pages for more', () => {
    expect(formatPages(1, en)).toBe('1 page');
    expect(formatPages(412, en)).toBe('412 pages');
  });
});

describe('repeatKey', () => {
  it('picks rewatch wording for films and series, reread for books', () => {
    expect(repeatKey('film', 'On')).toBe('rewatchOn');
    expect(repeatKey('series', 'Log')).toBe('rewatchLog');
    expect(repeatKey('book', 'Times')).toBe('rereadTimes');
    for (const base of ['On', 'N', 'Log', 'Times']) {
      for (const kind of ['film', 'book'] as const) {
        expect(translations.en[repeatKey(kind, base)]).toBeDefined();
        expect(translations.ms[repeatKey(kind, base)]).toBeDefined();
      }
    }
  });
});
