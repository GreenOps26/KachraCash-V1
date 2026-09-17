<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import GladeShell from '$lib/components/GladeShell.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import PreviewBanner from '$lib/components/PreviewBanner.svelte';

	type ScaleStatus = 'disconnected' | 'scanning' | 'connected';
	type JobPhase = 'queue' | 'weighing' | 'settled';

	let scaleStatus = $state<ScaleStatus>('disconnected');
	let jobPhase = $state<JobPhase>('queue');
	let isTared = $state(false);
	let weightKg = $state(0);
	let lockedWeight = $state<number | null>(null);
	let otp = $state('4829');
	let completionMsg = $state<string | null>(null);

	const floorRate = 14.5;
	const grossAmount = $derived(lockedWeight ? Math.round(lockedWeight * floorRate * 100) / 100 : null);
	const canLock = $derived(scaleStatus === 'connected' && isTared && weightKg > 0 && lockedWeight === null);
	const showOtp = $derived(jobPhase === 'weighing' && lockedWeight !== null);

	const devices = [
		{ id: 'sim-01', name: 'KC-Scale Simulator' },
		{ id: 'ble-02', name: 'Hanging Scale HC-05' }
	];

	function startScan() {
		scaleStatus = 'scanning';
	}

	function connectDevice(id: string) {
		if (id) {
			scaleStatus = 'connected';
			isTared = false;
			weightKg = 0;
			lockedWeight = null;
		}
	}

	function disconnect() {
		scaleStatus = 'disconnected';
		isTared = false;
		weightKg = 0;
		lockedWeight = null;
	}

	function confirmTare() {
		if (scaleStatus === 'connected') isTared = true;
	}

	function lockWeight() {
		if (canLock) lockedWeight = weightKg;
	}

	function addWeight(grams: number) {
		if (scaleStatus === 'connected' && isTared && lockedWeight === null) {
			weightKg = Math.round((weightKg + grams / 1000) * 1000) / 1000;
		}
	}

	function acceptPickup() {
		jobPhase = 'weighing';
		completionMsg = null;
	}

	function completeOrder() {
		if (otp.length !== 4 || !lockedWeight) return;
		jobPhase = 'settled';
		completionMsg = `Settlement complete. Citizen payout INITIATED · ₹${((grossAmount ?? 0) * 0.92).toFixed(2)} net UPI`;
		lockedWeight = null;
		weightKg = 0;
		isTared = false;
		setTimeout(() => {
			jobPhase = 'queue';
		}, 3000);
	}

	function formatWeight(kg: number): string {
		return kg.toFixed(3);
	}
</script>

<svelte:head>
	<title>KachraCash — Partner preview</title>
</svelte:head>

<GladeShell app="partner" subtitle="Collector · field mode">
	{#snippet headerExtra()}
		<a href="/" class="preview-back-link" aria-label="Back to hub">
			<Icon name="arrow-left" size={16} />
		</a>
	{/snippet}

	<PreviewBanner label="BLE simulator preview — use Expo partner app on port 8082 for live pickups" />

	<div class="greet-card partner-greet">
		<div>
			<div class="greet-name">Today's route</div>
			<div class="greet-sub">1 pending · simulator mode</div>
		</div>
		<Pill tone="success" dot={true}>Online</Pill>
	</div>

	{#if completionMsg}
		<div class="alert alert-success">{completionMsg}</div>
	{/if}

	{#if jobPhase === 'queue'}
		<div class="glade-card partner-job">
			<div class="partner-job-head">
				<strong>Priya Sharma</strong>
				<Pill tone="info" dot={false}>Pending</Pill>
			</div>
			<p class="preview-muted">Ward 12 · Beltola · RIGID CONTAINERS</p>
			<Button variant="gold" size="field" onclick={acceptPickup}>Accept pickup</Button>
		</div>
	{:else}
		<div class="glade-card partner-job">
			<div class="partner-job-head">
				<strong>Priya Sharma</strong>
				<Pill tone="warning" dot={true}>Weighing</Pill>
			</div>
			<p class="preview-muted">Ward 12 · Beltola · RIGID CONTAINERS</p>
			<p class="preview-highlight">Pilot OTP for citizen: 4829</p>
		</div>
	{/if}

	<div class="glade-card ble-panel">
		<div class="partner-job-head">
			<strong>BLE hanging scale</strong>
			<Pill
				tone={scaleStatus === 'connected' ? 'success' : 'info'}
				dot={scaleStatus === 'connected'}
			>
				{scaleStatus === 'connected' ? 'GATT stream live' : scaleStatus}
			</Pill>
		</div>
		<p class="preview-muted">Mode: simulator · Service {scaleStatus === 'connected' ? 'KC-Scale Simulator' : 'not paired'}</p>

		{#if scaleStatus === 'disconnected'}
			<Button variant="primary" size="field" onclick={startScan}>
				<Icon name="scale" size={18} />
				Scan for scale
			</Button>
		{/if}

		{#if scaleStatus === 'scanning'}
			<p class="field-label">Nearby scales</p>
			{#each devices as device (device.id)}
				<button type="button" class="device-row" onclick={() => connectDevice(device.id)}>
					<strong>{device.name}</strong>
					<span>{device.id}</span>
				</button>
			{/each}
			<Button variant="ghost" onclick={disconnect}>Cancel scan</Button>
		{/if}

		{#if scaleStatus === 'connected'}
			<Button variant="outline" onclick={disconnect}>Disconnect scale</Button>
		{/if}
	</div>

	<div class="scale-readout">
		<div class="value">{formatWeight(lockedWeight ?? weightKg)} kg</div>
		<div class="label">
			{#if scaleStatus !== 'connected'}
				Connect scale to begin weighing
			{:else if !isTared}
				Zero-tare required — hang empty scale and confirm tare
			{:else if lockedWeight}
				Weight locked · ready for OTP settlement
			{:else}
				Tare confirmed · add scrap to weigh
			{/if}
		</div>
		{#if grossAmount}
			<div class="preview-highlight">Floor settlement · ₹{grossAmount.toFixed(2)} gross</div>
		{/if}
	</div>

	<div class="preview-action-row">
		<Button
			variant="primary"
			size="field"
			disabled={scaleStatus !== 'connected' || lockedWeight !== null}
			onclick={confirmTare}
		>
			Confirm zero tare
		</Button>
		<Button variant="gold" size="field" disabled={!canLock} onclick={lockWeight}>
			{lockedWeight != null ? 'Weight locked' : 'Lock weight'}
		</Button>
	</div>

	{#if scaleStatus === 'connected'}
		<div class="sim-controls">
			<p class="preview-muted">Simulator: add scrap weight via GATT packets</p>
			<div class="preview-action-row">
				<Button variant="outline" onclick={() => addWeight(500)}>+500 g</Button>
				<Button variant="outline" onclick={() => addWeight(1000)}>+1 kg</Button>
			</div>
		</div>
	{/if}

	{#if showOtp}
		<div class="glade-card otp-panel">
			<strong>Citizen OTP</strong>
			<p class="preview-muted">Ask the citizen to share their 4-digit OTP.</p>
			<input
				class="otp-input"
				type="text"
				inputmode="numeric"
				maxlength="4"
				bind:value={otp}
				aria-label="Citizen OTP"
			/>
			<Button
				variant="gold"
				size="field"
				disabled={otp.length !== 4}
				onclick={completeOrder}
			>
				Complete &amp; pay citizen
			</Button>
		</div>
	{/if}
</GladeShell>
