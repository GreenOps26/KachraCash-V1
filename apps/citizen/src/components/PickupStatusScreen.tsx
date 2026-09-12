import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { CreatePickupResponse } from '@kachracash/types';
import { Button, GladeScreen } from '@kachracash/ui/native';
import { colors, surfacePalette } from '@kachracash/ui/tokens';
import { fetchPickupDetail, getDevCitizenId } from '../lib/api';

interface Props {
	confirmation: CreatePickupResponse;
	onReset: () => void;
}

export function PickupStatusScreen({ confirmation, onReset }: Props) {
	const palette = surfacePalette('light');
	const [status, setStatus] = useState(confirmation.pickup.status);
	const [devOtp, setDevOtp] = useState<string | null>(null);
	const [settlement, setSettlement] = useState<{
		grossAmount: number;
		platformFee: number;
		netPayout: number;
		payoutStatus: string | null;
	} | null>(null);

	useEffect(() => {
		let cancelled = false;
		const citizenId = getDevCitizenId();

		async function pollPickup() {
			try {
				const detail = await fetchPickupDetail(confirmation.pickup.id, citizenId);
				if (cancelled) return;

				setStatus(detail.pickup.status);
				setDevOtp(detail.devOtp ?? null);
				setSettlement(detail.pickup.settlement);
			} catch {
				if (!cancelled) {
					setStatus(confirmation.pickup.status);
				}
			}
		}

		pollPickup();
		const timer = setInterval(pollPickup, 4000);

		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [confirmation.pickup.id, confirmation.pickup.status]);

	return (
		<GladeScreen app="citizen" subtitle="Pickup scheduled">
			<StatusBar style="dark" />
			<View style={styles.successCard}>
				<Text style={[styles.title, { color: palette.heading }]}>Pickup confirmed</Text>
				<Text style={{ color: palette.textMuted }}>
					Request {confirmation.pickup.id.slice(0, 8)}… · status {status}
				</Text>

				{status === 'PENDING' || status === 'ASSIGNED' ? (
					<Text style={styles.rate}>Waiting for a collector to accept your doorstep job.</Text>
				) : null}

				{status === 'WEIGHING' ? (
					<View style={styles.otpCard}>
						<Text style={[styles.categoryTitle, { color: palette.heading }]}>Share OTP with collector</Text>
						<Text style={{ color: palette.textMuted }}>
							The collector locked your scrap weight. Share this code to release UPI payout.
						</Text>
						{devOtp ? (
							<Text style={styles.otpValue}>{devOtp}</Text>
						) : (
							<Text style={styles.rate}>OTP will appear when weighing starts…</Text>
						)}
					</View>
				) : null}

				{status === 'COMPLETED' && settlement ? (
					<View style={styles.otpCard}>
						<Text style={[styles.categoryTitle, { color: palette.heading }]}>Payment receipt</Text>
						<Text style={styles.rate}>Gross ₹{settlement.grossAmount.toFixed(2)}</Text>
						<Text style={{ color: palette.textMuted }}>
							Platform fee ₹{settlement.platformFee.toFixed(2)} · Net UPI ₹{settlement.netPayout.toFixed(2)}
						</Text>
						<Text style={{ color: palette.textMuted }}>
							Payout status: {settlement.payoutStatus ?? 'PENDING'}
						</Text>
					</View>
				) : null}
			</View>
			<Button variant="gold" size="lg" label="Schedule another pickup" onPress={onReset} />
		</GladeScreen>
	);
}

const styles = StyleSheet.create({
	title: { fontSize: 22, fontWeight: '500' },
	categoryTitle: { fontSize: 16, fontWeight: '600' },
	rate: { marginTop: 4, color: colors.gold600, fontWeight: '700' },
	successCard: { gap: 8, marginBottom: 16 },
	otpCard: {
		gap: 8,
		marginTop: 12,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: colors.sand300
	},
	otpValue: {
		fontSize: 36,
		fontWeight: '700',
		color: colors.gold600,
		letterSpacing: 8,
		textAlign: 'center'
	}
});
