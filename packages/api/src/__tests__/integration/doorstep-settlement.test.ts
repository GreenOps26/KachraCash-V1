import { beforeEach, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { OrderStatus } from '@kachracash/db';
import { completeDoorstepSettlement } from '../../services/wallet-service';
import {
	cleanDatabase,
	createTestUser,
	createTestWallet,
	createWeighingOrder,
	ensureBeltolaRegion
} from '../fixtures/database.fixture';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('Doorstep OTP Settlement Integration', () => {
	beforeEach(async () => {
		await cleanDatabase();
	});

	it('should complete settlement with flat 8% platform fee on MVP transactions', async () => {
		const collector = await createTestUser('COLLECTOR');
		await createTestWallet(collector.id, 5000.0);
		const citizen = await createTestUser('CITIZEN');
		const region = await ensureBeltolaRegion();

		await createWeighingOrder({
			orderId: 'ORD_SETTLE_001',
			citizenId: citizen.id,
			regionId: region.id,
			collectorId: collector.id
		});

		const otp = '4829';
		const otpHash = await bcrypt.hash(otp, 10);

		const result = await completeDoorstepSettlement({
			orderId: 'ORD_SETTLE_001',
			collectorId: collector.id,
			otp,
			otpHash,
			grossAmount: 250.0,
			takeRatePercentage: 0.08,
			bleItems: [{ categoryId: 'PET_RIGID', weightKg: 10.0, unitRate: 25.0 }]
		});

		expect(result.platformFee).toBe(20.0);
		expect(result.netPayout).toBe(230.0);
		expect(result.status).toBe('COMPLETED');
	});

	it('should REJECT settlement with incorrect OTP', async () => {
		const collector = await createTestUser('COLLECTOR');
		await createTestWallet(collector.id, 5000.0);
		const citizen = await createTestUser('CITIZEN');
		const region = await ensureBeltolaRegion();

		await createWeighingOrder({
			orderId: 'ORD_BAD_OTP',
			citizenId: citizen.id,
			regionId: region.id,
			collectorId: collector.id
		});

		const otpHash = await bcrypt.hash('4829', 10);

		await expect(
			completeDoorstepSettlement({
				orderId: 'ORD_BAD_OTP',
				collectorId: collector.id,
				otp: '0000',
				otpHash,
				grossAmount: 100.0,
				takeRatePercentage: 0.08,
				bleItems: []
			})
		).rejects.toThrowError('INVALID_OTP');
	});

	it('should REJECT settlement when order status is not WEIGHING', async () => {
		const collector = await createTestUser('COLLECTOR');
		await createTestWallet(collector.id, 5000.0);
		const citizen = await createTestUser('CITIZEN');
		const region = await ensureBeltolaRegion();

		await createWeighingOrder({
			orderId: 'ORD_NOT_WEIGHING',
			citizenId: citizen.id,
			regionId: region.id,
			collectorId: collector.id
		});

		const { db } = await import('@kachracash/db');
		await db.pickupRequest.update({
			where: { id: 'ORD_NOT_WEIGHING' },
			data: { status: OrderStatus.ASSIGNED }
		});

		const otpHash = await bcrypt.hash('4829', 10);

		await expect(
			completeDoorstepSettlement({
				orderId: 'ORD_NOT_WEIGHING',
				collectorId: collector.id,
				otp: '4829',
				otpHash,
				grossAmount: 100.0,
				takeRatePercentage: 0.08,
				bleItems: []
			})
		).rejects.toThrowError('INVALID_ORDER_STATE');
	});
});
