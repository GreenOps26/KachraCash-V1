<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import BrandMark from '$lib/components/BrandMark.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import { fetchHealth, getApiBaseUrl } from '$lib/api';
	import { adminNavGroups, adminPageMeta, isAdminNavActive } from '$lib/nav';

	interface Props {
		pathname: string;
		children: Snippet;
	}

	let { pathname, children }: Props = $props();

	let mobileNavOpen = $state(false);
	let apiOnline = $state<boolean | null>(null);

	const pageMeta = $derived(adminPageMeta(pathname));

	onMount(() => {
		checkApiHealth();
	});

	async function checkApiHealth() {
		try {
			const health = await fetchHealth();
			apiOnline = health.status === 'ok';
		} catch {
			apiOnline = false;
		}
	}

	function closeMobileNav() {
		mobileNavOpen = false;
	}
</script>

<div class="glade-admin-layout" data-glade-app="admin" data-glade-surface="light">
	<ToastHost />

	{#if mobileNavOpen}
		<button class="sidebar-scrim" aria-label="Close navigation" onclick={closeMobileNav}></button>
	{/if}

	<aside id="admin-sidebar" class="glade-sidebar" class:is-open={mobileNavOpen}>
		<BrandMark subtitle="Operations console" />

		<nav class="sidebar-nav" aria-label="Admin navigation">
			{#each adminNavGroups as group (group.label)}
				<div class="sidebar-group">
					<p class="sidebar-group-label">{group.label}</p>
					{#each group.items as item (item.href)}
						<a
							href={item.href}
							class="glade-side-link"
							class:is-active={isAdminNavActive(item.href, pathname)}
							aria-current={isAdminNavActive(item.href, pathname) ? 'page' : undefined}
							onclick={closeMobileNav}
						>
							<span class="side-link-icon" aria-hidden="true">
								<Icon name={item.icon} size={16} />
							</span>
							<span class="side-link-copy">
								<span class="side-link-label">{item.label}</span>
								<span class="side-link-desc">{item.description}</span>
							</span>
						</a>
					{/each}
				</div>
			{/each}
		</nav>

		<footer class="sidebar-footer">
			<div class="api-status" data-online={apiOnline}>
				<Icon name="plug" size={14} />
				<span class="api-status-dot" aria-hidden="true"></span>
				<span>
					{#if apiOnline === null}
						Checking API…
					{:else if apiOnline}
						API connected
					{:else}
						API offline — start pnpm dev:api
					{/if}
				</span>
			</div>
			<p class="sidebar-meta">GMC pilot · 5 wards</p>
			<p class="sidebar-meta sidebar-meta-mono">{getApiBaseUrl()}</p>
		</footer>
	</aside>

	<div class="glade-admin-content">
		<header class="admin-topbar">
			<div class="admin-topbar-left">
				<button
					class="mobile-nav-toggle"
					type="button"
					aria-expanded={mobileNavOpen}
					aria-controls="admin-sidebar"
					onclick={() => (mobileNavOpen = !mobileNavOpen)}
				>
					<Icon name="menu" size={16} />
					<span>Menu</span>
				</button>
				<div>
					<p class="admin-topbar-eyebrow">Guwahati ops desk</p>
					<p class="admin-topbar-title">{pageMeta.title}</p>
				</div>
			</div>
			<div class="admin-topbar-right">
				<span class="tag tag-pilot">Pilot build</span>
				<span class="tag tag-team">Team access</span>
			</div>
		</header>

		<main class="glade-admin-main">
			{@render children()}
		</main>
	</div>
</div>
