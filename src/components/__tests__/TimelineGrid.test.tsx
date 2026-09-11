import React from 'react';
import { act, render, type RenderResult } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '../../context/ThemeContext';
import { formatMonth } from '../../lib/labels';
import { TimelineGrid } from '../TimelineGrid';
import type { LibraryItem } from '../../types/library';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d).getTime();

let seq = 0;
const entry = (finishedAt: number): LibraryItem => ({
  id: `i${++seq}`,
  ownerId: 'u1',
  kind: 'film',
  title: `Entry ${seq}`,
  tags: [],
  status: 'done',
  createdAt: finishedAt,
  updatedAt: finishedAt,
  finishedAt,
});

const items = [
  entry(at(2026, 9, 7)),
  entry(at(2026, 9, 2)),
  entry(at(2026, 8, 30)),
  entry(at(2025, 3, 1)),
];

function renderGrid(zoom: 0 | 1 | 2 | 3 = 1) {
  const onZoomChange = jest.fn();
  const grid = (level: 0 | 1 | 2 | 3) => (
    <TimelineGrid
      items={items}
      zoom={level}
      onZoomChange={onZoomChange}
      renderItem={(item) => <Text>{item.title}</Text>}
    />
  );
  const utils = render(grid(zoom), { wrapper });
  /** What the parent does with a reported zoom: render the new level. */
  const setZoom = (level: 0 | 1 | 2 | 3) => utils.rerender(grid(level));
  return { ...utils, onZoomChange, setZoom };
}

/**
 * The touch history the responder system attaches to every event. The
 * responder skips a move whose timestamp it has already seen, so each
 * event gets a fresh one.
 */
let stamp = 0;
const history = (active: number) => ({
  numberActiveTouches: active,
  indexOfSingleActiveTouch: 0,
  mostRecentTimeStamp: ++stamp,
  // The responder reads one finger's track straight from the bank.
  touchBank: Array.from({ length: active }, () => ({
    touchActive: true,
    startPageX: 100,
    startPageY: 300,
    currentPageX: 100,
    currentPageY: 300,
    currentTimeStamp: stamp,
    previousPageX: 100,
    previousPageY: 300,
    previousTimeStamp: stamp - 1,
  })),
});

/** A two-finger event with the fingers `gap` points apart. */
const pinch = (gap: number) => ({
  nativeEvent: {
    touches: [
      { pageX: 100, pageY: 300 },
      { pageX: 100 + gap, pageY: 300 },
    ],
  },
  touchHistory: history(2),
});

/**
 * Delivers a responder event straight to the handler. fireEvent would first
 * ask the plain onStartShouldSetResponder, which the grid answers no to
 * (only the capture variants claim a pinch), and drop the event.
 */
function send(
  element: ReturnType<RenderResult['getByTestId']>,
  handler: 'onResponderGrant' | 'onResponderMove',
  event: ReturnType<typeof pinch>,
) {
  act(() => {
    element.props[handler](event);
  });
}

describe('TimelineGrid', () => {
  it('lays the entries out under month headers, newest first', () => {
    const utils = renderGrid(1);
    const headers = [
      formatMonth(at(2026, 9, 1)),
      formatMonth(at(2026, 8, 1)),
      formatMonth(at(2025, 3, 1)),
    ];
    for (const header of headers) expect(utils.getByText(header)).toBeTruthy();
    expect(utils.getAllByTestId('timeline-grid-cell')).toHaveLength(4);
    expect(utils.getByText('Entry 1')).toBeTruthy();
  });

  it('switches to year headers at the widest zoom', () => {
    const utils = renderGrid(3);
    expect(utils.getByText('2026')).toBeTruthy();
    expect(utils.getByText('2025')).toBeTruthy();
    expect(utils.queryByText(formatMonth(at(2026, 9, 1)))).toBeNull();
  });

  it('zooms in when two fingers spread apart', () => {
    const utils = renderGrid(1);
    const grid = utils.getByTestId('timeline-grid');
    send(grid, 'onResponderGrant', pinch(100));
    send(grid, 'onResponderMove', pinch(130));
    expect(utils.onZoomChange).not.toHaveBeenCalled();
    send(grid, 'onResponderMove', pinch(150));
    expect(utils.onZoomChange).toHaveBeenCalledWith(0);
  });

  it('zooms out when two fingers close, one level per step', () => {
    const utils = renderGrid(1);
    const grid = utils.getByTestId('timeline-grid');
    send(grid, 'onResponderGrant', pinch(200));
    send(grid, 'onResponderMove', pinch(150));
    expect(utils.onZoomChange).toHaveBeenCalledTimes(1);
    expect(utils.onZoomChange).toHaveBeenLastCalledWith(2);
    utils.setZoom(2);
    send(grid, 'onResponderMove', pinch(110));
    expect(utils.onZoomChange).toHaveBeenCalledTimes(2);
    expect(utils.onZoomChange).toHaveBeenLastCalledWith(3);
  });

  it('holds the next step until the new layout has rendered', () => {
    const utils = renderGrid(1);
    const grid = utils.getByTestId('timeline-grid');
    send(grid, 'onResponderGrant', pinch(200));
    send(grid, 'onResponderMove', pinch(150));
    // The parent has not re-rendered at level 2 yet, so no second step.
    send(grid, 'onResponderMove', pinch(110));
    expect(utils.onZoomChange).toHaveBeenCalledTimes(1);
    utils.setZoom(2);
    send(grid, 'onResponderMove', pinch(80));
    expect(utils.onZoomChange).toHaveBeenLastCalledWith(3);
  });

  it('stops at the ends of the ladder', () => {
    const utils = renderGrid(0);
    const grid = utils.getByTestId('timeline-grid');
    send(grid, 'onResponderGrant', pinch(100));
    send(grid, 'onResponderMove', pinch(200));
    expect(utils.onZoomChange).not.toHaveBeenCalled();
  });

  it('claims only a two-finger touch and leaves one finger to the list', () => {
    const utils = renderGrid(1);
    const grid = utils.getByTestId('timeline-grid');
    const single = {
      nativeEvent: { touches: [{ pageX: 100, pageY: 300 }] },
      touchHistory: history(1),
    };
    expect(grid.props.onStartShouldSetResponderCapture(single)).toBe(false);
    expect(grid.props.onMoveShouldSetResponderCapture(single)).toBe(false);
    expect(grid.props.onStartShouldSetResponderCapture(pinch(80))).toBe(true);
    expect(grid.props.onMoveShouldSetResponderCapture(pinch(80))).toBe(true);
  });
});
