import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../tokens';

interface BrandMarkProps {
	size?: 'md' | 'lg';
	subtitle?: string;
}

export function BrandMark({ size = 'md', subtitle }: BrandMarkProps) {
	const markSize = size === 'lg' ? 42 : 34;
	const iconSize = size === 'lg' ? 22 : 18;

	return (
		<View style={styles.row}>
			<View style={[styles.mark, { width: markSize, height: markSize, borderRadius: size === 'lg' ? 12 : 10 }]}>
				<Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
					<Path d="M12 2C8 6 5 10 5 14a7 7 0 0014 0c0-4-3-8-7-12z" fill={colors.cream50} />
				</Svg>
			</View>
			<View>
				<Text style={[styles.name, size === 'lg' && styles.nameLg]}>KachraCash</Text>
				{subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	mark: {
		backgroundColor: colors.forest600,
		alignItems: 'center',
		justifyContent: 'center'
	},
	name: {
		fontFamily: fonts.display,
		fontSize: 18,
		fontWeight: '500',
		color: colors.pine900,
		letterSpacing: 0.3
	},
	nameLg: { fontSize: 20 },
	sub: { fontSize: 11, color: colors.ink500, marginTop: 2 }
});
