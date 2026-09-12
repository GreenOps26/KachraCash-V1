<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '$lib/components/Button.svelte';

	interface Props {
		open: boolean;
		title: string;
		confirmLabel: string;
		confirmVariant?: 'primary' | 'gold' | 'danger';
		busy?: boolean;
		onclose: () => void;
		onconfirm: () => void;
		children?: Snippet;
	}

	let {
		open,
		title,
		confirmLabel,
		confirmVariant = 'primary',
		busy = false,
		onclose,
		onconfirm,
		children
	}: Props = $props();
</script>

{#if open}
	<div class="modal-overlay" role="presentation" onclick={onclose}></div>
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<h2 id="modal-title" class="glade-display" style="font-size: 1.25rem; margin: 0 0 12px;">{title}</h2>
		{#if children}
			<div class="modal-body">
				{@render children()}
			</div>
		{/if}
		<div class="modal-actions">
			<Button variant="ghost" disabled={busy} onclick={onclose}>Cancel</Button>
			<Button variant={confirmVariant} disabled={busy} onclick={onconfirm}>{confirmLabel}</Button>
		</div>
	</div>
{/if}
