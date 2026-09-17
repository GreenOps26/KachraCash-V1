import type { VisualTier } from '@kachracash/types';
import type { IconName } from '@kachracash/ui/native';

export interface CategoryCardModel {
	tier: VisualTier;
	title: string;
	desc: string;
	icon: IconName;
}

export const CATEGORY_CARDS: CategoryCardModel[] = [
	{
		tier: 'RIGID_CONTAINERS',
		title: 'Rigid containers',
		desc: 'PET bottles, HDPE, cans',
		icon: 'bottle'
	},
	{
		tier: 'SOFT_FILMS',
		title: 'Soft film & paper',
		desc: 'Cardboard, newspaper',
		icon: 'paper'
	},
	{
		tier: 'MIXED_BULKY',
		title: 'Bulky & metals',
		desc: 'Appliances, iron, steel',
		icon: 'metal'
	}
];

export function formatFloorRate(floorRates: number[]): string {
	if (floorRates.length === 0) return 'Rate loading…';

	const min = Math.min(...floorRates);
	const max = Math.max(...floorRates);

	if (min === max) {
		return `₹${min.toFixed(2)} / kg`;
	}

	return `₹${min.toFixed(2)}–${max.toFixed(2)} / kg`;
}
