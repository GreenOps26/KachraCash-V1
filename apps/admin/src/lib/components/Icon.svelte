<script lang="ts">
	export type IconName =
		| 'radar'
		| 'ward'
		| 'ledger'
		| 'rates'
		| 'menu'
		| 'refresh'
		| 'alert'
		| 'check'
		| 'plug'
		| 'users'
		| 'trend';

	interface Props {
		name: IconName;
		size?: number;
		class?: string;
	}

	let { name, size = 18, class: className = '' }: Props = $props();

	const paths: Record<IconName, string> = {
		radar:
			'MM3 12h4l3-9 4 18 3-9h4M4 21h16',
		ward: 'M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Zm0-7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
		ledger:
			'MM3 7h18v10H3V7Zm2 12h14M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2',
		rates:
			'MM7 7h10M7 12h10M7 17h6M5 3h14a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z',
		menu: 'M4 7h16M4 12h16M4 17h16',
		refresh:
			'MM21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6M3 12a9 9 0 1 0 2.64 6.36M3 21v-6h6',
		alert:
			'MM12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
		check: 'M20 6 9 17l-5-5',
		plug:
			'MM12 22v-5M9 8V2M15 8V2M7 13h10a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-3a2 2 0 0 1 2-2Z',
		users:
			'MM16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6',
		trend: 'M3 17l6-6 4 4 8-8M14 7h7v7'
	};
</script>

<svg
	class="ui-icon {className}"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d={paths[name]} />
</svg>
