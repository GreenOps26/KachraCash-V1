<script lang="ts">
	import { onMount } from 'svelte';
	import type { WardSummary } from '@kachracash/types';
	import Button from '$lib/components/Button.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import SectionCard from '$lib/components/SectionCard.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { fetchWards, getApiBaseUrl, suspendWard } from '$lib/api';
	import { adminBreadcrumbs } from '$lib/nav';
	import { showToast } from '$lib/toast.svelte';

	let wards = $state<WardSummary[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let actionError = $state<string | null>(null);
	let busy = $state(false);

	let modalOpen = $state(false);
	let modalMode = $state<'suspend' | 'resume'>('suspend');
	let selectedWard = $state<WardSummary | null>(null);
	let reason = $state('');
	let triggerSms = $state(true);

	const suspendedCount = $derived(wards.filter((ward) => ward.isFloodSuspended).length);
	const activeCount = $derived(wards.length - suspendedCount);

	onMount(() => {
		loadWards();
	});

	async function loadWards() {
		try {
			loading = true;
			error = null;
			wards = await fetchWards();
		} catch {
			error = `Could not load wards from ${getApiBaseUrl()}. Start pnpm dev:api.`;
		} finally {
			loading = false;
		}
	}

	function openSuspendModal(ward: WardSummary) {
		selectedWard = ward;
		modalMode = 'suspend';
		reason = '';
		triggerSms = true;
		actionError = null;
		modalOpen = true;
	}

	function openResumeModal(ward: WardSummary) {
		selectedWard = ward;
		modalMode = 'resume';
		reason = 'Roads passable — resuming scheduled pickups';
		triggerSms = false;
		actionError = null;
		modalOpen = true;
	}

	function closeModal() {
		if (busy) return;
		modalOpen = false;
		selectedWard = null;
	}

	async function confirmModal() {
		if (!selectedWard) return;
		if (reason.trim().length < 3) {
			actionError = 'Enter a reason (at least 3 characters).';
			return;
		}

		busy = true;
		actionError = null;

		try {
			await suspendWard(selectedWard.wardId, {
				isFloodSuspended: modalMode === 'suspend',
				reason: reason.trim(),
				triggerCustomerRescheduleSms: modalMode === 'suspend' ? triggerSms : false
			});

			await loadWards();
			showToast(
				modalMode === 'suspend'
					? `${selectedWard.wardName} suspended — new pickups blocked`
					: `${selectedWard.wardName} resumed — pickups enabled`,
				'success'
			);
			closeModal();
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Ward update failed';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>KachraCash — Ward suspension</title>
</svelte:head>

<div class="admin-page">
	<PageHeader
		eyebrow="Monsoon operations"
		title="Ward suspension"
		description="Manually pause new citizen pickups when streets are flooded. Changes apply immediately across the citizen app."
		breadcrumbs={adminBreadcrumbs('/admin/wards')}
	>
		{#snippet actions()}
			<Button variant="outline" size="sm" onclick={loadWards} disabled={loading}>
				<Icon name="refresh" size={14} />
				Refresh
			</Button>
		{/snippet}
	</PageHeader>

	<div class="stat-grid stat-grid-3">
		<StatCard label="Pilot wards" value={loading ? '—' : String(wards.length)} hint="GMC pilot coverage" icon="ward" />
		<StatCard label="Active" value={loading ? '—' : String(activeCount)} hint="Accepting new pickups" tone="success" icon="check" />
		<StatCard
			label="Suspended"
			value={loading ? '—' : String(suspendedCount)}
			hint="Blocked for new bookings"
			tone={suspendedCount > 0 ? 'danger' : 'default'}
			icon="alert"
		/>
	</div>

	<div class="alert alert-warning">
		<strong>Flash flood protocol.</strong> Suspending a ward blocks new citizen pickups and should trigger reschedule SMS. Resume only when collectors can safely reach doorsteps.
	</div>

	<SectionCard title="Pilot ward controls" description="Each row maps to a GMC ward in the database.">
		{#if loading}
			<EmptyState title="Loading pilot wards…" tone="loading" />
		{:else if error}
			<EmptyState title="Unable to load wards" description={error} tone="error">
				{#snippet actions()}
					<Button variant="primary" size="sm" onclick={loadWards}>Retry</Button>
				{/snippet}
			</EmptyState>
		{:else}
			<DataTable caption="Pilot ward suspension controls">
				<thead>
					<tr>
						<th scope="col">Ward</th>
						<th scope="col">System ID</th>
						<th scope="col">Status</th>
						<th scope="col" class="cell-right">Action</th>
					</tr>
				</thead>
				<tbody>
					{#each wards as ward (ward.id)}
						<tr>
							<td>
								<strong>Ward {ward.wardNumber}</strong>
								<div class="cell-subtext">{ward.wardName}</div>
							</td>
							<td class="ward-id">{ward.wardId}</td>
							<td>
								{#if ward.isFloodSuspended}
									<Pill tone="danger">Suspended</Pill>
								{:else}
									<Pill tone="success">Active</Pill>
								{/if}
							</td>
							<td class="cell-right">
								{#if ward.isFloodSuspended}
									<Button variant="primary" size="sm" onclick={() => openResumeModal(ward)}>Resume</Button>
								{:else}
									<Button variant="danger" size="sm" onclick={() => openSuspendModal(ward)}>Suspend</Button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</DataTable>
		{/if}
	</SectionCard>
</div>

<ConfirmModal
	open={modalOpen}
	title={modalMode === 'suspend' ? `Suspend ${selectedWard?.wardName ?? 'ward'}?` : `Resume ${selectedWard?.wardName ?? 'ward'}?`}
	confirmLabel={busy ? 'Saving…' : modalMode === 'suspend' ? 'Confirm suspension' : 'Confirm resume'}
	confirmVariant={modalMode === 'suspend' ? 'danger' : 'primary'}
	busy={busy}
	onclose={closeModal}
	onconfirm={confirmModal}
>
	<label class="field-label" for="ward-reason">Reason (required)</label>
	<textarea
		id="ward-reason"
		class="field-input"
		rows="3"
		bind:value={reason}
		placeholder="e.g. Beltola Survey Bypass waterlogged after heavy rain"
	></textarea>

	{#if modalMode === 'suspend'}
		<label class="checkbox-row">
			<input type="checkbox" bind:checked={triggerSms} />
			<span>Trigger customer reschedule SMS</span>
		</label>
	{/if}

	{#if actionError}
		<p class="form-error" style="margin-top: 12px;">{actionError}</p>
	{/if}
</ConfirmModal>
