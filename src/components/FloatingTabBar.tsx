import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles } from '../context/ThemeContext';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import type { TabParamList } from '../navigation/types';

/** Height of the pill itself, without the gap under it. */
export const FLOATING_TAB_BAR_HEIGHT = 64;

const PILL_PADDING = spacing.sm;
const PILL_BORDER = 1;
const TAB_HEIGHT = 52;
/** Space between the sliding capsule and the edge of its slot. */
const CAPSULE_INSET = spacing.xs;

const ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  LibraryTab: 'albums',
  DiaryTab: 'calendar',
  ProfileTab: 'person',
};

/** Alpha suffix for a #RRGGBB colour: about 16 percent. */
const tint = (hex: string) => `${hex}29`;

/**
 * Where the pill sits and how much room a screen has to leave under its
 * content so the last row is not hidden behind it.
 */
export function useFloatingTabBarInset() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, spacing.lg);
  const top = bottom + FLOATING_TAB_BAR_HEIGHT;
  return { bottom, top, clearance: top + spacing.lg };
}

/**
 * The bottom tabs as a detached pill floating above the content, in place of
 * the default bar. Design B on the bottom nav canvas. The tinted capsule
 * behind the active tab slides to the new tab on a switch.
 */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const styles = useThemedStyles(makeStyles);
  const { bottom } = useFloatingTabBarInset();
  const [pillWidth, setPillWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(state.index));

  useEffect(() => {
    const slide = Animated.timing(position, {
      toValue: state.index,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    slide.start();
    return () => slide.stop();
  }, [position, state.index]);

  const focused = state.routes[state.index];
  const focusedStyle = StyleSheet.flatten(
    descriptors[focused.key].options.tabBarStyle,
  ) as ViewStyle | undefined;
  if (focusedStyle?.display === 'none') return null;

  const count = state.routes.length;
  const slot = Math.max(
    0,
    (pillWidth - 2 * (PILL_PADDING + PILL_BORDER)) / count,
  );
  const translateX = position.interpolate({
    inputRange: [0, Math.max(1, count - 1)],
    outputRange: [0, Math.max(1, count - 1) * slot],
  });
  const onLayout = (event: LayoutChangeEvent) =>
    setPillWidth(event.nativeEvent.layout.width);

  return (
    <View
      style={[styles.pill, { bottom }]}
      onLayout={onLayout}
      accessibilityRole="tablist"
      testID="floating-tab-bar"
    >
      {slot > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.capsule,
            {
              width: slot - 2 * CAPSULE_INSET,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const active = index === state.index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!active && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            style={styles.tab}
          >
            <Ionicons
              name={ICONS[route.name as keyof TabParamList]}
              size={22}
              color={active ? styles.labelActive.color : styles.label.color}
            />
            <Text style={[styles.label, active && styles.labelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    pill: {
      position: 'absolute',
      left: spacing.xxl,
      right: spacing.xxl,
      height: FLOATING_TAB_BAR_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: PILL_PADDING,
      borderRadius: radius.pill,
      backgroundColor: colors.elevated,
      borderWidth: PILL_BORDER,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.45,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    },
    capsule: {
      position: 'absolute',
      left: PILL_PADDING + CAPSULE_INSET,
      top: (FLOATING_TAB_BAR_HEIGHT - 2 * PILL_BORDER - TAB_HEIGHT) / 2,
      height: TAB_HEIGHT,
      borderRadius: radius.pill,
      backgroundColor: tint(colors.secondary),
    },
    tab: {
      flex: 1,
      height: TAB_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    label: { ...typography.tiny, fontWeight: '600', color: colors.textMuted },
    labelActive: { color: colors.secondary },
  });
