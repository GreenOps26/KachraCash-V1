/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-banyan': {
          DEFAULT: '#1F4D3C',
          soft: '#DEEAE3',
        },
        'brand-marigold': {
          DEFAULT: '#C97A2B',
          soft: '#F4E3CD',
        },
        'brand-paper': '#F1F5EF',
        'brand-surface': '#FBFCFA',
        'brand-forest': {
          base: '#07110E',
          panel: '#0C1915',
          card: '#10221C',
        },
        'brand-ink': '#1F2A24',
        'brand-rust': '#9C3B2A',
        semantic: {
          green: '#059669',
          red: '#DC2626',
          yellow: '#D97706',
          blue: '#1D4ED8',
          cyan: '#55F3CF',
          lime: '#C7FF3D',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-ibm-plex-sans)', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
