import type { IconName } from '$lib/components/Icon.svelte';

export interface AdminNavItem {
	href: string;
	label: string;
	description: string;
	icon: IconName;
}

export interface AdminNavGroup {
	label: string;
	items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
	{
		label: 'Operations',
		items: [
			{
				href: '/admin',
				label: 'Dispatch radar',
				description: 'Live pickups and SLA overview',
				icon: 'radar'
			},
			{
				href: '/admin/wards',
				label: 'Ward suspension',
				description: 'Monsoon flood controls',
				icon: 'ward'
			}
		]
	},
	{
		label: 'Finance',
		items: [
			{
				href: '/admin/ledger',
				label: 'Float ledger',
				description: 'Collector wallet balances',
				icon: 'ledger'
			}
		]
	},
	{
		label: 'Configuration',
		items: [
			{
				href: '/admin/rates',
				label: 'Rate cards',
				description: 'Floor rates by SKU',
				icon: 'rates'
			}
		]
	}
];

export function isAdminNavActive(href: string, pathname: string): boolean {
	if (href === '/admin') return pathname === '/admin';
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function adminPageMeta(pathname: string): { title: string; description: string } {
	for (const group of adminNavGroups) {
		for (const item of group.items) {
			if (isAdminNavActive(item.href, pathname)) {
				return { title: item.label, description: item.description };
			}
		}
	}

	return { title: 'Operations console', description: 'KachraCash Guwahati pilot desk' };
}

export function adminBreadcrumbs(pathname: string): Array<{ label: string; href?: string }> {
	const crumbs: Array<{ label: string; href?: string }> = [{ label: 'Admin', href: '/admin' }];

	for (const group of adminNavGroups) {
		for (const item of group.items) {
			if (isAdminNavActive(item.href, pathname) && item.href !== '/admin') {
				crumbs.push({ label: item.label });
				return crumbs;
			}
		}
	}

	if (pathname === '/admin') crumbs.push({ label: 'Dispatch radar' });
	return crumbs;
}
