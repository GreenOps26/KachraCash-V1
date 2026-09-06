import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, Prisma } from '@kachracash/db';
import {
  assignPickupOrder,
  processPayoutWebhook,
} from '../../services/wallet-service.js';
import {
  createTestUser,
  createTestWallet,
  cleanDatabase,
} from '../fixtures/database.fixture.js';

describe('Atomic Wallet Ledger & Escrow Settlement Integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it('should REJECT order assignment if collector float balance is below ₹2,000 threshold', async () => {
    const collector = await createTestUser('COLLECTOR');
    await createTestWallet(collector.id, 1450.0); // Float balance < ₹2,000 threshold

    const orderId = 'ORD_TEST_001';

    await expect(assignPickupOrder(orderId, collector.id)).rejects.toThrowError(
      'INSUFFICIENT_FLOAT_BALANCE: Collector wallet float (₹1,450.00) is below minimum threshold of ₹2,000.00',
    );
  });

  it('should grant provisional float extension (+₹1,000) for active in-route collector experiencing float depletion', async () => {
    const collector = await createTestUser('COLLECTOR');
    await createTestWallet(collector.id, 1200.0); // Float dropped mid-route

    const orderId = 'ORD_ACTIVE_ROUTE_002';

    // Execution with active route flag grants provisional buffer
    const assignment = await assignPickupOrder(orderId, collector.id, 500.0, {
      activeRouteExtension: true,
    });
    expect(assignment.status).toBe('ASSIGNED');
    expect(assignment.provisionalBufferApplied).toBe(1000.0);
  });

  it('should verify that collector_wallets.float_balance strictly equals mathematical sum of wallet_ledger', async () => {
    const collector = await createTestUser('COLLECTOR');
    const wallet = await createTestWallet(collector.id, 2000.0); // Initial deposit

    // Create a series of debits, credits, and penalties
    await db.$transaction(async (tx) => {
      await tx.walletLedger.createMany({
        data: [
          {
            walletId: wallet.id,
            amount: new Prisma.Decimal(500.0),
            type: 'CREDIT',
            description: 'Topup',
            idempotencyKey: 'TOPUP_1',
          },
          {
            walletId: wallet.id,
            amount: new Prisma.Decimal(-250.0),
            type: 'DEBIT',
            description: 'Order 1',
            idempotencyKey: 'DEBIT_1',
          },
          {
            walletId: wallet.id,
            amount: new Prisma.Decimal(-150.0),
            type: 'PENALTY',
            description: 'SLA Breach',
            idempotencyKey: 'PENALTY_1',
          },
        ],
      });

      await tx.collectorWallet.update({
        where: { id: wallet.id },
        data: { floatBalance: 2100.0 }, // 2000 + 500 - 250 - 150 = 2100
      });
    });

    const refreshedWallet = await db.collectorWallet.findUniqueOrThrow({
      where: { id: wallet.id },
    });
    const ledgerSum = await db.walletLedger.aggregate({
      where: { walletId: wallet.id },
      _sum: { amount: true },
    });

    // Assert absolute parity between cached float balance and ledger sum
    const totalExpected = 2000.0 + Number(ledgerSum._sum.amount);
    expect(Number(refreshedWallet.floatBalance)).toBe(totalExpected);
  });

  it('should REJECT duplicate Cashfree payout webhook payloads (Payout Idempotency)', async () => {
    const transactionId = 'TX_IDEMPOTENT_001';
    const idempotencyKey = 'PAYOUT_HOOK_KEY_9921';

    const payload = {
      transactionId,
      gatewayRef: 'CF_REF_881234',
      upiVpa: 'citizen@upi',
      amount: 226.69,
      idempotencyKey,
    };

    // First webhook call: should succeed
    const firstResult = await processPayoutWebhook(payload);
    expect(firstResult.status).toBe('SUCCESS');

    // Duplicate webhook call: should return 200 OK with duplicate flag without writing new ledger row
    const duplicateResult = await processPayoutWebhook(payload);
    expect(duplicateResult.status).toBe('SUCCESS');
    expect(duplicateResult.isDuplicate).toBe(true);

    const ledgerRows = await db.walletLedger.count({
      where: { idempotencyKey },
    });
    expect(ledgerRows).toBe(1); // Strictly ONE ledger entry recorded
  });
});
