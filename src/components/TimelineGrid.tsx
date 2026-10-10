import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Animated,
  PanResponder,
  SectionList,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type GestureResponderHandlers,
  type NativeTouchEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import {
  DEFAULT_ZOOM,
  ZOOM_COLUMNS,
  clampZoom,
  groupByPeriod,
  periodForZoom,
  pinchStep,
  type TimelineSection,
  type ZoomLevel,
} from '../lib/timeline';
import { motion, spacing, typography, type ThemeColors } from '../theme';
import type { LibraryItem } from '../types/library';

interface TimelineGridProps<T extends LibraryItem> {
  items: T[];
  zoom: ZoomLevel;
  /** Called when a pinch steps the zoom, one level at a time. */
  onZoomChange: (zoom: ZoomLevel) => void;
  renderItem: (item: T) => ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  ListEmptyComponent?: ReactElement | null;
  testID?: string;
}

/** Space around each cell at each zoom level, tighter as the tiles shrink. */
const GUTTER: Record<ZoomLevel, number> = { 0: 4, 1: 8, 2: 5, 3: 2 };

/** How far past the ends of the ladder the grid stretches before settling. */
const MIN_STRETCH = 0.7;
const MAX_STRETCH = 1.45;

const distance = (touches: NativeTouchEvent[]) =>
  Math.hypot(
    touches[0].pageX - touches[1].pageX,
    touches[0].pageY - touches[1].pageY,
  );

const isPinch = (event: GestureResponderEvent) =>
  event.nativeEvent.touches.length >= 2;

interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PinchEvents {
  onZoom(level: ZoomLevel): void;
  onPinching(pinching: boolean): void;
  /**
   * The grid as it should look right now: scaled by `scale` around the
   * point the fingers landed on, which the translation keeps in place.
   */
  onTransform(scale: number, translateX: number, translateY: number): void;
  /** The fingers lifted; the grid should ease back to its natural size. */
  onRelease(): void;
}

interface Transform {
  scale: number;
  x: number;
  y: number;
}

interface PinchResponder {
  panHandlers: GestureResponderHandlers;
  update(zoom: ZoomLevel, events: PinchEvents): void;
  /** Where the grid sits in the window, for the focal point. */
  setFrame(frame: Frame): void;
  /**
   * The grid has re-rendered at `zoom`. Returns the transform that was
   * held back for that layout, if any, and whether the fingers already
   * lifted while it was waiting.
   */
  commit(zoom: ZoomLevel): { transform: Transform; released: boolean } | null;
}

/**
 * The pinch state machine, kept outside React so the responder closures
 * hold plain fields rather than refs. Only a two-finger touch is claimed;
 * one finger scrolls the list as usual.
 *
 * The grid follows the fingers continuously. When the finger distance
 * crosses the midpoint between two column counts the level steps and the
 * scale is rebased so the new layout appears at exactly the size the old
 * one was showing: a change of layout, not of size, and nothing jumps. A
 * long pinch walks through several levels this way.
 *
 * The rebased scale is not applied straight away. The new layout takes a
 * frame or two to render, and the old one at the new scale would show as
 * a blip. It is held as `pending` until the component reports the new
 * layout committed, and applied in the same frame.
 */
function createPinchResponder(): PinchResponder {
  let zoom: ZoomLevel = DEFAULT_ZOOM;
  let frame: Frame = { x: 0, y: 0, width: 0, height: 0 };
  let events: PinchEvents = {
    onZoom: () => {},
    onPinching: () => {},
    onTransform: () => {},
    onRelease: () => {},
  };
  // Finger distance at the start of the pinch or the last step, the
  // scale the grid was showing at that moment, and where the fingers
  // landed, in window coordinates.
  let base: number | null = null;
  let factor = 1;
  let focalX = 0;
  let focalY = 0;
  let pending: {
    zoom: ZoomLevel;
    transform: Transform;
    released: boolean;
  } | null = null;

  const begin = (touches: NativeTouchEvent[]) => {
    base = distance(touches);
    factor = 1;
    focalX = (touches[0].pageX + touches[1].pageX) / 2;
    focalY = (touches[0].pageY + touches[1].pageY) / 2;
  };

  // Scaling happens around the grid's centre, so shift it by however far
  // that moves the focal point, and the tiles under the fingers stay
  // under the fingers.
  const transformFor = (scale: number): Transform => {
    const dx = focalX - frame.x - frame.width / 2;
    const dy = focalY - frame.y - frame.height / 2;
    return { scale, x: dx * (1 - scale), y: dy * (1 - scale) };
  };

  const end = () => {
    base = null;
    factor = 1;
    events.onPinching(false);
    // If a layout change is still on its way, the settle waits for it.
    if (pending) pending.released = true;
    else events.onRelease();
  };

  const responder = PanResponder.create({
    onStartShouldSetPanResponderCapture: isPinch,
    onMoveShouldSetPanResponderCapture: isPinch,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (event) => {
      const { touches } = event.nativeEvent;
      if (touches.length >= 2) begin(touches);
      else base = null;
      events.onPinching(true);
    },
    onPanResponderMove: (event) => {
      const { touches } = event.nativeEvent;
      if (touches.length < 2) return;
      if (base === null) {
        begin(touches);
        return;
      }
      const now = distance(touches);
      // No further step while the last layout change is still rendering.
      const next = pending
        ? zoom
        : clampZoom(zoom + pinchStep(zoom, now / base));
      const stepped = next !== zoom;
      if (stepped) {
        factor *= (now / base) * (ZOOM_COLUMNS[next] / ZOOM_COLUMNS[zoom]);
        base = now;
        zoom = next;
      }
      const scale = Math.min(
        MAX_STRETCH,
        Math.max(MIN_STRETCH, (now / base) * factor),
      );
      const transform = transformFor(scale);
      if (pending) {
        pending.transform = transform;
      } else if (stepped) {
        pending = { zoom, transform, released: false };
        events.onZoom(zoom);
      } else {
        events.onTransform(transform.scale, transform.x, transform.y);
      }
    },
    onPanResponderRelease: end,
    onPanResponderTerminate: end,
  });

  return {
    panHandlers: responder.panHandlers,
    update(nextZoom, nextEvents) {
      zoom = nextZoom;
      events = nextEvents;
    },
    setFrame(next) {
      frame = next;
    },
    commit(committed) {
      if (!pending || pending.zoom !== committed) return null;
      const { transform, released } = pending;
      pending = null;
      return { transform, released };
    },
  };
}

