<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		caption?: string;
		children: Snippet;
	}

	let { caption, children }: Props = $props();
</script>

<div class="table-scroll" role="region" aria-label={caption ?? 'Data table'}>
	<table class="data-table">
		{#if caption}
			<caption class="sr-only">{caption}</caption>
		{/if}
		{@render children()}
	</table>
</div>
