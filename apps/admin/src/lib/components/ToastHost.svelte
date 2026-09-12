<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { clearToast, toast } from '$lib/toast.svelte';
</script>

{#if toast.current}
	<div class="toast-host" role="status" aria-live="polite">
		<div class="toast toast-{toast.current.tone}">
			{#if toast.current.tone === 'success'}
				<Icon name="check" size={16} />
			{:else}
				<Icon name="alert" size={16} />
			{/if}
			<span>{toast.current.message}</span>
			<button class="toast-close" type="button" aria-label="Dismiss notification" onclick={clearToast}>×</button>
		</div>
	</div>
{/if}
