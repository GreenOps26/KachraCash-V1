import { db, OrderStatus, Prisma } from '@kachracash/db';

export async function cleanDatabase(): Promise<void> {
	await db.walletLedger.deleteMany();
	await db.payout.deleteMany();
	await db.transactionItem.deleteMany();
	await db.transaction.deleteMany();
	await db.pickupAssignment.deleteMany();
	await db.pickupRequest.deleteMany();
	await db.rating.deleteMany();
	await db.collectorDevice.deleteMany();
	await db.collectorWallet.deleteMany();
	await db.collector.deleteMany();
	await db.citizen.deleteMany();
	await db.auditLog.deleteMany();
}

export async function createTestUser(role: 'CITIZEN' | 'COLLECTOR') {
	const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

	if (role === 'COLLECTOR') {
		return db.collector.create({
			data: {
				phoneNumber: `+9199${suffix.slice(-8)}`,
				fullName: 'Test Collector',
				assistedKycToken: `kyc_${suffix}`,
				assignedCartQrId: `qr_${suffix}`
			}
		});
	}

	return db.citizen.create({
		data: {
			phoneNumber: `+9188${suffix.slice(-8)}`,
			fullName: 'Test Citizen'
		}
	});
}

export async function createTestWallet(collectorId: string, balance: number) {
	return db.collectorWallet.create({
		data: {
			collectorId,
			floatBalance: new Prisma.Decimal(balance),
			minThreshold: new Prisma.Decimal(2000)
		}
	});
}

export async function ensureBeltolaRegion() {
	return db.region.upsert({
		where: { wardNumber: 28 },
		update: { isFloodSuspended: false },
		create: {
			wardNumber: 28,
			wardName: 'Beltola',
			isFloodSuspended: false
		}
	});
}

export async function createWeighingOrder({
	orderId,
	citizenId,
	regionId,
	collectorId
}: {
	orderId: string;
	citizenId: string;
	regionId: string;
	collectorId: string;
}) {
	const slotStart = new Date(Date.now() + 60 * 60 * 1000);
	const slotEnd = new Date(slotStart.getTime() + 2 * 60 * 60 * 1000);

	await db.pickupRequest.create({
		data: {
			id: orderId,
			citizenId,
			regionId,
			visualTier: 'RIGID_CONTAINERS',
			scheduledSlotStart: slotStart,
			scheduledSlotEnd: slotEnd,
			status: OrderStatus.WEIGHING
		}
	});

	await db.pickupAssignment.create({
		data: {
			requestId: orderId,
			collectorId,
			proximityMeters: 120,
			slaStatus: 'MET'
		}
	});
}
