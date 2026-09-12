<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg' | 'field';

	interface Props {
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		class?: string;
		style?: string;
		children: Snippet;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		href,
		class: className = '',
		style: inlineStyle,
		children,
		onclick
	}: Props = $props();

	const classes = $derived(
		[
			'btn',
			`btn-${variant}`,
			size === 'sm' ? 'btn-sm' : '',
			size === 'lg' ? 'btn-lg' : '',
			size === 'field' ? 'btn-field' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#if href}
	<a class={classes} {href} style={inlineStyle} aria-disabled={disabled}>
		{@render children()}
	</a>
{:else}
	<button class={classes} {type} {disabled} {onclick} style={inlineStyle}>
		{@render children()}
	</button>
{/if}
