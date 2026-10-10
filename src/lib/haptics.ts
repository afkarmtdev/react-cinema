import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Fire and forget. Haptics are a garnish: on web, in a simulator, or on a
 * phone that refuses, the call must never surface as an error.
 */
const run = (fire: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  try {
    fire().catch(() => {});
  } catch {
    // The native module is missing (Jest, an unsupported device).
  }
};

export const haptics = {
  /** A small notch: the zoom stepping a level. */
  tick: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A firmer tap: a toggle the user should feel land. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** The system selection click: switching tabs. */
  select: () => run(() => Haptics.selectionAsync()),
  /** The warning buzz: the 10 confession. */
  warn: () =>
    run(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    ),
};
