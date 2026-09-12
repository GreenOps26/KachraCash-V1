import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { PickupListResponse, VisualTier } from '@kachracash/types';
import { Button, GladeScreen, Pill } from '@kachracash/ui/native';
import { colors, surfacePalette } from '@kachracash/ui/tokens';
import {
	acceptPickup,
	completeOrder,
	ensureCollectorAuth,
	fetchPendingPickups,
	fetchRatesForTier,
	getApiBaseUrl,
	getDevCollectorId
} from './src/lib/api';
import { formatWeightKg, useBleScale } from './src/hooks/useBleScale';

type ActivePickup = PickupListResponse['pickups'][number];

export default function App() {
	const palette = surfacePalette('dark');
	const scale = useBleScale();
	const collectorId = useMemo(() => getDevCollectorId(), []);

	const [pendingPickups, setPendingPickups] = useState<ActivePickup[]>([]);
	const [loadingPickups, setLoadingPickups] = useState(true);
	const [pickupError, setPickupError] = useState<string | null>(null);
	const [activePickup, setActivePickup] = useState<ActivePickup | null>(null);
	const [devOtp, setDevOtp] = useState<string | null>(null);
	const [floorRate, setFloorRate] = useState<number | null>(null);
	const [sku, setSku] = useState<string | null>(null);
	const [otp, setOtp] = useState('4829');
	const [accepting, setAccepting] = useState(false);
	const [completing, setCompleting] = useState(false);
	const [completeError, setCompleteError] = useState<string | null>(null);
	const [completionMessage, setCompletionMessage] = useState<string | null>(null);

	const liveWeight = scale.lockedWeightKg ?? scale.reading?.weightKg ?? 0;
	const showTarePrompt = scale.status === 'connected' && !scale.isTared && scale.lockedWeightKg === null;

	const grossAmount = useMemo(() => {
		if (!scale.lockedWeightKg || !floorRate) return null;
		return Math.round(scale.lockedWeightKg * floorRate * 100) / 100;
	}, [floorRate, scale.lockedWeightKg]);

	const loadPickups = useCallback(async () => {
		try {
			setLoadingPickups(true);
			setPickupError(null);
			await ensureCollectorAuth();
			const payload = await fetchPendingPickups();
			setPendingPickups(payload.pickups);
		} catch (error) {
			setPickupError(error instanceof Error ? error.message : 'Could not load pickups');
		} finally {
			setLoadingPickups(false);
		}
	}, []);

	useEffect(() => {
		loadPickups();
	}, [loadPickups]);

	async function handleAcceptPickup(pickup: ActivePickup) {
		setAccepting(true);
		setPickupError(null);
		setCompleteError(null);
		setCompletionMessage(null);

		try {
			const result = await acceptPickup(pickup.id, collectorId);
			const rates = await fetchRatesForTier(pickup.visualTier as VisualTier);
			const primaryRate = rates.rates[0];

			if (!primaryRate) {
				throw new Error('No floor rate found for visual tier');
			}

			setActivePickup(pickup);
			setFloorRate(primaryRate.floorRate);
			setSku(primaryRate.sku);
			setDevOtp(result.devOtp ?? null);
			if (result.devOtp) {
				setOtp(result.devOtp);
			}
		} catch (error) {
			setPickupError(error instanceof Error ? error.message : 'Accept failed');
		} finally {
			setAccepting(false);
		}
	}

	async function handleCompleteOrder() {
		if (!activePickup || !scale.lockedWeightKg || !floorRate || !sku || !grossAmount) return;

		setCompleting(true);
		setCompleteError(null);

		try {
			const result = (await completeOrder(activePickup.id, {
				collectorId,
				otp,
				grossAmount,
				bleItems: [
					{
						categoryId: sku,
						weightKg: scale.lockedWeightKg,
						unitRate: floorRate,
						scaleHardwareId: scale.deviceName ?? 'BLE_SIMULATOR'
					}
				]
			})) as {
				netPayout?: number;
				payout?: { status?: string; amount?: number };
			};

			const payoutStatus = result.payout?.status ?? 'INITIATED';
			const net = result.netPayout ?? result.payout?.amount;
			setCompletionMessage(
				`Settlement complete. Citizen payout ${payoutStatus}${net ? ` · ₹${net.toFixed(2)}` : ''}`
			);
			setActivePickup(null);
			setDevOtp(null);
			scale.clearLock();
			await loadPickups();
		} catch (error) {
			setCompleteError(error instanceof Error ? error.message : 'Completion failed');
		} finally {
			setCompleting(false);
		}
	}

	const nextPickup = pendingPickups[0] ?? null;

	return (
		<GladeScreen app="partner" subtitle="Collector · field mode">
			<StatusBar style="light" />

			<View style={[styles.greetCard, { backgroundColor: palette.cardMuted, borderColor: palette.border }]}>
				<Text style={[styles.greetName, { color: palette.heading }]}>Today's route</Text>
				<Text style={{ color: palette.textMuted }}>
					{loadingPickups
						? 'Loading pending pickups…'
						: `${pendingPickups.length} pending · API ${getApiBaseUrl()}`}
				</Text>
			</View>

			{pickupError ? <Text style={styles.errorText}>{pickupError}</Text> : null}
			{completionMessage ? <Text style={styles.successText}>{completionMessage}</Text> : null}

			{activePickup ? (
				<View style={[styles.jobCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
					<View style={styles.jobHeader}>
						<Text style={[styles.jobName, { color: palette.heading }]}>{activePickup.citizenName ?? 'Citizen'}</Text>
						<Pill label="Weighing" tone="warning" dot={true} />
					</View>
					<Text style={{ color: palette.textMuted, marginBottom: 8 }}>
						Ward {activePickup.wardNumber} · {activePickup.wardName} · {activePickup.visualTier.replaceAll('_', ' ')}
					</Text>
					{devOtp ? (
						<Text style={styles.devOtp}>Pilot OTP for citizen: {devOtp}</Text>
					) : null}
				</View>
			) : nextPickup ? (
				<View style={[styles.jobCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
					<View style={styles.jobHeader}>
						<Text style={[styles.jobName, { color: palette.heading }]}>{nextPickup.citizenName ?? 'Citizen'}</Text>
						<Pill label="Pending" tone="info" dot={false} />
					</View>
					<Text style={{ color: palette.textMuted, marginBottom: 12 }}>
						Ward {nextPickup.wardNumber} · {nextPickup.wardName} · {nextPickup.visualTier.replaceAll('_', ' ')}
					</Text>
					<Button
						variant="gold"
						size="field"
						label={accepting ? 'Accepting…' : 'Accept pickup'}
						onPress={() => handleAcceptPickup(nextPickup)}
						disabled={accepting}
					/>
				</View>
			) : (
				<View style={[styles.jobCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
					<Text style={{ color: palette.textMuted }}>No pending pickups. Book one from the citizen app.</Text>
					<Button variant="outline" size="md" label="Refresh queue" onPress={loadPickups} />
				</View>
			)}

			<View style={[styles.blePanel, { backgroundColor: palette.card, borderColor: palette.border }]}>
				<View style={styles.bleHeader}>
					<Text style={[styles.bleTitle, { color: palette.heading }]}>BLE hanging scale</Text>
					<Pill
						label={scale.status === 'connected' ? 'GATT stream live' : scale.status}
						tone={scale.status === 'connected' ? 'success' : 'info'}
						dot={scale.status === 'connected'}
					/>
				</View>
				<Text style={{ color: palette.textMuted, fontSize: 12 }}>
					Mode: {scale.mode} · Service {scale.deviceName ?? 'not paired'}
				</Text>

				{scale.status === 'disconnected' || scale.status === 'error' ? (
					<Button variant="primary" size="field" label="Scan for scale" onPress={() => scale.startScan()} />
				) : null}

				{scale.status === 'scanning' ? (
					<View style={styles.scanList}>
						<Text style={{ color: palette.textMuted }}>Nearby scales</Text>
						{scale.discoveredDevices.map((device) => (
							<Pressable
								key={device.id}
								onPress={() => scale.connect(device.id)}
								style={[styles.deviceRow, { borderColor: palette.border }]}
							>
								<Text style={{ color: palette.heading }}>{device.name}</Text>
								<Text style={{ color: palette.textMuted, fontSize: 11 }}>{device.id}</Text>
							</Pressable>
						))}
						<Button variant="ghost" size="md" label="Cancel scan" onPress={scale.stopScan} />
					</View>
				) : null}

				{scale.status === 'connected' ? (
					<Button variant="outline" size="md" label="Disconnect scale" onPress={() => scale.disconnect()} />
				) : null}

				{scale.parseError ? <Text style={styles.errorText}>{scale.parseError}</Text> : null}
			</View>

			<View style={[styles.scaleReadout, { backgroundColor: palette.cardMuted, borderColor: palette.border }]}>
				<Text style={[styles.scaleValue, { color: palette.highlight }]}>{formatWeightKg(liveWeight)} kg</Text>
				{showTarePrompt ? (
					<Text style={{ color: colors.coral100, textAlign: 'center' }}>
						Zero-tare required — hang empty scale and confirm tare
					</Text>
				) : (
					<Text style={{ color: palette.textMuted }}>
						{scale.isTared ? 'Tare confirmed · add scrap to weigh' : 'Connect scale to begin weighing'}
					</Text>
				)}
				{grossAmount ? (
					<Text style={styles.rateHint}>Floor settlement · ₹{grossAmount.toFixed(2)} gross</Text>
				) : null}
			</View>

			<View style={styles.actionRow}>
				<Button
					variant="primary"
					size="field"
					label="Confirm zero tare"
					onPress={scale.sendTare}
					disabled={scale.status !== 'connected' || scale.lockedWeightKg !== null}
					style={{ flex: 1 }}
				/>
				<Button
					variant="gold"
					size="field"
					label={scale.lockedWeightKg != null ? 'Weight locked' : 'Lock weight'}
					onPress={scale.lockWeight}
					disabled={!scale.canLockWeight}
					style={{ flex: 1 }}
				/>
			</View>

			{scale.mode === 'simulator' && scale.status === 'connected' ? (
				<View style={styles.simRow}>
					<Text style={{ color: palette.textMuted, fontSize: 12 }}>Simulator: add scrap weight via GATT packets</Text>
					<View style={styles.actionRow}>
						<Button variant="outline" size="md" label="+500 g" onPress={() => scale.simulateAddWeight(500)} style={{ flex: 1 }} />
						<Button variant="outline" size="md" label="+1 kg" onPress={() => scale.simulateAddWeight(1000)} style={{ flex: 1 }} />
					</View>
				</View>
			) : null}

			{activePickup && scale.lockedWeightKg ? (
				<View style={[styles.otpCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
					<Text style={[styles.bleTitle, { color: palette.heading }]}>Citizen OTP</Text>
					<Text style={{ color: palette.textMuted, marginBottom: 8 }}>Ask the citizen to share their 4-digit OTP.</Text>
					<TextInput
						value={otp}
						onChangeText={setOtp}
						keyboardType="number-pad"
						maxLength={4}
						style={[styles.otpInput, { color: palette.heading, borderColor: palette.border }]}
					/>
					<Button
						variant="gold"
						size="field"
						label={completing ? 'Settling…' : 'Complete & pay citizen'}
						onPress={handleCompleteOrder}
						disabled={completing || otp.length !== 4}
					/>
					{completeError ? <Text style={styles.errorText}>{completeError}</Text> : null}
				</View>
			) : null}
		</GladeScreen>
	);
}

const styles = StyleSheet.create({
	greetCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
	greetName: { fontSize: 18, fontWeight: '600' },
	jobCard: { borderWidth: 1, borderRadius: 12, padding: 14 },
	jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
	jobName: { fontSize: 16, fontWeight: '700' },
	devOtp: { color: colors.gold500, fontWeight: '700' },
	blePanel: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
	bleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
	bleTitle: { fontSize: 15, fontWeight: '700' },
	scanList: { gap: 8 },
	deviceRow: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 2 },
	scaleReadout: { borderWidth: 1, borderRadius: 12, padding: 20, alignItems: 'center', gap: 6 },
	scaleValue: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
	rateHint: { color: colors.gold500, fontWeight: '700' },
	actionRow: { flexDirection: 'row', gap: 12 },
	simRow: { gap: 8 },
	otpCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 8 },
	otpInput: {
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 20,
		fontWeight: '700',
		letterSpacing: 6,
		textAlign: 'center'
	},
	errorText: { color: colors.coral100, fontSize: 12 },
	successText: { color: colors.sage300, fontSize: 12, fontWeight: '600' }
});
