<script lang="ts">
	import { onMount } from 'svelte';
	import type { WardSummary } from '@kachracash/types';
	import Button from '$lib/components/Button.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import SectionCard from '$lib/components/SectionCard.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import { fetchDispatchAssignments, fetchWards, type DispatchAssignmentRow } from '$lib/api';
	import { adminBreadcrumbs } from '$lib/nav';

	let wards = $state<WardSummary[]>([]);
	let assignments = $state<DispatchAssignmentRow[]>([]);
	let wardsLoading = $state(true);
	let assignmentsLoading = $state(true);

	const suspendedWards = $derived(wards.filter((ward) => ward.isFloodSuspended));
	const activeWards = $derived(wards.filter((ward) => !ward.isFloodSuspended));

	onMount(async () => {
		try {
			[wards, assignments] = await Promise.all([fetchWards(), fetchDispatchAssignments()]);
		} finally {
			wardsLoading = false;
			assignmentsLoading = false;
		}
	});
</script>

<svelte:head>
	<title>KachraCash — Dispatch radar</title>
</svelte:head>

<div class="admin-page">
	<PageHeader
		eyebrow="Saturday shift overview"
		title="Dispatch radar"
		description="Monitor active doorstep jobs, SLA risk, and ward availability across the GMC pilot."
		breadcrumbs={adminBreadcrumbs('/admin')}
	>
		{#snippet actions()}
			<Button variant="outline" size="sm" href="/admin/wards">Ward controls</Button>
			<Button variant="gold" size="sm" href="/admin/ledger">Float ledger</Button>
		{/snippet}
	</PageHeader>

	<div class="stat-grid">
		<StatCard
			label="Active pickups"
			value={assignmentsLoading ? '—' : String(assignments.length)}
			hint="Live queue from API"
			icon="radar"
		/>
		<StatCard label="SLA breaches (T-15)" value="2" hint="Needs reassignment" tone="warning" icon="alert" />
		<StatCard label="UPI success rate" value="100%" hint="Last 24 hours" tone="success" icon="trend" />
		<StatCard
			label="Wards suspended"
			value={wardsLoading ? '—' : String(suspendedWards.length)}
			hint={wardsLoading ? 'Loading ward status…' : `${activeWards.length} wards accepting pickups`}
			tone={suspendedWards.length > 0 ? 'danger' : 'default'}
			icon="ward"
		/>
	</div>

	<div class="admin-two-col">
		<SectionCard title="Live assignments" description="Doorstep jobs currently in progress.">
			{#if assignmentsLoading}
				<EmptyState title="Loading assignments…" tone="loading" />
			{:else if assignments.length === 0}
				<EmptyState title="No active pickups" description="Book a pickup from the citizen app to populate this queue." />
			{:else}
			<DataTable caption="Live pickup assignments">
				<thead>
					<tr>
						<th scope="col">Ward</th>
						<th scope="col">Collector</th>
						<th scope="col">Status</th>
						<th scope="col" class="cell-right">Amount</th>
					</tr>
				</thead>
				<tbody>
					{#each assignments as job (job.id)}
						<tr>
							<td><strong>{job.wardLabel}</strong></td>
							<td>{job.collectorName}</td>
							<td><Pill tone={job.tone}>{job.status}</Pill></td>
							<td class="cell-right glade-tabular">{job.amount}</td>
						</tr>
					{/each}
				</tbody>
			</DataTable>
			{/if}
		</SectionCard>

		<div class="admin-stack">
			<SectionCard title="Ward status" description="Live from API — suspend flooded streets immediately.">
				{#if wardsLoading}
					<EmptyState title="Loading wards…" tone="loading" />
				{:else if wards.length === 0}
					<EmptyState title="No wards returned" description="Check API connection and seed data." tone="error" />
				{:else}
					<ul class="ward-status-list">
						{#each wards as ward (ward.id)}
							<li class="ward-status-item">
								<div>
									<strong>Ward {ward.wardNumber}</strong>
									<span>{ward.wardName}</span>
								</div>
								{#if ward.isFloodSuspended}
									<Pill tone="danger">Suspended</Pill>
								{:else}
									<Pill tone="success">Active</Pill>
								{/if}
								</li>
						{/each}
					</ul>
					<Button variant="primary" size="sm" href="/admin/wards">Manage ward suspension</Button>
				{/if}
			</SectionCard>

			<SectionCard title="Shift checklist" description="Quick actions for the ops desk each morning.">
				<ul class="checklist">
					<li>Confirm collector float balances above ₹2,000</li>
					<li>Review suspended wards after overnight rain</li>
					<li>Verify floor rates match published GMC pilot card</li>
					<li>Watch UPI payout failures in float ledger</li>
				</ul>
			</SectionCard>
		</div>
	</div>
</div>
