import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../tokens';

interface StepBannerProps {
	activeStep?: 1 | 2 | 3;
}

const steps = [
	{ id: 1, label: 'Schedule' },
	{ id: 2, label: 'Weigh transparently' },
	{ id: 3, label: 'Instant UPI payout' }
] as const;

export function StepBanner({ activeStep = 1 }: StepBannerProps) {
	return (
		<View style={styles.banner} accessibilityRole="summary">
			{steps.map((step, index) => (
				<View key={step.id} style={styles.row}>
					<Text style={[styles.step, activeStep === step.id && styles.stepActive]}>{step.label}</Text>
					{index < steps.length - 1 ? <Text style={styles.arrow}>→</Text> : null}
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	banner: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 12,
		paddingHorizontal: 14,
		backgroundColor: colors.cream50,
		borderWidth: 1,
		borderColor: colors.sand300,
		borderRadius: 12
	},
	row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	step: { fontFamily: fonts.body, fontSize: 12, fontWeight: '600', color: colors.ink700 },
	stepActive: { color: colors.forest600 },
	arrow: { fontSize: 12, color: colors.ink500 }
});
