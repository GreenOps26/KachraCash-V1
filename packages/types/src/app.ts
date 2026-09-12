export type GladeApp = 'citizen' | 'partner' | 'admin';
export type GladeSurface = 'light' | 'dark';

export function surfaceForApp(app: GladeApp): GladeSurface {
	return app === 'partner' ? 'dark' : 'light';
}
