<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SectionCard from '$lib/components/SectionCard.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import { getApiBaseUrl } from '$lib/api';
	import { adminBreadcrumbs } from '$lib/nav';

	interface RateRow {
		sku: string;
		name: string;
		tier: string;
		floorRate: number;
	}

	let rates = $state<RateRow[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const tiers = ['RIGID_CONTAINERS', 'SOFT_FILMS', 'MIXED_BULKY'] as const;

	async function loadRates() {
		try {
			loading = true;
			error = null;
			const rows: RateRow[] = [];
			for (const tier of tiers) {
				const response = await fetch(`${getApiBaseUrl()}/api/v1/rates?tier=${tier}`);
				if (!response.ok) throw new Error('Failed to load rates');
				const payload = (await response.json()) as {
					rates: Array<{ sku: string; name: string; visualTier: string; floorRate: number }>;
				};
				for (const rate of payload.rates) {
					rows.push({
						sku: rate.sku,
						name: rate.name,
						tier: rate.visualTier,
						floorRate: rate.floorRate
					});
				}
			}
			rates = rows;
		} catch {
			error = `Could not load floor rates from ${getApiBaseUrl()}. Start pnpm dev:api.`;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadRates();
	});

	function formatTier(tier: string): string {
		return tier.replaceAll('_', ' ').toLowerCase();
	}
</script>

<svelte:head>
	<title>KachraCash — Rate cards</title>
</svelte:head>

<div class="admin-page">
	<PageHeader
		eyebrow="Pricing configuration"
		title="Rate cards"
		description="Floor rates shown to citizens and collectors. Phase 1 uses fixed cards — no live bidding."
		breadcrumbs={adminBreadcrumbs('/admin/rates')}
	>
		{#snippet actions()}
			<Button variant="outline" size="sm" disabled>Edit rates</Button>
		{/snippet}
	</PageHeader>

	<div class="stat-grid stat-grid-3">
		<StatCard label="Active SKUs" value={loading ? '—' : String(rates.length)} hint="Pilot catalog" icon="rates" />
		<StatCard label="Pricing model" value="Floor" hint="8% platform fee at doorstep" icon="trend" />
		<StatCard label="Versioning" value="v1" hint="Manual admin edits coming soon" icon="check" />
	</div>

	<SectionCard
		title="Current floor rates"
		description="Live from API. Citizens see tier ranges; collectors settle against SKU-level floor rates."
	>
		{#if loading}
			<EmptyState title="Loading rate cards…" tone="loading" />
		{:else if error}
			<EmptyState title="Unable to load rates" description={error} tone="error">
				{#snippet actions()}
					<Button variant="primary" size="sm" onclick={loadRates}>Retry</Button>
				{/snippet}
			</EmptyState>
		{:else}
			<DataTable caption="Current SKU floor rates">
				<thead>
					<tr>
						<th scope="col">SKU</th>
						<th scope="col">Material</th>
						<th scope="col">Visual tier</th>
						<th scope="col" class="cell-right">Floor rate</th>
					</tr>
				</thead>
				<tbody>
					{#each rates as rate (rate.sku)}
						<tr>
							<td class="ward-id">{rate.sku}</td>
							<td><strong>{rate.name}</strong></td>
							<td class="cell-subtext">{formatTier(rate.tier)}</td>
							<td class="cell-right glade-tabular">₹{rate.floorRate.toFixed(2)} / kg</td>
						</tr>
					{/each}
				</tbody>
			</DataTable>
		{/if}
	</SectionCard>
</div>
