import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { db, Prisma } from '@kachracash/db';
import { app } from '../../app.js';
import {
  matchCollectorForPickup,
  assignCollectorToPickup,
} from '../../services/dispatch-sla.js';
import {
  validateScaleIngestion,
  BLEWeightTelemetryPacket,
} from '@kachracash/types';

describe('E2E Pickup & Settlement Transaction Loop with PostGIS & Atomic Ledger', () => {
  let beltolaRegionId: string;
  let cardboardCategoryId: string;
  let citizenId: string;
  let collectorAId: string;
  let collectorAWalletId: string;
  let collectorBId: string;
  let collectorCId: string;

  const TEST_PREFIX = `E2E_${Date.now()}`;

  beforeAll(async () => {
    // 1. Verify PostGIS extension is active
    const postgisCheck = await db.$queryRaw<Array<{ postgis_version: string }>>`
      SELECT PostGIS_Version();
    `;
    expect(postgisCheck.length).toBeGreaterThan(0);
    expect(postgisCheck[0]?.postgis_version).toBeDefined();

    // 2. Fetch or create Beltola (Ward 28) region
    const beltola = await db.region.findFirst({
      where: { wardNumber: 28 },
    });
    if (!beltola) {
      throw new Error('Beltola region (Ward 28) not found. Run seed script first.');
    }
    beltolaRegionId = beltola.id;

    // 3. Fetch Old Corrugated Cardboard (CARDBOARD_OCC) category
    const occCategory = await db.scrapCategory.findUnique({
      where: { sku: 'CARDBOARD_OCC' },
    });
    if (!occCategory) {
      throw new Error('CARDBOARD_OCC category not found in database.');
    }
    cardboardCategoryId = occCategory.id;

    // 4. Create Citizen in Beltola
    const citizen = await db.citizen.create({
      data: {
        phoneNumber: `+919864${Math.floor(100000 + Math.random() * 900000)}`,
        fullName: 'Jatin Baruah (Beltola)',
        upiVpa: 'jatin.baruah@okhdfcbank',
        kycVerified: true,
        regionId: beltolaRegionId,
      },
    });
    citizenId = citizen.id;

    // 5. Create 3 Collectors with PostGIS Coordinates:
    // Collector A: Nearby (~137m away in Beltola) with sufficient float (₹3,500 >= ₹2,000)
    const collA = await db.collector.create({
      data: {
        phoneNumber: `+919435${Math.floor(100000 + Math.random() * 900000)}`,
        fullName: 'Pranjal Saikia (Qualified)',
        assistedKycToken: `KYC_A_${TEST_PREFIX}`,
        assignedCartQrId: `CART_A_${TEST_PREFIX}`,
        isOnline: true,
      },
    });
    collectorAId = collA.id;

    await db.$executeRaw`
      UPDATE "collectors"
      SET coordinates = ST_SetSRID(ST_MakePoint(91.7890, 26.1350), 4326)
      WHERE id = ${collectorAId};
    `;

    const walletA = await db.collectorWallet.create({
      data: {
        collectorId: collectorAId,
        floatBalance: new Prisma.Decimal(3500.0), // >= ₹2,000 threshold
        minThreshold: new Prisma.Decimal(2000.0),
        status: 'ACTIVE',
      },
    });
    collectorAWalletId = walletA.id;

    // Collector B: Far (~4.5 km away in Jalukbari/Dispur outskirts) with high float (₹5,000)
    const collB = await db.collector.create({
      data: {
        phoneNumber: `+919436${Math.floor(100000 + Math.random() * 900000)}`,
        fullName: 'Biren Kalita (Out of Range)',
        assistedKycToken: `KYC_B_${TEST_PREFIX}`,
        assignedCartQrId: `CART_B_${TEST_PREFIX}`,
        isOnline: true,
      },
    });
    collectorBId = collB.id;

    await db.$executeRaw`
      UPDATE "collectors"
      SET coordinates = ST_SetSRID(ST_MakePoint(91.7500, 26.1100), 4326)
      WHERE id = ${collectorBId};
    `;

    await db.collectorWallet.create({
      data: {
        collectorId: collectorBId,
        floatBalance: new Prisma.Decimal(5000.0),
        minThreshold: new Prisma.Decimal(2000.0),
        status: 'ACTIVE',
      },
    });

    // Collector C: Nearby (~50m away in Beltola) but insufficient float (₹1,500 < ₹2,000)
    const collC = await db.collector.create({
      data: {
        phoneNumber: `+919437${Math.floor(100000 + Math.random() * 900000)}`,
        fullName: 'Dhruba Bora (Low Float)',
        assistedKycToken: `KYC_C_${TEST_PREFIX}`,
        assignedCartQrId: `CART_C_${TEST_PREFIX}`,
        isOnline: true,
      },
    });
    collectorCId = collC.id;

    await db.$executeRaw`
      UPDATE "collectors"
      SET coordinates = ST_SetSRID(ST_MakePoint(91.7880, 26.1340), 4326)
      WHERE id = ${collectorCId};
    `;

    await db.collectorWallet.create({
      data: {
        collectorId: collectorCId,
        floatBalance: new Prisma.Decimal(1500.0), // < ₹2,000 threshold
        minThreshold: new Prisma.Decimal(2000.0),
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    // Clean up created test entities
    try {
      await db.walletLedger.deleteMany({
        where: { walletId: collectorAWalletId },
      });
      await db.transactionItem.deleteMany({
        where: { scaleHardwareId: 'SCALE_BLE_01' },
      });
      await db.payout.deleteMany({
        where: { upiVpa: 'jatin.baruah@okhdfcbank' },
      });
      await db.pickupAssignment.deleteMany({
        where: { collectorId: collectorAId },
      });
      await db.transaction.deleteMany({
        where: { request: { citizenId } },
      });
      await db.pickupRequest.deleteMany({
        where: { citizenId },
      });
      await db.collectorWallet.deleteMany({
        where: { collectorId: { in: [collectorAId, collectorBId, collectorCId] } },
      });
      await db.collector.deleteMany({
        where: { id: { in: [collectorAId, collectorBId, collectorCId] } },
      });
      await db.citizen.deleteMany({
        where: { id: citizenId },
      });
    } catch (err) {
      console.warn('Cleanup warning:', err);
    }
  });

  it('Step A (Request & Dispatch): PostGIS spatial query matches Collector within 1.5 km and float >= ₹2,000', async () => {
    const pickupReqId = `REQ_${TEST_PREFIX}_001`;

    // 1. Create PickupRequest in Beltola with PostGIS Point(91.7878 26.1344)
    await db.$executeRaw`
      INSERT INTO "pickup_requests" (
        "id", "citizenId", "regionId", "status", "visualTier",
        "scheduledSlotStart", "scheduledSlotEnd", "pickupLocation",
        "createdAt", "updatedAt"
      ) VALUES (
        ${pickupReqId}, ${citizenId}, ${beltolaRegionId}, 'PENDING'::"OrderStatus", 'SOFT_FILMS',
        NOW(), NOW() + INTERVAL '2 hours',
        ST_SetSRID(ST_MakePoint(91.7878, 26.1344), 4326),
        NOW(), NOW()
      );
    `;

    // 2. Execute PostGIS geospatial dispatch query within 1.5 km (1500 meters)
    const matchedCollector = await matchCollectorForPickup(pickupReqId, 1500);

    expect(matchedCollector).not.toBeNull();
    // Must match Collector A (Nearby & Qualified float)
    expect(matchedCollector?.id).toBe(collectorAId);
    expect(matchedCollector?.floatBalance).toBe(3500.0);
    // Distance should be approximately 137 meters
    expect(matchedCollector?.distanceMeters).toBeLessThan(500);
    expect(matchedCollector?.distanceMeters).toBeGreaterThan(50);

    // 3. Assign Collector to PickupRequest
    const assignment = await assignCollectorToPickup(
      pickupReqId,
      matchedCollector!.id,
      matchedCollector!.distanceMeters,
    );

    expect(assignment.requestId).toBe(pickupReqId);
    expect(assignment.collectorId).toBe(collectorAId);
    expect(assignment.slaStatus).toBe('MET');

    const updatedReq = await db.pickupRequest.findUniqueOrThrow({
      where: { id: pickupReqId },
    });
    expect(updatedReq.status).toBe('ASSIGNED');
  });

  it('Step B (Tare & Weighment): Ingests 14.5 kg Old Corrugated Cardboard at ₹14.00/kg, validates zero-tare & math', async () => {
    // Hardware BLE stream packet for 14.5 kg Old Corrugated Cardboard
    const validPacket: BLEWeightTelemetryPacket = {
      scaleId: 'SCALE_BLE_01',
      weightKg: 14.5,
      isTared: true,
      batteryPct: 92,
      timestamp: Date.now(),
    };

    // 1. Validate zero-tare status (passes)
    const validatedPacket = validateScaleIngestion(validPacket);
    expect(validatedPacket.isTared).toBe(true);
    expect(validatedPacket.weightKg).toBe(14.5);
    expect(validatedPacket.scaleId).toBe('SCALE_BLE_01');

    // 2. Assert zero-tare rejection if isTared = false
    const untaredPacket: BLEWeightTelemetryPacket = {
      ...validPacket,
      isTared: false,
    };
    expect(() => validateScaleIngestion(untaredPacket)).toThrowError(
      'ZERO_TARE_REQUIRED: Scale must register 0.000 kg baseline tare before accepting scrap weight.',
    );

    // 3. Assert rejection of manual text inputs (403 Forbidden guardrail)
    const manualInputPayload = {
      orderId: 'ORD_HACK',
      manualWeightInputKg: 14.5,
    };
    expect(() => validateScaleIngestion(manualInputPayload)).toThrowError(
      'FORBIDDEN_MANUAL_WEIGHT: Manual numeric text input is strictly forbidden.',
    );

    // 4. Mathematical line-item verification:
    // 14.5 kg * ₹14.00/kg = ₹203.00 payout
    // Platform fee = ₹203.00 * 8% = ₹16.24
    // Collector total debit = ₹203.00 + ₹16.24 = ₹219.24
    const weightKg = 14.5;
    const unitRate = 14.0;
    const scrapPayout = Math.round(weightKg * unitRate * 100) / 100;
    const platformFee = Math.round(scrapPayout * 0.08 * 100) / 100;
    const totalCollectorDebit = Math.round((scrapPayout + platformFee) * 100) / 100;

    expect(scrapPayout).toBe(203.0);
    expect(platformFee).toBe(16.24);
    expect(totalCollectorDebit).toBe(219.24);
  });

  it('Step C (Atomic OTP Settlement): POST /api/v1/orders/verify-otp executes single ACID transaction', async () => {
    const pickupReqId = `REQ_${TEST_PREFIX}_001`;
    const customerOtp = '6842';

    // 1. Initialize Transaction record with hashed OTP
    const otpHash = await bcrypt.hash(customerOtp, 10);
    const txRecord = await db.transaction.create({
      data: {
        requestId: pickupReqId,
        otpHash,
        grossAmount: new Prisma.Decimal(0.0),
        platformFee: new Prisma.Decimal(0.0),
        netPayout: new Prisma.Decimal(0.0),
      },
    });

    const initialWallet = await db.collectorWallet.findUniqueOrThrow({
      where: { id: collectorAWalletId },
    });
    expect(Number(initialWallet.floatBalance)).toBe(3500.0);

    // 2. Call POST /api/v1/orders/verify-otp with 4-digit code
    const res = await request(app)
      .post('/api/v1/orders/verify-otp')
      .send({
        requestId: pickupReqId,
        collectorId: collectorAId,
        otp: customerOtp,
        items: [
          {
            categoryId: cardboardCategoryId,
            weightKg: 14.5,
            unitRate: 14.0,
            scaleHardwareId: 'SCALE_BLE_01',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.citizenPayout).toBe(203.0);
    expect(res.body.data.platformFee).toBe(16.24);
    expect(res.body.data.totalCollectorDebit).toBe(219.24);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.payoutStatus).toBe('SUCCESS');

    // 3. Database Assertions inside Neon PostgreSQL:

    // Assertion 1: Citizen UPI disbursement is marked SUCCESS
    const payout = await db.payout.findUniqueOrThrow({
      where: { transactionId: txRecord.id },
    });
    expect(payout.status).toBe('SUCCESS');
    expect(Number(payout.amount)).toBe(203.0);
    expect(payout.gatewayRef).toContain('CF_PAYOUT');
    expect(payout.upiVpa).toBe('jatin.baruah@okhdfcbank');

    // Assertion 2: Collector float_balance is debited by ₹219.24 (₹203 payout + 8% platform fee of ₹16.24)
    const updatedWallet = await db.collectorWallet.findUniqueOrThrow({
      where: { id: collectorAWalletId },
    });
    // ₹3,500.00 - ₹219.24 = ₹3,280.76
    expect(Number(updatedWallet.floatBalance)).toBeCloseTo(3280.76, 2);

    // Assertion 3: An append-only record is inserted into wallet_ledger
    const ledgerEntry = await db.walletLedger.findUniqueOrThrow({
      where: { idempotencyKey: `PAYOUT_ORD_${pickupReqId}` },
    });
    expect(Number(ledgerEntry.amount)).toBeCloseTo(-219.24, 2);
    expect(ledgerEntry.type).toBe('DEBIT');
    expect(ledgerEntry.walletId).toBe(collectorAWalletId);
    expect(ledgerEntry.referenceOrderId).toBe(pickupReqId);

    // Assertion 4: Order status updates to COMPLETED
    const completedOrder = await db.pickupRequest.findUniqueOrThrow({
      where: { id: pickupReqId },
    });
    expect(completedOrder.status).toBe('COMPLETED');

    // Assertion 5: Verified transaction line items stored
    const storedItems = await db.transactionItem.findMany({
      where: { transactionId: txRecord.id },
    });
    expect(storedItems).toHaveLength(1);
    expect(Number(storedItems[0]?.weightKg)).toBe(14.5);
    expect(Number(storedItems[0]?.unitRate)).toBe(14.0);
    expect(Number(storedItems[0]?.subtotal)).toBe(203.0);
    expect(storedItems[0]?.scaleHardwareId).toBe('SCALE_BLE_01');
  });

  it('Step D (Rollback Test): Simulates network failure during OTP execution; database rolls back cleanly', async () => {
    const rollbackReqId = `REQ_${TEST_PREFIX}_ROLLBACK`;
    const rollbackOtp = '9912';

    // 1. Create a second PickupRequest in Beltola
    await db.$executeRaw`
      INSERT INTO "pickup_requests" (
        "id", "citizenId", "regionId", "status", "visualTier",
        "scheduledSlotStart", "scheduledSlotEnd", "pickupLocation",
        "createdAt", "updatedAt"
      ) VALUES (
        ${rollbackReqId}, ${citizenId}, ${beltolaRegionId}, 'ASSIGNED'::"OrderStatus", 'SOFT_FILMS',
        NOW(), NOW() + INTERVAL '2 hours',
        ST_SetSRID(ST_MakePoint(91.7878, 26.1344), 4326),
        NOW(), NOW()
      );
    `;

    const otpHash = await bcrypt.hash(rollbackOtp, 10);
    await db.transaction.create({
      data: {
        requestId: rollbackReqId,
        otpHash,
        grossAmount: new Prisma.Decimal(0.0),
        platformFee: new Prisma.Decimal(0.0),
        netPayout: new Prisma.Decimal(0.0),
      },
    });

    // Capture baseline wallet and ledger state before simulated network failure
    const baselineWallet = await db.collectorWallet.findUniqueOrThrow({
      where: { id: collectorAWalletId },
    });
    const baselineFloat = Number(baselineWallet.floatBalance); // ₹3,280.76
    const baselineLedgerCount = await db.walletLedger.count({
      where: { walletId: collectorAWalletId },
    });

    // 2. Call POST /api/v1/orders/verify-otp with simulateFailure: true
    const res = await request(app)
      .post('/api/v1/orders/verify-otp')
      .send({
        requestId: rollbackReqId,
        collectorId: collectorAId,
        otp: rollbackOtp,
        items: [
          {
            categoryId: cardboardCategoryId,
            weightKg: 14.5,
            unitRate: 14.0,
            scaleHardwareId: 'SCALE_BLE_01',
          },
        ],
        simulateFailure: true,
      });

    // Assert HTTP 500 error returned due to simulated network failure
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('NETWORK_TIMEOUT');

    // 3. Database Rollback Assertions:

    // Assertion 1: Collector float_balance MUST NOT have changed (no orphan debit)
    const postRollbackWallet = await db.collectorWallet.findUniqueOrThrow({
      where: { id: collectorAWalletId },
    });
    expect(Number(postRollbackWallet.floatBalance)).toBeCloseTo(baselineFloat, 2);

    // Assertion 2: No new record inserted into wallet_ledger
    const postRollbackLedgerCount = await db.walletLedger.count({
      where: { walletId: collectorAWalletId },
    });
    expect(postRollbackLedgerCount).toBe(baselineLedgerCount);

    const orphanLedgerEntry = await db.walletLedger.findUnique({
      where: { idempotencyKey: `PAYOUT_ORD_${rollbackReqId}` },
    });
    expect(orphanLedgerEntry).toBeNull();

    // Assertion 3: Order status MUST NOT be COMPLETED (remains ASSIGNED)
    const orderPostRollback = await db.pickupRequest.findUniqueOrThrow({
      where: { id: rollbackReqId },
    });
    expect(orderPostRollback.status).toBe('ASSIGNED');

    // Assertion 4: No successful payout record created
    const orphanPayout = await db.payout.findFirst({
      where: { transaction: { requestId: rollbackReqId } },
    });
    expect(orphanPayout).toBeNull();

    // Clean up rollback request
    await db.transaction.deleteMany({ where: { requestId: rollbackReqId } });
    await db.pickupRequest.deleteMany({ where: { id: rollbackReqId } });
  });
});
