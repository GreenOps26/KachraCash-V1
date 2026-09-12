import bcrypt from 'bcryptjs';
import { db, OrderStatus } from '@kachracash/db';
import { assignPickupOrder } from './wallet-service';

export interface PickupListItem {
	id: string;
	status: string;
	visualTier: string;
	scheduledSlotStart: string;
	scheduledSlotEnd: string;
	wardNumber: number;
	wardName: string;
	citizenName: string | null;
}

export interface PickupDetail {
	id: string;
	status: string;
	visualTier: string;
	scheduledSlotStart: string;
	scheduledSlotEnd: string;
	wardNumber: number;
	wardName: string;
	citizenName: string | null;
	collectorId: string | null;
	settlement: {
		grossAmount: number;
		platformFee: number;
		netPayout: number;
		payoutStatus: string | null;
	} | null;
}

export interface AcceptPickupResult {
	status: 'WEIGHING';
	devOtp?: string;
}

export async function listPickups(filter: {
	status?: OrderStatus;
	collectorId?: string;
} = {}): Promise<PickupListItem[]> {
	const where: {
		status?: OrderStatus;
		assignments?: { some: { collectorId: string } };
	} = {};

	if (filter.status) {
		where.status = filter.status;
	}

	if (filter.collectorId) {
		where.assignments = { some: { collectorId: filter.collectorId } };
	}

	const rows = await db.pickupRequest.findMany({
		where,
		include: {
			region: true,
			citizen: true,
			assignments: { take: 1, orderBy: { matchedAt: 'desc' } }
		},
		orderBy: { scheduledSlotStart: 'asc' },
		take: 50
	});

	return rows.map((row) => ({
		id: row.id,
		status: row.status,
		visualTier: row.visualTier,
		scheduledSlotStart: row.scheduledSlotStart.toISOString(),
		scheduledSlotEnd: row.scheduledSlotEnd.toISOString(),
		wardNumber: row.region.wardNumber,
		wardName: row.region.wardName,
		citizenName: row.citizen.fullName
	}));
}

export async function getPickupDetail(
	requestId: string,
	options: { citizenId?: string } = {}
): Promise<PickupDetail & { devOtp?: string }> {
	const row = await db.pickupRequest.findUnique({
		where: { id: requestId },
		include: {
			region: true,
			citizen: true,
			transaction: { include: { payout: true } },
			assignments: { take: 1, orderBy: { matchedAt: 'desc' } }
		}
	});

	if (!row) {
		throw new Error('PICKUP_NOT_FOUND');
	}

	if (options.citizenId && row.citizenId !== options.citizenId) {
		throw new Error('PICKUP_ACCESS_DENIED');
	}

	const assignment = row.assignments[0];
	const settlement = row.transaction?.completedAt
		? {
				grossAmount: Number(row.transaction.grossAmount),
				platformFee: Number(row.transaction.platformFee),
				netPayout: Number(row.transaction.netPayout),
				payoutStatus: row.transaction.payout?.status ?? null
			}
		: null;

	const detail: PickupDetail & { devOtp?: string } = {
		id: row.id,
		status: row.status,
		visualTier: row.visualTier,
		scheduledSlotStart: row.scheduledSlotStart.toISOString(),
		scheduledSlotEnd: row.scheduledSlotEnd.toISOString(),
		wardNumber: row.region.wardNumber,
		wardName: row.region.wardName,
		citizenName: row.citizen.fullName,
		collectorId: assignment?.collectorId ?? null,
		settlement
	};

	if (
		options.citizenId &&
		row.status === OrderStatus.WEIGHING &&
		process.env.PICKUP_DEV_OTP === 'true'
	) {
		detail.devOtp = resolveDevOtp();
	}

	return detail;
}

export async function acceptPickup(
	requestId: string,
	collectorId: string
): Promise<AcceptPickupResult> {
	const request = await db.pickupRequest.findUnique({ where: { id: requestId } });

	if (!request) {
		throw new Error('PICKUP_NOT_FOUND');
	}

	if (request.status !== OrderStatus.PENDING && request.status !== OrderStatus.ASSIGNED) {
		throw new Error('INVALID_ORDER_STATE');
	}

	await assignPickupOrder(requestId, collectorId);

	const otp = resolveDevOtp();
	const otpHash = await bcrypt.hash(otp, 10);

	await db.transaction.upsert({
		where: { requestId },
		create: { requestId, otpHash },
		update: { otpHash }
	});

	await db.pickupRequest.update({
		where: { id: requestId },
		data: { status: OrderStatus.WEIGHING }
	});

	return {
		status: 'WEIGHING',
		devOtp: process.env.PICKUP_DEV_OTP === 'true' ? otp : undefined
	};
}

function resolveDevOtp(): string {
	if (process.env.PICKUP_DEV_OTP === 'true') {
		return '4829';
	}

	return String(Math.floor(1000 + Math.random() * 9000));
}
