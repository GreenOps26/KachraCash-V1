<script lang="ts">
	import type { Snippet } from 'svelte';
	import BrandMark from '$lib/components/BrandMark.svelte';
	import type { GladeApp } from '@kachracash/types';
	import { surfaceForApp } from '@kachracash/types';

	interface Props {
		app: GladeApp;
		subtitle: string;
		headerExtra?: Snippet;
		children: Snippet;
	}

	let { app, subtitle, headerExtra, children }: Props = $props();

	const surface = $derived(surfaceForApp(app));
</script>

<div class="glade-shell" data-glade-app={app} data-glade-surface={surface}>
	<div class="glade-app-main">
		<header class="glade-topbar">
			<BrandMark {subtitle} />
			{#if headerExtra}
				<div class="glade-topbar-extra">
					{@render headerExtra()}
				</div>
			{/if}
		</header>
		<main>
			{@render children()}
		</main>
	</div>
</div>

<style>
	.glade-shell {
		min-height: 100dvh;
		background: var(--glade-page);
		color: var(--glade-text);
	}

	.glade-topbar-extra {
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
