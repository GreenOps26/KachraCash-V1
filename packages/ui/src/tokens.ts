import type { GladeApp, GladeSurface } from '@kachracash/types';
import { surfaceForApp } from '@kachracash/types';

export const colors = {
	pine950: '#0f1e16',
	pine900: '#152a20',
	pine800: '#1d3a2b',
	forest700: '#2c5a43',
	forest600: '#356b4e',
	forest500: '#457f5f',
	sage400: '#8fae96',
	sage300: '#afc7b2',
	sage200: '#d2e0d3',
	cream50: '#faf7ef',
	cream100: '#f4f0e4',
	sand300: '#e4dcc5',
	sand400: '#d6cba8',
	gold600: '#b3822a',
	gold500: '#c99a3b',
	gold300: '#e4c888',
	coral600: '#b14b41',
	coral100: '#f3dad6',
	info600: '#3e6e7a',
	info100: '#dce8e9',
	ink900: '#1b211c',
	ink700: '#3d453e',
	ink500: '#6b756e',
	ink300: '#9aa39b',
	white: '#ffffff'
} as const;

export const fonts = {
	display: 'Fraunces',
	body: 'Inter',
	mono: 'JetBrainsMono'
} as const;

export function gladeSurface(app: GladeApp): GladeSurface {
	return surfaceForApp(app);
}

export function surfacePalette(surface: GladeSurface) {
	if (surface === 'dark') {
		return {
			page: colors.pine950,
			card: colors.pine900,
			cardMuted: colors.pine800,
			border: colors.pine800,
			text: colors.cream50,
			textMuted: colors.sage400,
			heading: colors.cream50,
			accent: colors.forest600,
			highlight: colors.gold500
		};
	}

	return {
		page: colors.cream100,
		card: colors.white,
		cardMuted: colors.cream50,
		border: colors.sand400,
			text: colors.ink900,
			textMuted: colors.ink500,
			heading: colors.pine900,
			accent: colors.forest600,
			highlight: colors.gold500
	};
}
