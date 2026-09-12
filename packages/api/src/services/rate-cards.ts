import { db } from '@kachracash/db';
import { formatWardId } from '@kachracash/types';

export interface FloorRateQuote {
	sku: string;
	name: string;
	visualTier: string;
	description: string | null;
	floorRate: number;
	version: number;
}

export async function listPilotWards() {
	const wards = await db.region.findMany({
		orderBy: { wardNumber: 'asc' },
		select: {
			id: true,
			wardNumber: true,
			wardName: true,
			isFloodSuspended: true
		}
	});

	return wards.map((ward) => ({
		...ward,
		wardId: formatWardId(ward.wardNumber, ward.wardName)
	}));
}

export async function getFloorRatesByTier(visualTier: string): Promise<FloorRateQuote[]> {
	const categories = await db.scrapCategory.findMany({
		where: { visualTier },
		include: {
			floorRates: {
				orderBy: { version: 'desc' },
				take: 1
			}
		},
		orderBy: { sku: 'asc' }
	});

	return categories
		.filter((category) => category.floorRates.length > 0)
		.map((category) => ({
			sku: category.sku,
			name: category.name,
			visualTier: category.visualTier,
			description: category.description,
			floorRate: Number(category.floorRates[0].floorRate),
			version: category.floorRates[0].version
		}));
}
