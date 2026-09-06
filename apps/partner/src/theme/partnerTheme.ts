export const partnerTheme = {
  colors: {
    // Semantic Primary Action Tokens
    affirmation: '#059669', // Green: Accept order, lock verified weight, confirm
    alert: '#dc2626',       // Red: Reject, dispute, emergency SOS
    caution: '#d97706',     // Amber: En-route status, zero-tare pending
    financial: '#1d4ed8',   // Blue: UPI settlement, wallet sync, call citizen

    // Outdoor Sunlight Surface Scales (High-Contrast Neutral for Budget LCDs)
    bg: '#000000',          // 100% black background for outdoor visibility
    surface: '#111827',     // Dark slate card
    surfaceElevated: '#1f2937',
    border: '#374151',      // High-visibility borders
    text: '#ffffff',        // 100% white text (WCAG AAA 21:1 contrast ratio)
    textMuted: '#9ca3af',
  },
  touch: {
    minWidth: 64,
    minHeight: 64,
    fabSize: 72,
  },
};
