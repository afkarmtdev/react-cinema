/**
 * Jest stand-in for expo-haptics, picked up through jest.mock('expo-haptics')
 * in jest.setup.js. The native module cannot run under Node; here every
 * call resolves and does nothing.
 */

export const ImpactFeedbackStyle = {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy',
} as const;

export const NotificationFeedbackType = {
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
} as const;

export const impactAsync = async (_style?: string): Promise<void> => {};
export const notificationAsync = async (_type?: string): Promise<void> => {};
export const selectionAsync = async (): Promise<void> => {};
