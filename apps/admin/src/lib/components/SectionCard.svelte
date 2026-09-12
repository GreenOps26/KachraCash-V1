<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		headerActions?: Snippet;
		children: Snippet;
	}

	let { title, description, headerActions, children }: Props = $props();
</script>

<section class="section-card glade-card">
	<header class="section-card-header">
		<div>
			<h2 class="section-card-title">{title}</h2>
			{#if description}
				<p class="section-card-description">{description}</p>
			{/if}
		</div>
		{#if headerActions}
			<div class="section-card-actions">
				{@render headerActions()}
			</div>
		{/if}
	</header>
	<div class="section-card-body">
		{@render children()}
	</div>
</section>
