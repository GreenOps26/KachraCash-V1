<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/admin', { replaceState: true });
	});
</script>

<svelte:head>
	<title>KachraCash — Admin</title>
</svelte:head>

<p style="padding: 24px; color: var(--glade-text-muted);">Opening operations console…</p>
