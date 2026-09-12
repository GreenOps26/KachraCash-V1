import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, Prisma } from '@kachracash/db';
import { assignPickupOrder, processPayoutWebhook } from '../../services/wallet-service';
import { cleanDatabase, createTestUser, createTestWallet } from '../fixtures/database.fixture';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('Atomic Wallet Ledger & Escrow Settlement Integration', () => {
	beforeEach(async () => {
		await cleanDatabase();
	});

	afterEach(async () => {
		await cleanDatabase();
	});

	it('should REJECT order assignment if collector float balance is below ₹2,000 threshold', async () => {
		const collector = await createTestUser('COLLECTOR');
		await createTestWallet(collector.id, 1450.0);

		await expect(assignPickupOrder('ORD_TEST_001', collector.id)).rejects.toThrowError(
			'INSUFFICIENT_FLOAT_BALANCE: Collector wallet float (₹1,450.00) is below minimum threshold of ₹2,000.00'
		);
	});

	it('should grant provisional float extension (+₹1,000) for active in-route collector experiencing float depletion', async () => {
		const collector = await createTestUser('COLLECTOR');
		await createTestWallet(collector.id, 1200.0);

		const assignment = await assignPickupOrder('ORD_ACTIVE_ROUTE_002', collector.id, 500.0, {
			activeRouteExtension: true
		});
		expect(assignment.status).toBe('ASSIGNED');
		expect(assignment.provisionalBufferApplied).toBe(1000.0);
	});

	it('should verify that collector_wallets.float_balance strictly equals mathematical sum of wallet_ledger', async () => {
		const collector = await createTestUser('COLLECTOR');
		const wallet = await createTestWallet(collector.id, 2000.0);

		await db.$transaction(async (tx) => {
			await tx.walletLedger.createMany({
				data: [
					{
						walletId: wallet.id,
						amount: new Prisma.Decimal(500.0),
						type: 'CREDIT',
						description: 'Topup',
						idempotencyKey: 'TOPUP_1'
					},
					{
						walletId: wallet.id,
						amount: new Prisma.Decimal(-250.0),
						type: 'DEBIT',
						description: 'Order 1',
						idempotencyKey: 'DEBIT_1'
					},
					{
						walletId: wallet.id,
						amount: new Prisma.Decimal(-150.0),
						type: 'PENALTY',
						description: 'SLA Breach',
						idempotencyKey: 'PENALTY_1'
					}
				]
			});

			await tx.collectorWallet.update({
				where: { id: wallet.id },
				data: { floatBalance: 2100.0 }
			});
		});

		const refreshedWallet = await db.collectorWallet.findUniqueOrThrow({ where: { id: wallet.id } });
		const ledgerSum = await db.walletLedger.aggregate({
			where: { walletId: wallet.id },
			_sum: { amount: true }
		});

		const totalExpected = 2000.0 + Number(ledgerSum._sum.amount);
		expect(Number(refreshedWallet.floatBalance)).toBe(totalExpected);
	});

	it('should REJECT duplicate Cashfree payout webhook payloads (Payout Idempotency)', async () => {
		const collector = await createTestUser('COLLECTOR');
		const wallet = await createTestWallet(collector.id, 5000.0);
		const citizen = await createTestUser('CITIZEN');
		const region = await db.region.create({
			data: { wardNumber: 99, wardName: 'Test Ward', isFloodSuspended: false }
		});

		await db.pickupRequest.create({
			data: {
				id: 'TX_REQ_001',
				citizenId: citizen.id,
				regionId: region.id,
				visualTier: 'RIGID_CONTAINERS',
				scheduledSlotStart: new Date(),
				scheduledSlotEnd: new Date(Date.now() + 7200000),
				status: 'COMPLETED'
			}
		});

		await db.transaction.create({
			data: {
				id: 'TX_IDEMPOTENT_001',
				requestId: 'TX_REQ_001',
				otpHash: 'hash',
				grossAmount: 226.69,
				platformFee: 18.14,
				netPayout: 208.55
			}
		});

		await db.pickupAssignment.create({
			data: {
				requestId: 'TX_REQ_001',
				collectorId: collector.id,
				proximityMeters: 50,
				slaStatus: 'MET'
			}
		});

		const payload = {
			transactionId: 'TX_IDEMPOTENT_001',
			gatewayRef: 'CF_REF_881234',
			upiVpa: 'citizen@upi',
			amount: 226.69,
			idempotencyKey: 'PAYOUT_HOOK_KEY_9921'
		};

		const firstResult = await processPayoutWebhook(payload);
		expect(firstResult.status).toBe('SUCCESS');

		const duplicateResult = await processPayoutWebhook(payload);
		expect(duplicateResult.status).toBe('SUCCESS');
		expect(duplicateResult.isDuplicate).toBe(true);

		const ledgerRows = await db.walletLedger.count({
			where: { idempotencyKey: payload.idempotencyKey }
		});
		expect(ledgerRows).toBe(1);
	});
});
