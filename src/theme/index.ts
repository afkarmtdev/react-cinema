// Shared design tokens: GSC's dark surfaces + single yellow accent.

export const colors = {
  // Surfaces
  background: '#0B0B0B',
  surface: '#161616',
  surfaceAlt: '#1E1E1E',
  elevated: '#262626',
  border: '#2A2A2A',

  // Brand
  primary: '#FCE300', // GSC yellow
  primaryPressed: '#D9C400',
  onPrimary: '#0B0B0B', // text/icons on yellow

  // Text
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#7A7A7A',

  // Feedback
  star: '#FFC42E',
  error: '#FF5A5F',
  success: '#34C759',

  // Misc
  overlay: 'rgba(0,0,0,0.55)',
  skeleton: '#1F1F1F',
  skeletonHighlight: '#2C2C2C',
} as const;

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

export const theme = { colors, spacing, radius, typography };
export type Theme = typeof theme;
