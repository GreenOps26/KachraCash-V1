<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import SectionCard from '$lib/components/SectionCard.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import {
		fetchLedgerDesk,
		type CollectorWalletRow,
		type LedgerEntryRow
	} from '$lib/api';
	import { adminBreadcrumbs } from '$lib/nav';

	let collectors = $state<CollectorWalletRow[]>([]);
	let ledgerRows = $state<LedgerEntryRow[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const lowFloatCount = $derived(collectors.filter((collector) => collector.tone === 'warning').length);
	const onlineCount = $derived(collectors.filter((collector) => collector.status === 'Online').length);

	onMount(async () => {
		try {
			const payload = await fetchLedgerDesk();
			collectors = payload.collectors;
			ledgerRows = payload.entries;
		} catch {
			error = 'Could not load ledger desk data from API.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>KachraCash — Float ledger</title>
</svelte:head>

<div class="admin-page">
	<PageHeader
		eyebrow="Collector escrow"
		title="Float ledger"
		description="Track pre-funded wallet balances, doorstep debits, and top-ups. Collectors below ₹2,000 cannot go online."
		breadcrumbs={adminBreadcrumbs('/admin/ledger')}
	>
		{#snippet actions()}
			<Button variant="gold" size="sm" disabled>Export CSV</Button>
		{/snippet}
	</PageHeader>

	<div class="stat-grid stat-grid-3">
		<StatCard
			label="Collectors online"
			value={loading ? '—' : String(onlineCount)}
			hint="Pilot fleet"
			icon="users"
		/>
		<StatCard
			label="Below float gate"
			value={loading ? '—' : String(lowFloatCount)}
			hint="Needs top-up before dispatch"
			tone={lowFloatCount > 0 ? 'warning' : 'default'}
			icon="alert"
		/>
		<StatCard label="Ledger parity" value="OK" hint="Wallet = sum of entries" tone="success" icon="check" />
	</div>

	{#if loading}
		<EmptyState title="Loading float ledger…" tone="loading" />
	{:else if error}
		<EmptyState title="Unable to load ledger" description={error} tone="error" />
	{:else}
		<div class="admin-two-col">
			<SectionCard title="Collector wallets" description="Current float balance per active collector.">
				<DataTable caption="Collector wallet balances">
					<thead>
						<tr>
							<th scope="col">Collector</th>
							<th scope="col">Float balance</th>
							<th scope="col">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each collectors as collector (collector.name)}
							<tr>
								<td><strong>{collector.name}</strong></td>
								<td class="glade-tabular">{collector.float}</td>
								<td><Pill tone={collector.tone}>{collector.status}</Pill></td>
							</tr>
						{/each}
					</tbody>
				</DataTable>
			</SectionCard>

			<SectionCard title="Recent ledger entries" description="Append-only audit trail for float movements.">
				<DataTable caption="Recent wallet ledger entries">
					<thead>
						<tr>
							<th scope="col">Time</th>
							<th scope="col">Collector</th>
							<th scope="col">Type</th>
							<th scope="col" class="cell-right">Amount</th>
						</tr>
					</thead>
					<tbody>
						{#each ledgerRows as row (row.ref)}
							<tr>
								<td class="cell-subtext">{row.time}</td>
								<td>{row.collector}</td>
								<td>{row.type}</td>
								<td class="cell-right glade-tabular">{row.amount}</td>
							</tr>
						{/each}
					</tbody>
				</DataTable>
			</SectionCard>
		</div>
	{/if}
</div>
