import type { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import type { GladeApp } from '@kachracash/types';
import { BrandMark } from './BrandMark';
import { gladeSurface, surfacePalette } from '../tokens';

interface GladeScreenProps {
	app: GladeApp;
	subtitle: string;
	children: ReactNode;
	headerExtra?: ReactNode;
}

export function GladeScreen({ app, subtitle, children, headerExtra }: GladeScreenProps) {
	const palette = surfacePalette(gladeSurface(app));

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: palette.page }]}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<BrandMark subtitle={subtitle} />
					{headerExtra}
				</View>
				{children}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	content: { padding: 20, paddingBottom: 40, gap: 16 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8
	}
});
