<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		size?: 'md' | 'lg';
		showWordmark?: boolean;
		subtitle?: string;
		children?: Snippet;
	}

	let { size = 'md', showWordmark = true, subtitle, children }: Props = $props();
</script>

<div class="brand-row">
	<div class="brand-mark" class:brand-mark--lg={size === 'lg'} aria-hidden="true">
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M12 2C8 6 5 10 5 14a7 7 0 0014 0c0-4-3-8-7-12z"
				fill="currentColor"
			/>
		</svg>
	</div>
	{#if showWordmark}
		<div>
			<div class="brand-name">KachraCash</div>
			{#if subtitle}
				<div class="brand-sub">{subtitle}</div>
			{/if}
		</div>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</div>
