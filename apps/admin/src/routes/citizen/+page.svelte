<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import GladeShell from '$lib/components/GladeShell.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import PreviewBanner from '$lib/components/PreviewBanner.svelte';
	import StepBanner from '$lib/components/StepBanner.svelte';

	type WizardStep = 1 | 2 | 3;
	type Category = 'rigid' | 'soft' | 'bulky';

	const categories = [
		{
			id: 'rigid' as Category,
			icon: 'bottle' as const,
			title: 'Rigid containers',
			desc: 'PET bottles, HDPE, cans',
			rate: '₹12.00–₹18.00 / kg'
		},
		{
			id: 'soft' as Category,
			icon: 'paper' as const,
			title: 'Soft film & paper',
			desc: 'Cardboard, newspaper',
			rate: '₹6.00–₹10.00 / kg'
		},
		{
			id: 'bulky' as Category,
			icon: 'metal' as const,
			title: 'Bulky & metals',
			desc: 'Appliances, iron, steel',
			rate: '₹22.00–₹35.00 / kg'
		}
	];

	const wards = [
		{ id: 'beltola', label: 'Ward 12 · Beltola', suspended: false },
		{ id: 'jayanagar', label: 'Ward 18 · Jayanagar', suspended: false },
		{ id: 'ganeshguri', label: 'Ward 24 · Ganeshguri', suspended: true }
	];

	const slots = [
		'Today · 2:00 – 4:00 PM',
		'Today · 4:00 – 6:00 PM',
		'Tomorrow · 10:00 AM – 12:00 PM'
	];

	let step = $state<WizardStep>(1);
	let selectedCategory = $state<Category>('rigid');
	let selectedWard = $state('beltola');
	let selectedSlot = $state(0);
	let confirmed = $state(false);

	const activeCategory = $derived(categories.find((c) => c.id === selectedCategory));
	const activeWard = $derived(wards.find((w) => w.id === selectedWard));
	const stepBannerActive = $derived(confirmed ? 3 : step);

	function goToStep(next: WizardStep) {
		step = next;
	}

	function handleSchedule() {
		confirmed = true;
	}

	function resetFlow() {
		step = 1;
		confirmed = false;
	}
</script>

<svelte:head>
	<title>KachraCash — Citizen preview</title>
</svelte:head>

<GladeShell app="citizen" subtitle="Schedule pickup">
	{#snippet headerExtra()}
		<a href="/" class="preview-back-link" aria-label="Back to hub">
			<Icon name="arrow-left" size={16} />
		</a>
	{/snippet}

	<PreviewBanner label="Interactive web preview — connect Expo app on port 8081 for live API" />

	<StepBanner activeStep={stepBannerActive} />

	{#if confirmed}
		<div class="glade-card success-panel">
			<div class="success-icon" aria-hidden="true">
				<Icon name="check" size={28} />
			</div>
			<h2 class="preview-title">Pickup confirmed</h2>
			<p class="preview-muted">
				Request KC-7F2A · status <strong>PENDING</strong>
			</p>
			<p class="preview-highlight">Waiting for a collector to accept your doorstep job.</p>
			<div class="preview-summary">
				<div><span class="preview-label">Category</span><strong>{activeCategory?.title}</strong></div>
				<div><span class="preview-label">Ward</span><strong>{activeWard?.label}</strong></div>
				<div><span class="preview-label">Slot</span><strong>{slots[selectedSlot]}</strong></div>
			</div>
		</div>
		<Button variant="gold" size="lg" onclick={resetFlow}>Schedule another pickup</Button>
	{:else if step === 1}
		<div class="preview-title-row">
			<h2 class="preview-title">Select scrap category</h2>
			<Pill tone="info" dot={false}>Floor rate guaranteed</Pill>
		</div>

		<div class="category-grid">
			{#each categories as category (category.id)}
				<button
					type="button"
					class="category-card"
					class:is-selected={selectedCategory === category.id}
					onclick={() => (selectedCategory = category.id)}
				>
					<div class="category-card-head">
						<span class="category-icon" aria-hidden="true">
							<Icon name={category.icon} size={18} />
						</span>
						<h3>{category.title}</h3>
					</div>
					<p>{category.desc}</p>
					<div class="rate">{category.rate}</div>
				</button>
			{/each}
		</div>

		<Button variant="gold" size="lg" onclick={() => goToStep(2)}>Continue to ward &amp; slot</Button>
	{:else if step === 2}
		<h2 class="preview-title">Ward &amp; pickup slot</h2>

		<p class="field-label">Your ward</p>
		<div class="category-grid">
			{#each wards as ward (ward.id)}
				<button
					type="button"
					class="category-card"
					class:is-selected={selectedWard === ward.id}
					disabled={ward.suspended}
					onclick={() => (selectedWard = ward.id)}
				>
					<h3>{ward.label}</h3>
					{#if ward.suspended}
						<p class="preview-error">Temporarily suspended (flood)</p>
					{:else}
						<p>GMC pilot ward</p>
					{/if}
				</button>
			{/each}
		</div>

		<p class="field-label">2-hour pickup slot</p>
		<div class="slot-list">
			{#each slots as slot, index (slot)}
				<button
					type="button"
					class="slot-btn"
					class:is-selected={selectedSlot === index}
					onclick={() => (selectedSlot = index)}
				>
					<Icon name="calendar" size={16} />
					{slot}
				</button>
			{/each}
		</div>

		<div class="preview-nav-row">
			<Button variant="ghost" onclick={() => goToStep(1)}>Back</Button>
			<Button
				variant="gold"
				disabled={activeWard?.suspended}
				onclick={() => goToStep(3)}
			>
				Review
			</Button>
		</div>
	{:else}
		<h2 class="preview-title">Confirm pickup</h2>

		<div class="glade-card preview-summary">
			<div><span class="preview-label">Category</span><strong>{activeCategory?.title}</strong></div>
			<div class="rate">{activeCategory?.rate}</div>
			<div><span class="preview-label">Ward</span><strong>{activeWard?.label}</strong></div>
			<div><span class="preview-label">Slot</span><strong>{slots[selectedSlot]}</strong></div>
		</div>

		<div class="preview-nav-row">
			<Button variant="ghost" onclick={() => goToStep(2)}>Back</Button>
			<Button variant="gold" size="lg" onclick={handleSchedule}>Schedule doorstep pickup</Button>
		</div>
	{/if}
</GladeShell>
