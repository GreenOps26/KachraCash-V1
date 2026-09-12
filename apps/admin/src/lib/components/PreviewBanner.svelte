<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		label?: string;
	}

	let { label = 'Preview data — not connected to live API yet' }: Props = $props();
</script>

<div class="preview-banner" role="status">
	<Icon name="alert" size={16} />
	<span>{label}</span>
</div>
