import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { CreatePickupResponse, VisualTier, WardSummary } from '@kachracash/types';
import { Button, GladeScreen, Pill } from '@kachracash/ui/native';
import { colors, surfacePalette } from '@kachracash/ui/tokens';
import { createPickup, fetchAllTierRates, fetchWards, getApiBaseUrl, getDevCitizenId } from './src/lib/api';
import { CATEGORY_CARDS, formatFloorRate } from './src/lib/categories';
import { getUpcomingPickupSlots, type PickupSlot } from './src/lib/slots';
import { pickupLocationForWard } from './src/lib/ward-coords';
import { PickupStatusScreen } from './src/components/PickupStatusScreen';

type WizardStep = 1 | 2 | 3;

export default function App() {
	const [step, setStep] = useState<WizardStep>(1);
	const [selectedTier, setSelectedTier] = useState<VisualTier>('RIGID_CONTAINERS');
	const [selectedWard, setSelectedWard] = useState<WardSummary | null>(null);
	const [selectedSlot, setSelectedSlot] = useState<PickupSlot | null>(null);
	const [ratesByTier, setRatesByTier] = useState<Record<VisualTier, number[]>>({
		RIGID_CONTAINERS: [],
		SOFT_FILMS: [],
		MIXED_BULKY: []
	});
	const [wards, setWards] = useState<WardSummary[]>([]);
	const [loadingRates, setLoadingRates] = useState(true);
	const [loadingWards, setLoadingWards] = useState(true);
	const [ratesError, setRatesError] = useState<string | null>(null);
	const [wardsError, setWardsError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [confirmation, setConfirmation] = useState<CreatePickupResponse | null>(null);
	const palette = surfacePalette('light');
	const slots = useMemo(() => getUpcomingPickupSlots(), []);

	useEffect(() => {
		let cancelled = false;

		async function loadRates() {
			try {
				setLoadingRates(true);
				setRatesError(null);
				const payload = await fetchAllTierRates();

				if (cancelled) return;

				setRatesByTier({
					RIGID_CONTAINERS: payload.RIGID_CONTAINERS.rates.map((rate) => rate.floorRate),
					SOFT_FILMS: payload.SOFT_FILMS.rates.map((rate) => rate.floorRate),
					MIXED_BULKY: payload.MIXED_BULKY.rates.map((rate) => rate.floorRate)
				});
			} catch {
				if (!cancelled) {
					setRatesError('Could not reach KachraCash API. Start `pnpm dev:api` and check EXPO_PUBLIC_API_URL.');
				}
			} finally {
				if (!cancelled) setLoadingRates(false);
			}
		}

		async function loadWards() {
			try {
				setLoadingWards(true);
				setWardsError(null);
				const payload = await fetchWards();

				if (cancelled) return;

				setWards(payload.wards);
				if (payload.wards.length > 0) {
					setSelectedWard((current) => current ?? payload.wards[0]);
				}
			} catch {
				if (!cancelled) {
					setWardsError('Could not load pilot wards from API.');
				}
			} finally {
				if (!cancelled) setLoadingWards(false);
			}
		}

		loadRates();
		loadWards();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!selectedSlot && slots.length > 0) {
			setSelectedSlot(slots[0]);
		}
	}, [slots, selectedSlot]);

	const selectedCategory = CATEGORY_CARDS.find((card) => card.tier === selectedTier);
	const apiBase = useMemo(() => getApiBaseUrl(), []);

	async function handleSchedulePickup() {
		if (!selectedWard || !selectedSlot) return;

		setSubmitting(true);
		setSubmitError(null);

		try {
			const response = await createPickup({
				citizenId: getDevCitizenId(),
				wardId: selectedWard.wardId,
				visualTier: selectedTier,
				pickupLocation: pickupLocationForWard(selectedWard.wardNumber),
				scheduledSlotStart: selectedSlot.start.toISOString(),
				scheduledSlotEnd: selectedSlot.end.toISOString()
			});
			setConfirmation(response);
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : 'Pickup request failed');
		} finally {
			setSubmitting(false);
		}
	}

	function resetFlow() {
		setStep(1);
		setConfirmation(null);
		setSubmitError(null);
	}

	if (confirmation) {
		return <PickupStatusScreen confirmation={confirmation} onReset={resetFlow} />;
	}

	return (
		<GladeScreen app="citizen" subtitle="Schedule pickup">
			<StatusBar style="dark" />
			<View style={styles.stepRow}>
				<Text style={[styles.step, step === 1 && styles.stepActive]}>1 · Category</Text>
				<Text style={[styles.step, step === 2 && styles.stepActive]}>2 · Ward & slot</Text>
				<Text style={[styles.step, step === 3 && styles.stepActive]}>3 · Confirm</Text>
			</View>

			{step === 1 ? (
				<>
					<View style={styles.titleRow}>
						<Text style={[styles.title, { color: palette.heading }]}>Select scrap category</Text>
						<Pill label="Floor rate guaranteed" tone="info" dot={false} />
					</View>

					{loadingRates ? (
						<View style={styles.loadingRow}>
							<ActivityIndicator color={colors.forest600} />
							<Text style={{ color: palette.textMuted }}>Loading live floor rates…</Text>
						</View>
					) : null}

					{ratesError ? <Text style={styles.errorText}>{ratesError}</Text> : null}

					{CATEGORY_CARDS.map((category) => {
						const isSelected = selectedTier === category.tier;
						const rateLabel = formatFloorRate(ratesByTier[category.tier]);

						return (
							<Pressable
								key={category.tier}
								onPress={() => setSelectedTier(category.tier)}
								style={[
									styles.categoryCard,
									{
										backgroundColor: palette.card,
										borderColor: isSelected ? palette.accent : palette.border
									}
								]}
							>
								<Text style={[styles.categoryTitle, { color: palette.heading }]}>{category.title}</Text>
								<Text style={{ color: palette.textMuted }}>{category.desc}</Text>
								<Text style={styles.rate}>{rateLabel}</Text>
							</Pressable>
						);
					})}

					<Text style={styles.apiHint}>Rates from {apiBase}</Text>
					<Button variant="gold" size="lg" label="Continue to ward & slot" onPress={() => setStep(2)} />
				</>
			) : null}

			{step === 2 ? (
				<>
					<Text style={[styles.title, { color: palette.heading }]}>Ward & pickup slot</Text>

					{loadingWards ? (
						<View style={styles.loadingRow}>
							<ActivityIndicator color={colors.forest600} />
							<Text style={{ color: palette.textMuted }}>Loading pilot wards…</Text>
						</View>
					) : null}

					{wardsError ? <Text style={styles.errorText}>{wardsError}</Text> : null}

					<Text style={styles.label}>Your ward</Text>
					{wards.map((ward) => {
						const isSelected = selectedWard?.id === ward.id;
						const suspended = ward.isFloodSuspended;

						return (
							<Pressable
								key={ward.id}
								disabled={suspended}
								onPress={() => setSelectedWard(ward)}
								style={[
									styles.categoryCard,
									{
										backgroundColor: palette.card,
										borderColor: isSelected ? palette.accent : palette.border,
										opacity: suspended ? 0.5 : 1
									}
								]}
							>
								<Text style={[styles.categoryTitle, { color: palette.heading }]}>
									Ward {ward.wardNumber} · {ward.wardName}
								</Text>
								{suspended ? (
									<Text style={styles.errorText}>Temporarily suspended (flood)</Text>
								) : (
									<Text style={{ color: palette.textMuted }}>{ward.wardId}</Text>
								)}
							</Pressable>
						);
					})}

					<Text style={styles.label}>2-hour pickup slot</Text>
					{slots.map((slot) => {
						const isSelected = selectedSlot?.id === slot.id;

						return (
							<Pressable
								key={slot.id}
								onPress={() => setSelectedSlot(slot)}
								style={[
									styles.select,
									{
										backgroundColor: palette.card,
										borderColor: isSelected ? palette.accent : palette.border
									}
								]}
							>
								<Text>{slot.label}</Text>
							</Pressable>
						);
					})}

					<View style={styles.navRow}>
						<Button variant="ghost" size="md" label="Back" onPress={() => setStep(1)} />
						<Button
							variant="gold"
							size="md"
							label="Review"
							onPress={() => setStep(3)}
							disabled={!selectedWard || !selectedSlot || selectedWard.isFloodSuspended}
						/>
					</View>
				</>
			) : null}

			{step === 3 ? (
				<>
					<Text style={[styles.title, { color: palette.heading }]}>Confirm pickup</Text>

					<View style={[styles.summaryCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
						<Text style={styles.label}>Category</Text>
						<Text style={[styles.categoryTitle, { color: palette.heading }]}>{selectedCategory?.title}</Text>
						<Text style={styles.rate}>{formatFloorRate(ratesByTier[selectedTier])}</Text>

						<Text style={[styles.label, styles.summaryGap]}>Ward</Text>
						<Text style={{ color: palette.heading }}>
							Ward {selectedWard?.wardNumber} · {selectedWard?.wardName}
						</Text>

						<Text style={[styles.label, styles.summaryGap]}>Slot</Text>
						<Text style={{ color: palette.heading }}>{selectedSlot?.label}</Text>
					</View>

					{submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

					<View style={styles.navRow}>
						<Button variant="ghost" size="md" label="Back" onPress={() => setStep(2)} />
						<Button
							variant="gold"
							size="lg"
							label={submitting ? 'Scheduling…' : 'Schedule doorstep pickup'}
							onPress={handleSchedulePickup}
							disabled={submitting || !selectedWard || !selectedSlot}
						/>
					</View>
				</>
			) : null}
		</GladeScreen>
	);
}

const styles = StyleSheet.create({
	stepRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
	step: { fontSize: 12, color: colors.ink500 },
	stepActive: { color: colors.forest600, fontWeight: '700' },
	titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
	title: { fontSize: 22, fontWeight: '500', flex: 1 },
	loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
	errorText: { color: colors.coral600, fontSize: 12, marginBottom: 8 },
	categoryCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
	categoryTitle: { fontSize: 16, fontWeight: '600' },
	rate: { marginTop: 4, color: colors.gold600, fontWeight: '700' },
	apiHint: { fontSize: 10, color: colors.ink300, marginTop: -4, marginBottom: 8 },
	label: { fontSize: 12, color: colors.ink500, fontWeight: '600' },
	select: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
	navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 8 },
	summaryCard: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 4, marginBottom: 12 },
	summaryGap: { marginTop: 12 },
	successCard: { gap: 8, marginBottom: 16 }
});
