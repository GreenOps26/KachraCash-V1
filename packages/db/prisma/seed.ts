import { PrismaClient, Prisma } from '@prisma/client';

const db = new PrismaClient();

/** Stable dev citizen id — set EXPO_PUBLIC_DEV_CITIZEN_ID in citizen app */
export const DEMO_CITIZEN_ID = '00000000-0000-4000-8000-000000000001';

/** Stable dev collector id — set EXPO_PUBLIC_DEV_COLLECTOR_ID in partner app */
export const DEMO_COLLECTOR_ID = '00000000-0000-4000-8000-000000000002';

const PILOT_WARDS = [
	{ wardNumber: 28, wardName: 'Beltola' },
	{ wardNumber: 24, wardName: 'Jayanagar' },
	{ wardNumber: 29, wardName: 'Ganeshguri' },
	{ wardNumber: 15, wardName: 'Noonmati' },
	{ wardNumber: 30, wardName: 'Wireless / Hatigaon' }
] as const;

const CATEGORIES = [
	{
		sku: 'PET_RIGID',
		name: 'PET bottles',
		visualTier: 'RIGID_CONTAINERS',
		swmStream: 'DRY_RECYCLABLE',
		description: 'PET bottles, HDPE, cans',
		floorRate: 16.0,
		nationalIndex: 22.0,
		freight: 1.2,
		handling: 1.8
	},
	{
		sku: 'HDPE_RIGID',
		name: 'HDPE containers',
		visualTier: 'RIGID_CONTAINERS',
		swmStream: 'DRY_RECYCLABLE',
		description: 'Rigid plastic containers',
		floorRate: 16.0,
		nationalIndex: 22.0,
		freight: 1.2,
		handling: 1.8
	},
	{
		sku: 'CARDBOARD',
		name: 'Cardboard & paper',
		visualTier: 'SOFT_FILMS',
		swmStream: 'DRY_RECYCLABLE',
		description: 'Cardboard, newspaper, soft film',
		floorRate: 12.0,
		nationalIndex: 18.0,
		freight: 1.2,
		handling: 1.5
	},
	{
		sku: 'MIXED_METAL',
		name: 'Bulky & metals',
		visualTier: 'MIXED_BULKY',
		swmStream: 'DRY_RECYCLABLE',
		description: 'Appliances, iron, steel',
		floorRate: 28.0,
		nationalIndex: 36.0,
		freight: 1.2,
		handling: 2.0
	}
] as const;

async function main() {
	console.log('Seeding pilot wards...');
	for (const ward of PILOT_WARDS) {
		await db.region.upsert({
			where: { wardNumber: ward.wardNumber },
			update: { wardName: ward.wardName, isFloodSuspended: false },
			create: {
				wardNumber: ward.wardNumber,
				wardName: ward.wardName,
				isFloodSuspended: false
			}
		});
	}

	console.log('Seeding scrap categories and floor rate cards...');
	for (const category of CATEGORIES) {
		const record = await db.scrapCategory.upsert({
			where: { sku: category.sku },
			update: {
				name: category.name,
				visualTier: category.visualTier,
				swmStream: category.swmStream,
				description: category.description
			},
			create: {
				sku: category.sku,
				name: category.name,
				visualTier: category.visualTier,
				swmStream: category.swmStream,
				description: category.description
			}
		});

		const existingRate = await db.floorRateCard.findFirst({
			where: { categoryId: record.id, version: 1 }
		});

		if (!existingRate) {
			await db.floorRateCard.create({
				data: {
					categoryId: record.id,
					nationalIndexRate: new Prisma.Decimal(category.nationalIndex),
					freightOffset: new Prisma.Decimal(category.freight),
					handlingOffset: new Prisma.Decimal(category.handling),
					floorRate: new Prisma.Decimal(category.floorRate),
					version: 1
				}
			});
		}
	}

	const beltola = await db.region.findFirst({ where: { wardNumber: 28 } });

	console.log('Seeding demo citizen for dev pickup flow...');
	await db.citizen.upsert({
		where: { id: DEMO_CITIZEN_ID },
		update: {
			fullName: 'Demo Citizen',
			upiVpa: 'demo.citizen@upi',
			regionId: beltola?.id ?? null
		},
		create: {
			id: DEMO_CITIZEN_ID,
			phoneNumber: '+919876543210',
			fullName: 'Demo Citizen',
			upiVpa: 'demo.citizen@upi',
			regionId: beltola?.id ?? null
		}
	});

	console.log('Seeding demo collector for dev partner flow...');
	await db.collector.upsert({
		where: { id: DEMO_COLLECTOR_ID },
		update: {
			fullName: 'Babul Das',
			isOnline: true
		},
		create: {
			id: DEMO_COLLECTOR_ID,
			phoneNumber: '+919876543211',
			fullName: 'Babul Das',
			assistedKycToken: 'kyc_demo_collector',
			assignedCartQrId: 'qr_demo_collector',
			isOnline: true
		}
	});

	await db.collectorWallet.upsert({
		where: { collectorId: DEMO_COLLECTOR_ID },
		update: {
			floatBalance: new Prisma.Decimal(5000)
		},
		create: {
			collectorId: DEMO_COLLECTOR_ID,
			floatBalance: new Prisma.Decimal(5000),
			minThreshold: new Prisma.Decimal(2000)
		}
	});

	console.log('Seed complete.');
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
