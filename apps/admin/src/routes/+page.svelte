<script lang="ts">
	import BrandMark from '$lib/components/BrandMark.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import StepBanner from '$lib/components/StepBanner.svelte';
</script>

<svelte:head>
	<title>KachraCash — Product hub</title>
	<meta
		name="description"
		content="KachraCash (কচৰা ক্যাশ) — doorstep scrap pickup with BLE weighing and instant UPI payout in Guwahati."
	/>
</svelte:head>

<div class="hub-layout" data-glade-surface="light">
	<header class="hub-header">
		<BrandMark size="lg" subtitle="কচৰা ক্যাশ · Guwahati pilot" />
		<nav class="hub-nav" aria-label="Quick links">
			<a href="/admin" class="hub-nav-link">Admin console</a>
			<a href="/ui-preview.html" class="hub-nav-link" target="_blank" rel="noopener">UI preview</a>
		</nav>
	</header>

	<section class="hub-hero">
		<p class="hub-eyebrow">Circular economy · Northeast India</p>
		<h1 class="hub-title">Schedule. Weigh. Get paid — at your doorstep.</h1>
		<p class="hub-lead">
			KachraCash connects Guwahati residents with verified collectors. Fixed floor rates, live BLE scale
			telemetry, and instant UPI settlement — no haggling, no cash handoffs.
		</p>
		<StepBanner activeStep={1} />
		<div class="hub-cta-row">
			<Button variant="gold" size="lg" href="/citizen">Try citizen booking</Button>
			<Button variant="primary" size="lg" href="/admin">Open ops console</Button>
		</div>
	</section>

	<section class="hub-grid" aria-label="KachraCash applications">
		<article class="hub-card">
			<div class="hub-card-icon" data-tone="citizen">
				<Icon name="calendar" size={22} />
			</div>
			<h2 class="hub-card-title">Citizen app</h2>
			<p class="hub-card-desc">
				3-tap booking for rigid containers, soft films, and bulky metals. Pick your ward, choose a 2-hour slot,
				and track pickup to UPI payout.
			</p>
			<ul class="hub-card-meta">
				<li>Expo · iOS &amp; Android</li>
				<li>Port 8081</li>
			</ul>
			<div class="hub-card-actions">
				<Button variant="gold" href="/citizen">Web preview</Button>
				<Button variant="outline" href="/citizen">Interactive demo</Button>
			</div>
		</article>

		<article class="hub-card">
			<div class="hub-card-icon" data-tone="partner">
				<Icon name="scale" size={22} />
			</div>
			<h2 class="hub-card-title">Partner (collector)</h2>
			<p class="hub-card-desc">
				Android field app with BLE hanging-scale integration. Accept jobs, zero-tare, lock weight from GATT
				telemetry, and settle via citizen OTP.
			</p>
			<ul class="hub-card-meta">
				<li>Expo · Android only</li>
				<li>Port 8082</li>
			</ul>
			<div class="hub-card-actions">
				<Button variant="gold" href="/partner">Web preview</Button>
				<Button variant="outline" href="/partner">BLE simulator</Button>
			</div>
		</article>

		<article class="hub-card">
			<div class="hub-card-icon" data-tone="admin">
				<Icon name="radar" size={22} />
			</div>
			<h2 class="hub-card-title">Admin console</h2>
			<p class="hub-card-desc">
				Operations desk for dispatch radar, ward flood suspension, collector float ledger, and floor rate cards.
			</p>
			<ul class="hub-card-meta">
				<li>SvelteKit 5 · Desktop</li>
				<li>Port 5173</li>
			</ul>
			<div class="hub-card-actions">
				<Button variant="gold" href="/admin">Open console</Button>
				<Button variant="outline" href="/admin/wards">Ward controls</Button>
			</div>
		</article>
	</section>

	<section class="hub-stack">
		<h2 class="hub-section-title">Shared Glade design system</h2>
		<p class="hub-section-desc">
			All three surfaces share one visual language — deep pine greens on warm cream, Fraunces display type, and
			gold CTAs for the primary action on each screen.
		</p>
		<div class="hub-link-row">
			<Button variant="outline" href="/admin/rates">Rate cards</Button>
			<Button variant="outline" href="/admin/ledger">Float ledger</Button>
			<a class="hub-text-link" href="/ui-preview.html" target="_blank" rel="noopener">
				Open full UI preview →
			</a>
		</div>
	</section>

	<footer class="hub-footer">
		<span>GMC pilot · Beltola, Jayanagar, Ganeshguri, Hatigaon, Noonmati</span>
		<span>Phase 1 MVP · Floor rates · BLE · UPI only</span>
	</footer>
</div>
