import { moodKey, parseMoods, toggleMood } from '../moods';

describe('moods', () => {
  it('keeps known moods once each, in the fixed order', () => {
    expect(parseMoods(['mad', 'joy', 'mad', 'angry', 3, null])).toEqual([
      'joy',
      'mad',
    ]);
    expect(parseMoods(null)).toEqual([]);
    expect(parseMoods('joy')).toEqual([]);
  });

  it('toggles a mood on and off', () => {
    expect(toggleMood(['mad'], 'joy')).toEqual(['joy', 'mad']);
    expect(toggleMood(['joy', 'mad'], 'joy')).toEqual(['mad']);
  });

  it('names the translation key', () => {
    expect(moodKey('cried')).toBe('moodCried');
  });
});
