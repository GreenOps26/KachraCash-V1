import { Platform, TextStyle } from 'react-native';

/**
 * Typography Tokens & Font Constants for Citizen Consumer App (@apps/citizen)
 * Strictly adheres to KachraCash Guwahati Circular Economy UX Spec
 */
export const typography = {
  // Font Families with native platform fallbacks
  fontDisplay: Platform.select({
    ios: 'Fraunces',
    android: 'Fraunces',
    default: 'Fraunces, Georgia, serif',
  }),
  fontBody: Platform.select({
    ios: 'IBMPlexSans',
    android: 'IBMPlexSans',
    default: 'IBMPlexSans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }),
  fontMono: Platform.select({
    ios: 'JetBrainsMono',
    android: 'JetBrainsMono',
    default: 'JetBrainsMono, "SF Mono", Monaco, Consolas, monospace',
  }),

  // Type Scale Presets
  displayLarge: {
    fontFamily: Platform.select({ ios: 'Fraunces', android: 'Fraunces', default: 'Fraunces, serif' }),
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 34,
  },
  displayMedium: {
    fontFamily: Platform.select({ ios: 'Fraunces', android: 'Fraunces', default: 'Fraunces, serif' }),
    fontSize: 22,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 28,
  },
  heading: {
    fontFamily: Platform.select({ ios: 'Fraunces', android: 'Fraunces', default: 'Fraunces, serif' }),
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: Platform.select({ ios: 'IBMPlexSans', android: 'IBMPlexSans', default: 'IBMPlexSans, sans-serif' }),
    fontSize: 15,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: Platform.select({ ios: 'IBMPlexSans', android: 'IBMPlexSans', default: 'IBMPlexSans, sans-serif' }),
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 18,
  },
  bodyBold: {
    fontFamily: Platform.select({ ios: 'IBMPlexSans', android: 'IBMPlexSans', default: 'IBMPlexSans, sans-serif' }),
    fontSize: 13,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 18,
  },
  label: {
    fontFamily: Platform.select({ ios: 'IBMPlexSans', android: 'IBMPlexSans', default: 'IBMPlexSans, sans-serif' }),
    fontSize: 11,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.6,
  },
  telemetryLarge: {
    fontFamily: Platform.select({ ios: 'JetBrainsMono', android: 'JetBrainsMono', default: 'JetBrainsMono, monospace' }),
    fontSize: 36,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
  },
  telemetryMedium: {
    fontFamily: Platform.select({ ios: 'JetBrainsMono', android: 'JetBrainsMono', default: 'JetBrainsMono, monospace' }),
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
};

