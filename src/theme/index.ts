// Shared design tokens. Spacing, radius, and type are fixed; colours come in
// named themes that the user picks on the Me screen (see ThemeContext).

export interface ThemeColors {
  // Surfaces
  background: string;
  surface: string;
  surfaceAlt: string;
  elevated: string;
  border: string;

  // Accent
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  /** Second accent for the active tab. Equal to primary in most themes. */
  secondary: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  /** Text and icons on top of the dark overlay badges over covers. */
  onOverlay: string;

  // Feedback
  star: string;
  error: string;
  success: string;

  // Misc
  overlay: string;
  skeleton: string;
  skeletonHighlight: string;
}

/** Near-black surfaces and one yellow accent, borrowed from GSC. Default. */
export const cinema: ThemeColors = {
  background: '#0B0B0B',
  surface: '#161616',
  surfaceAlt: '#1E1E1E',
  elevated: '#262626',
  border: '#2A2A2A',
  primary: '#FCE300',
  primaryPressed: '#D9C400',
  onPrimary: '#0B0B0B',
  secondary: '#FCE300',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#7A7A7A',
  onOverlay: '#FFFFFF',
  star: '#FFC42E',
  error: '#FF5A5F',
  success: '#34C759',
  overlay: 'rgba(0,0,0,0.55)',
  skeleton: '#1F1F1F',
  skeletonHighlight: '#2C2C2C',
};

/** Warm paper, brick-red accent, ink text. The light theme. */
export const paperback: ThemeColors = {
  background: '#F4EFE5',
  surface: '#FFFDF8',
  surfaceAlt: '#EFE8DA',
  elevated: '#E7DFCF',
  border: '#DDD3C2',
  primary: '#B23A2E',
  primaryPressed: '#932F25',
  onPrimary: '#FFFDF8',
  secondary: '#B23A2E',
  text: '#1F1B17',
  textSecondary: '#5E554B',
  textMuted: '#948A7D',
  onOverlay: '#FFFDF8',
  star: '#C98A12',
  error: '#C0392B',
  success: '#2E7D4F',
  overlay: 'rgba(31,27,23,0.62)',
  skeleton: '#E9E2D4',
  skeletonHighlight: '#F1EBDF',
};

/** Violet night, hot pink actions, cyan on the active tab. Ocean Drive, 1986. */
export const viceCity: ThemeColors = {
  background: '#140A24',
  surface: '#1F1136',
  surfaceAlt: '#2A1747',
  elevated: '#341D57',
  border: '#3B2560',
  primary: '#FF3E9A',
  primaryPressed: '#E02F84',
  onPrimary: '#16081F',
  secondary: '#34E4F0',
  text: '#FFF3FA',
  textSecondary: '#C9B3D9',
  textMuted: '#8A73A3',
  onOverlay: '#FFF3FA',
  star: '#FFC94A',
  error: '#FF5A5F',
  success: '#34E4A0',
  overlay: 'rgba(20,10,36,0.6)',
  skeleton: '#241440',
  skeletonHighlight: '#31204F',
};

export const themes = { cinema, paperback, viceCity } as const;
export type ThemeName = keyof typeof themes;
export const THEME_NAMES: ThemeName[] = ['cinema', 'paperback', 'viceCity'];
export const DEFAULT_THEME: ThemeName = 'cinema';

/** Light themes need a dark status bar and light navigation chrome. */
export const isLightTheme = (name: ThemeName): boolean => name === 'paperback';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 26, fontWeight: '800' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '500' as const },
} as const;

/**
 * Motion tuned after iOS 26 Liquid Glass: a quick start, a hint of
 * overshoot, a soft settle, and a control that stretches along its travel
 * while it moves. Every spring in the app reads from here.
 */
export const motion = {
  /** A control sliding to a new slot (the tab capsule, the kind underline). */
  glide: { damping: 15, stiffness: 200, mass: 0.9 },
  /** A panel entering the screen (bottom sheets). */
  enter: { damping: 22, stiffness: 240, mass: 1 },
  /**
   * Content that followed the finger settling where it belongs (the grid
   * after a pinch). Overdamped on purpose: no overshoot, no bounce.
   */
  settle: { damping: 32, stiffness: 260, mass: 1 },
  /** How far a moving control stretches along its travel before settling. */
  stretch: 1.18,
  /** How long the stretch takes to build before the spring pulls it back. */
  stretchMs: 90,
} as const;
