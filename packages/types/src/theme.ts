/**
 * Banyan & Marigold Design System Tokens & Constants
 * KachraCash Monorepo Shared Theme Definitions
 */

export const BANYAN_LIGHT_THEME = {
  paper: '#F1F5EF',
  surface: '#FBFCFA',
  banyanGreen: '#1F4D3C',
  banyanSoft: '#DEEAE3',
  marigold: '#C97A2B',
  marigoldSoft: '#F4E3CD',
  inkDeep: '#1F2A24',
  rustRed: '#9C3B2A',
  borderNeutral: '#DCE3D8',
} as const;

export const SAHAAYAK_DARK_THEME = {
  forestBase: '#07110E',
  forestPanel: '#0C1915',
  forestCard: '#10221C',
  semanticGreen: '#059669',
  crimsonRed: '#DC2626',
  amberYellow: '#D97706',
  royalBlue: '#1D4ED8',
  telemetryCyan: '#55F3CF',
  brandLime: '#C7FF3D',
} as const;

export const THEME_TYPOGRAPHY = {
  fontDisplay: 'Fraunces',
  fontBody: 'IBM Plex Sans',
  fontMono: 'JetBrains Mono',
} as const;

export type BanyanLightTheme = typeof BANYAN_LIGHT_THEME;
export type SahaayakDarkTheme = typeof SAHAAYAK_DARK_THEME;
export type ThemeTypography = typeof THEME_TYPOGRAPHY;
