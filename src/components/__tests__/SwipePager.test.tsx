import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '../../context/ThemeContext';
import { SwipePager } from '../SwipePager';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const pages = [
  { key: 'all', label: 'All' },
  { key: 'film', label: 'Films' },
  { key: 'book', label: 'Books' },
];

function renderPager(index = 0) {
  const onIndexChange = jest.fn();
  const utils = render(
    <SwipePager
      pages={pages}
      index={index}
      onIndexChange={onIndexChange}
      renderPage={(page) => <Text>{`page ${page.key}`}</Text>}
    />,
    { wrapper },
  );
  return { ...utils, onIndexChange };
}

/** Gives the pager a width, which is what makes it mount its pages. */
function layout(utils: ReturnType<typeof renderPager>, width = 300) {
  fireEvent(utils.getByTestId('swipe-pager-scroll'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width, height: 500 } },
  });
}

describe('SwipePager', () => {
  it('renders one tab per page and marks the active one', () => {
    const utils = renderPager(1);
    expect(utils.getAllByRole('tab')).toHaveLength(3);
    expect(
      utils.getByRole('tab', { name: 'Films', selected: true }),
    ).toBeTruthy();
  });

  it('mounts every page once it knows its width', () => {
    const utils = renderPager();
    expect(utils.queryByText('page all')).toBeNull();
    layout(utils);
    expect(utils.getByText('page all')).toBeTruthy();
    expect(utils.getByText('page film')).toBeTruthy();
    expect(utils.getByText('page book')).toBeTruthy();
  });

  it('reports the tapped tab', () => {
    const utils = renderPager();
    fireEvent.press(utils.getByRole('tab', { name: 'Books' }));
    expect(utils.onIndexChange).toHaveBeenCalledWith(2);
  });

  it('reports the page a swipe settles on', () => {
    const utils = renderPager();
    layout(utils, 300);
    fireEvent(utils.getByTestId('swipe-pager-scroll'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 600 } },
    });
    expect(utils.onIndexChange).toHaveBeenCalledWith(2);
  });

  it('ignores an offset between two pages', () => {
    const utils = renderPager();
    layout(utils, 300);
    fireEvent(utils.getByTestId('swipe-pager-scroll'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 150 } },
    });
    expect(utils.onIndexChange).not.toHaveBeenCalled();
  });
});
