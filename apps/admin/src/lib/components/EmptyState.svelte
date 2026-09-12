<script lang="ts">
	import type { Snippet } from 'svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';

	interface Props {
		title: string;
		description?: string;
		tone?: 'neutral' | 'error' | 'loading';
		actions?: Snippet;
	}

	let { title, description, tone = 'neutral', actions }: Props = $props();
</script>

<div class="empty-state" data-tone={tone}>
	{#if tone === 'loading'}
		<Skeleton lines={4} height="12px" />
	{:else}
		<h3 class="empty-state-title">{title}</h3>
		{#if description}
			<p class="empty-state-description">{description}</p>
		{/if}
	{/if}
	{#if actions}
		<div class="empty-state-actions">
			{@render actions()}
		</div>
	{/if}
</div>
