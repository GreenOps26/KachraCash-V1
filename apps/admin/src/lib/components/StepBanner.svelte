<script lang="ts">
	interface Props {
		activeStep?: 1 | 2 | 3;
	}

	let { activeStep = 1 }: Props = $props();

	const steps = [
		{ id: 1, label: 'Schedule' },
		{ id: 2, label: 'Weigh transparently' },
		{ id: 3, label: 'Instant UPI payout' }
	] as const;
</script>

<div class="step-banner" role="list" aria-label="Pickup flow">
	{#each steps as step, index (step.id)}
		<span class="step" class:is-active={activeStep === step.id} role="listitem">
			{step.label}
		</span>
		{#if index < steps.length - 1}
			<span class="arrow" aria-hidden="true">→</span>
		{/if}
	{/each}
</div>
