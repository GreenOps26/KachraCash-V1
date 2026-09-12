<script lang="ts">
	import type { Snippet } from 'svelte';

	type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

	interface Props {
		tone?: Tone;
		dot?: boolean;
		children: Snippet;
	}

	let { tone = 'neutral', dot = true, children }: Props = $props();
</script>

<span class="pill pill-{tone}">
	{#if dot}
		<span class="pill-dot" aria-hidden="true"></span>
	{/if}
	{@render children()}
</span>
