<script lang="ts">
	import AdminShell from '$lib/components/AdminShell.svelte';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<AdminShell pathname={page.url.pathname}>
	{@render children()}
</AdminShell>
