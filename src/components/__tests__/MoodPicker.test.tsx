import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { LanguageProvider } from '../../context/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { MoodMarks, MoodPicker } from '../MoodPicker';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>
    <ThemeProvider>{children}</ThemeProvider>
  </LanguageProvider>
);

describe('MoodPicker', () => {
  it('shows a tile per mood, marking the picked ones', async () => {
    const { findByLabelText, getAllByRole } = render(
      <MoodPicker value={['cried']} onChange={() => {}} />,
      { wrapper },
    );
    const cried = await findByLabelText('Cried');
    expect(getAllByRole('button')).toHaveLength(6);
    expect(cried.props.accessibilityState).toEqual({ selected: true });
    expect((await findByLabelText('Joy')).props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('adds and removes moods in the fixed order', async () => {
    const onChange = jest.fn();
    const { findByLabelText } = render(
      <MoodPicker value={['mad']} onChange={onChange} />,
      { wrapper },
    );
    fireEvent.press(await findByLabelText('Joy'));
    expect(onChange).toHaveBeenLastCalledWith(['joy', 'mad']);
    fireEvent.press(await findByLabelText('Mad'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('shows the characters as marks, and nothing without moods', async () => {
    const { findByLabelText, getByText } = render(
      <MoodMarks moods={['cried', 'moved']} />,
      { wrapper },
    );
    expect(await findByLabelText('Cried, Moved')).toBeTruthy();
    expect(getByText('哭')).toBeTruthy();
    expect(render(<MoodMarks moods={[]} />, { wrapper }).toJSON()).toBeNull();
  });
});
