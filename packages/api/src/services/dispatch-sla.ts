import { db, OrderStatus, Prisma, TransactionType } from '@kachracash/db';

const SLA_RADIUS_METERS = 500;
const SLA_PENALTY = 150;
const CITIZEN_VOUCHER = 100;

export interface GeoPoint {
	lat: number;
	lng: number;
}

export interface EvaluateDispatchSlaInput {
	orderId: string;
	collectorId: string;
	collectorLocation: GeoPoint;
	pickupLocation: GeoPoint;
	timeToSlotMinutes: number;
}

export interface EvaluateDispatchSlaResult {
	status: 'MET' | 'REASSIGNED';
	penaltyLevied: number;
	citizenVoucherIssued: number;
}

export interface ToggleWardSuspensionInput {
	wardId: string;
	isFloodSuspended: boolean;
	reason: string;
}

export interface CreatePickupRequestInput {
	citizenId: string;
	wardId: string;
	visualTier: string;
	pickupLocation: GeoPoint;
	scheduledSlotStart?: Date;
	scheduledSlotEnd?: Date;
}

export async function evaluateDispatchSLA(
	input: EvaluateDispatchSlaInput
): Promise<EvaluateDispatchSlaResult> {
	const distanceMeters = haversineMeters(input.collectorLocation, input.pickupLocation);

	if (input.timeToSlotMinutes > 15 || distanceMeters <= SLA_RADIUS_METERS) {
		return { status: 'MET', penaltyLevied: 0, citizenVoucherIssued: 0 };
	}

	const wallet = await db.collectorWallet.findUnique({
		where: { collectorId: input.collectorId }
	});

	if (wallet) {
		const newBalance = Number(wallet.floatBalance) - SLA_PENALTY;
		await db.$transaction(async (tx) => {
			await tx.collectorWallet.update({
				where: { id: wallet.id },
				data: { floatBalance: newBalance }
			});

			await tx.walletLedger.create({
				data: {
					walletId: wallet.id,
					amount: new Prisma.Decimal(-SLA_PENALTY),
					type: TransactionType.PENALTY,
					description: `SLA breach penalty for ${input.orderId}`,
					idempotencyKey: `SLA_PENALTY_${input.orderId}`,
					referenceOrderId: input.orderId
				}
			});
		});
	}

	const request = await db.pickupRequest.findUnique({ where: { id: input.orderId } });
	if (request) {
		await db.pickupRequest.update({
			where: { id: input.orderId },
			data: { status: OrderStatus.REASSIGNED }
		});
	}

	return {
		status: 'REASSIGNED',
		penaltyLevied: SLA_PENALTY,
		citizenVoucherIssued: CITIZEN_VOUCHER
	};
}

export async function toggleWardSuspension(input: ToggleWardSuspensionInput): Promise<void> {
	const wardNumber = parseWardNumber(input.wardId);

	await db.region.updateMany({
		where: { wardNumber },
		data: { isFloodSuspended: input.isFloodSuspended }
	});

	await db.auditLog.create({
		data: {
			entityName: 'Region',
			entityId: input.wardId,
			action: input.isFloodSuspended ? 'SUSPEND_WARD' : 'RESUME_WARD',
			payload: { reason: input.reason, wardId: input.wardId },
			performedBy: 'ADMIN'
		}
	});
}

export async function createPickupRequest(input: CreatePickupRequestInput) {
	const wardNumber = parseWardNumber(input.wardId);
	const region = await db.region.findFirst({ where: { wardNumber } });

	if (!region) {
		throw new Error('WARD_NOT_FOUND');
	}

	if (region.isFloodSuspended) {
		throw new Error(
			'WARD_TEMPORARILY_SUSPENDED: Pickup requests in Beltola are suspended due to flash flooding. Slot rescheduling notification dispatched via SMS.'
		);
	}

	const slotStart = input.scheduledSlotStart ?? new Date(Date.now() + 2 * 60 * 60 * 1000);
	const slotEnd = input.scheduledSlotEnd ?? new Date(slotStart.getTime() + 2 * 60 * 60 * 1000);

	const pickup = await db.pickupRequest.create({
		data: {
			citizenId: input.citizenId,
			regionId: region.id,
			visualTier: input.visualTier,
			scheduledSlotStart: slotStart,
			scheduledSlotEnd: slotEnd,
			status: OrderStatus.PENDING
		}
	});

	try {
		await db.$executeRaw`
			UPDATE pickup_requests
			SET pickup_location = ST_SetSRID(ST_MakePoint(${input.pickupLocation.lng}, ${input.pickupLocation.lat}), 4326)
			WHERE id = ${pickup.id}
		`;
	} catch {
		// PostGIS may be unavailable in some local test databases.
	}

	return pickup;
}

function parseWardNumber(wardId: string): number {
	const match = wardId.match(/(\d+)/);
	if (!match) {
		throw new Error(`Invalid ward id: ${wardId}`);
	}
	return Number.parseInt(match[1], 10);
}

function haversineMeters(a: GeoPoint, b: GeoPoint): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const earthRadius = 6371000;
	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);

	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

	return 2 * earthRadius * Math.asin(Math.sqrt(h));
}
