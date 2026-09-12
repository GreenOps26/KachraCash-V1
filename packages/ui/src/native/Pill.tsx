import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../tokens';

type PillTone = 'success' | 'warning' | 'info' | 'neutral';

interface PillProps {
	label: string;
	tone?: PillTone;
	dot?: boolean;
}

const toneStyles: Record<PillTone, { bg: string; text: string }> = {
	success: { bg: colors.sage200, text: colors.forest700 },
	warning: { bg: colors.gold300, text: colors.gold600 },
	info: { bg: colors.info100, text: colors.info600 },
	neutral: { bg: colors.sand300, text: colors.ink700 }
};

export function Pill({ label, tone = 'neutral', dot = true }: PillProps) {
	const palette = toneStyles[tone];

	return (
		<View style={[styles.pill, { backgroundColor: palette.bg }]}>
			{dot ? <View style={[styles.dot, { backgroundColor: palette.text }]} /> : null}
			<Text style={[styles.text, { color: palette.text }]}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999
	},
	dot: { width: 6, height: 6, borderRadius: 3 },
	text: { fontFamily: fonts.body, fontSize: 11, fontWeight: '600' }
});