/**
 * The library laid out the way Photos lays out a camera roll: rows of
 * covers under month headers (year headers at the widest zoom), and a
 * pinch that steps the column count. Spreading two fingers zooms in to
 * fewer, larger tiles; closing them zooms out. The grid scales under the
 * fingers as they move and eases into the new layout once they lift.
 */
export function TimelineGrid<T extends LibraryItem>({
  items,
  zoom,
  onZoomChange,
  renderItem,
  contentContainerStyle,
  ListEmptyComponent,
  testID = 'timeline-grid',
}: TimelineGridProps<T>) {
  const styles = useThemedStyles(makeStyles);
  const columns = ZOOM_COLUMNS[zoom];
  const gutter = GUTTER[zoom];
  const [pinching, setPinching] = useState(false);
  const [scale] = useState(() => new Animated.Value(1));
  const [shift] = useState(() => new Animated.ValueXY());
  const [pinch] = useState(createPinchResponder);
  const rootRef = useRef<View>(null);

  const settle = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        ...motion.settle,
        useNativeDriver: true,
      }),
      Animated.spring(shift, {
        toValue: { x: 0, y: 0 },
        ...motion.settle,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, shift]);

  useEffect(() => {
    pinch.update(zoom, {
      onZoom: onZoomChange,
      onPinching: setPinching,
      onTransform: (next, x, y) => {
        scale.setValue(next);
        shift.setValue({ x, y });
      },
      onRelease: settle,
    });
  }, [pinch, zoom, onZoomChange, scale, shift, settle]);

  // The new column layout is committed: show it at the size the old one
  // was scaled to, in the same frame, so the step is invisible.
  useLayoutEffect(() => {
    const committed = pinch.commit(zoom);
    if (!committed) return;
    scale.setValue(committed.transform.scale);
    shift.setValue({ x: committed.transform.x, y: committed.transform.y });
    if (committed.released) settle();
  }, [pinch, zoom, scale, shift, settle]);

  const measure = () => {
    rootRef.current?.measureInWindow((x, y, width, height) => {
      pinch.setFrame({ x, y, width, height });
    });
  };

  const sections = useMemo(
    () => groupByPeriod(items, periodForZoom(zoom), columns),
    [items, zoom, columns],
  );

  const cellWidth = `${100 / columns}%` as `${number}%`;

  return (
    <Animated.View
      ref={rootRef}
      onLayout={measure}
      style={[
        styles.root,
        {
          transform: [
            { translateX: shift.x },
            { translateY: shift.y },
            { scale },
          ],
        },
      ]}
      testID={testID}
      {...pinch.panHandlers}
    >
      <SectionList<T[], TimelineSection<T>>
        sections={sections}
        keyExtractor={(row) => row[0].id}
        scrollEnabled={!pinching}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View style={[styles.header, { paddingHorizontal: gutter }]}>
            <Text style={styles.headerText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item: row }) => (
          <View style={styles.row}>
            {row.map((item) => (
              <View
                key={item.id}
                style={{ width: cellWidth, padding: gutter }}
                testID={`${testID}-cell`}
              >
                {renderItem(item)}
              </View>
            ))}
          </View>
        )}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={ListEmptyComponent}
      />
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1 },
    content: { flexGrow: 1 },
    header: {
      backgroundColor: colors.background,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    headerText: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    row: { flexDirection: 'row' },
  });
