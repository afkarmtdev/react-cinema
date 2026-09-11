import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import {
  motion,
  radius,
  spacing,
  typography,
  type ThemeColors,
} from '../theme';

export interface PagerPage<K extends string> {
  key: K;
  label: string;
}

interface SwipePagerProps<K extends string> {
  /** At least two pages, in the order they sit left to right. */
  pages: PagerPage<K>[];
  index: number;
  onIndexChange: (index: number) => void;
  renderPage: (page: PagerPage<K>) => ReactNode;
  /**
   * Horizontal padding of the parent. The pages break out of it so a swipe
   * runs edge to edge, and each page pads its own content back in.
   */
  pageInset?: number;
}

/** Layout width the underline is drawn at before scaleX stretches it. */
const INDICATOR_BASE = 100;

type Box = { x: number; width: number };
type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

/**
 * A row of text tabs over horizontally swipeable pages. The underline
 * follows the finger during a swipe and glides to the tapped tab on a tap.
 * On native the scroll offset drives it on the native thread; on web, where
 * the scroll-end events do not fire, the offset is mirrored from onScroll.
 */
export function SwipePager<K extends string>({
  pages,
  index,
  onIndexChange,
  renderPage,
  pageInset = 0,
}: SwipePagerProps<K>) {
  const styles = useThemedStyles(makeStyles);
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX] = useState(() => new Animated.Value(0));
  const [width, setWidth] = useState(0);
  const [tabs, setTabs] = useState<Partial<Record<K, Box>>>({});
  const widthRef = useRef(0);
  const offsetRef = useRef(0);
  const indexRef = useRef(index);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Report the page the scroll settled on.
  const settle = (event: ScrollEvent) => {
    const x = event.nativeEvent.contentOffset.x;
    offsetRef.current = x;
    const w = widthRef.current;
    if (w <= 0) return;
    const page = Math.round(x / w);
    if (Math.abs(x - page * w) > 1) return;
    if (page !== indexRef.current && page >= 0 && page < pages.length) {
      onIndexChange(page);
    }
  };

  const [nativeScroll] = useState(() =>
    Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
      useNativeDriver: true,
    }),
  );
  const webScroll = (event: ScrollEvent) => {
    scrollX.setValue(event.nativeEvent.contentOffset.x);
    settle(event);
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    widthRef.current = next;
    setWidth(next);
  };

  // Keep the offset in step with the page width (first layout, rotation).
  useEffect(() => {
    if (width <= 0) return;
    scrollRef.current?.scrollTo({ x: index * width, animated: false });
    offsetRef.current = index * width;
    // Only the width should trigger this; the index has its own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  // Glide to the page when the index changes from a tap. After a swipe the
  // scroll already sits on the page, so this does nothing.
  useEffect(() => {
    const w = widthRef.current;
    if (w <= 0) return;
    if (Math.round(offsetRef.current / w) === index) return;
    scrollRef.current?.scrollTo({ x: index * w, animated: true });
  }, [index]);

  const measured = pages.every((page) => tabs[page.key]);
  const inputRange = pages.map((_, i) => i * Math.max(1, width));
  const indicator =
    measured && width > 0 && pages.length > 1
      ? {
          translateX: scrollX.interpolate({
            inputRange,
            outputRange: pages.map((page) => {
              const box = tabs[page.key] as Box;
              return box.x + box.width / 2 - INDICATOR_BASE / 2;
            }),
            extrapolate: 'clamp',
          }),
          // Half-way between two tabs the underline is stretched, so it
          // reaches for the next tab like a drop of liquid and settles once
          // the page lands.
          scaleX: scrollX.interpolate({
            inputRange: inputRange.flatMap((x, i) =>
              i === 0 ? [x] : [x - Math.max(1, width) / 2, x],
            ),
            outputRange: pages.flatMap((page, i) => {
              const w = (tabs[page.key] as Box).width;
              if (i === 0) return [w / INDICATOR_BASE];
              const prev = (tabs[pages[i - 1].key] as Box).width;
              const mid = ((prev + w) / 2) * motion.stretch;
              return [mid / INDICATOR_BASE, w / INDICATOR_BASE];
            }),
            extrapolate: 'clamp',
          }),
        }
      : null;

  return (
    <View style={styles.root} testID="swipe-pager">
      <View style={styles.tabs} accessibilityRole="tablist">
        {pages.map((page, i) => (
          <Pressable
            key={page.key}
            onPress={() => onIndexChange(i)}
            onLayout={(event) => {
              const { x, width: w } = event.nativeEvent.layout;
              setTabs((prev) => ({ ...prev, [page.key]: { x, width: w } }));
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === index }}
            style={styles.tab}
          >
            <Text style={[styles.label, i === index && styles.labelActive]}>
              {page.label}
            </Text>
          </Pressable>
        ))}
        {indicator && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                transform: [
                  { translateX: indicator.translateX },
                  { scaleX: indicator.scaleX },
                ],
              },
            ]}
          />
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScroll={Platform.OS === 'web' ? webScroll : nativeScroll}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        scrollEventThrottle={16}
        onLayout={onLayout}
        style={[styles.scroll, { marginHorizontal: -pageInset }]}
        testID="swipe-pager-scroll"
      >
        {width > 0 &&
          pages.map((page) => (
            <View
              key={page.key}
              style={[styles.page, { width, paddingHorizontal: pageInset }]}
            >
              {renderPage(page)}
            </View>
          ))}
      </Animated.ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1 },
    tabs: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xl,
      marginBottom: spacing.md,
    },
    tab: { paddingBottom: spacing.sm + 3 },
    label: { ...typography.h3, color: colors.textMuted },
    labelActive: { color: colors.text },
    indicator: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: INDICATOR_BASE,
      height: 3,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
    scroll: { flex: 1 },
    page: { height: '100%' },
  });
