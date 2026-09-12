<script lang="ts">
	import Icon, { type IconName } from '$lib/components/Icon.svelte';

	interface Props {
		label: string;
		value: string;
		hint?: string;
		tone?: 'default' | 'warning' | 'success' | 'danger';
		icon?: IconName;
	}

	let { label, value, hint, tone = 'default', icon }: Props = $props();
</script>

<article class="stat-card" data-tone={tone}>
	<div class="stat-card-top">
		<div class="stat-label">{label}</div>
		{#if icon}
			<div class="stat-icon" aria-hidden="true">
				<Icon name={icon} size={16} />
			</div>
		{/if}
	</div>
	<div class="stat-value glade-tabular">{value}</div>
	{#if hint}
		<div class="stat-hint">{hint}</div>
	{/if}
</article>
