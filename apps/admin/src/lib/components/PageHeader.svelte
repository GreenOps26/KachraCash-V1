<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Breadcrumb {
		label: string;
		href?: string;
	}

	interface Props {
		eyebrow?: string;
		title: string;
		description?: string;
		breadcrumbs?: Breadcrumb[];
		actions?: Snippet;
	}

	let { eyebrow, title, description, breadcrumbs = [], actions }: Props = $props();
</script>

<header class="page-header">
	<div class="page-header-copy">
		{#if breadcrumbs.length > 0}
			<nav class="breadcrumbs" aria-label="Breadcrumb">
				{#each breadcrumbs as crumb, index (crumb.label)}
					{#if crumb.href}
						<a href={crumb.href}>{crumb.label}</a>
					{:else}
						<span aria-current="page">{crumb.label}</span>
					{/if}
					{#if index < breadcrumbs.length - 1}
						<span class="breadcrumb-sep" aria-hidden="true">/</span>
					{/if}
				{/each}
			</nav>
		{/if}
		{#if eyebrow}
			<p class="page-eyebrow">{eyebrow}</p>
		{/if}
		<h1 class="page-title">{title}</h1>
		{#if description}
			<p class="page-description">{description}</p>
		{/if}
	</div>
	{#if actions}
		<div class="page-header-actions">
			{@render actions()}
		</div>
	{/if}
</header>
