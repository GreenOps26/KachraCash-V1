<script lang="ts">
	interface Props {
		lines?: number;
		height?: string;
	}

	let { lines = 3, height = '14px' }: Props = $props();
</script>

<div class="skeleton-stack" aria-hidden="true">
	{#each Array.from({ length: lines }) as _, index (index)}
		<div class="skeleton-line" style="height: {height}; width: {index === lines - 1 ? '72%' : '100%'};"></div>
	{/each}
</div>
