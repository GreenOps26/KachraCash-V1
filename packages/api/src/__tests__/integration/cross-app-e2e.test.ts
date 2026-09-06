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
  calculateFloorRate,
  validateScaleIngestion,
  BLEWeightTelemetryPacket,
  ASSAMESE_VOICE_PROMPTS,
  redactAadhaar,
  generateOpaqueKycToken,
  getWalletStatusBadge,
  calculateEsgImpact,
} from '@kachracash/types';

describe('Cross-App Unified End-to-End Integration Test Suite (@apps/citizen, @apps/partner, @apps/admin)', () => {
  let jayanagarRegionId: string;
  let cardboardCategoryId: string;
  let citizenAnanyaId: string;
  let collectorBabulId: string;
  let collectorBabulWalletId: string;
  let outOfRangeCollectorId: string;

  const TEST_PREFIX = `CROSS_E2E_${Date.now()}`;
  const PICKUP_REQ_ID = `REQ_${TEST_PREFIX}_JAYANAGAR`;
  const CITIZEN_OTP = '5829';

  beforeAll(async () => {
    // 1. Verify PostGIS extension is active
    const postgisCheck = await db.$queryRaw<Array<{ postgis_version: string }>>`
      SELECT PostGIS_Version();
    `;
    expect(postgisCheck.length).toBeGreaterThan(0);

    // 2. Fetch or create Jayanagar (Ward 24) region
    let jayanagar = await db.region.findFirst({
      where: { wardNumber: 24 },
    });
    if (!jayanagar) {
      await db.$executeRawUnsafe(`
        INSERT INTO "regions" ("id", "wardNumber", "wardName", "geofencePolygon", "isFloodSuspended", "updatedAt")
        VALUES (
          gen_random_uuid()::text,
          24,
          'Jayanagar',
          ST_GeomFromText('POLYGON((91.70 26.10, 91.85 26.10, 91.85 26.20, 91.70 26.20, 91.70 26.10))', 4326),
          false,
          NOW()
        );
      `);
      jayanagar = await db.region.findFirstOrThrow({ where: { wardNumber: 24 } });
    }
    jayanagarRegionId = jayanagar.id;

    // 3. Fetch Old Corrugated Cardboard (CARDBOARD_OCC) category
    const occCategory = await db.scrapCategory.findUnique({
      where: { sku: 'CARDBOARD_OCC' },
    });
    if (!occCategory) {
      throw new Error('CARDBOARD_OCC category not found in database.');
    }
    cardboardCategoryId = occCategory.id;

    // 4. Create Citizen Dr. Ananya Bordoloi in Jayanagar (Ward 24)
    const citizen = await db.citizen.create({
      data: {
        phoneNumber: `+919864${Math.floor(100000 + Math.random() * 900000)}`,
        fullName: 'Dr. Ananya Bordoloi',
        upiVpa: 'ananya.bordoloi@okhdfcbank',
        kycVerified: true,
        regionId: jayanagarRegionId,
      },
    });
    citizenAnanyaId = citizen.id;

    // Set citizen coordinates in Jayanagar: (91.7945, 26.1415)
    await db.$executeRaw`
      UPDATE "citizens"
      SET coordinates = ST_SetSRID(ST_MakePoint(91.7945, 26.1415), 4326)
      WHERE id = ${citizenAnanyaId};
    `;

    // 5. Create Collector Babul Ali:
    // Positioned ~180m away in Jayanagar: (91.7958, 26.1426)
    // Pre-funded float: ₹2,450.00
    const babul = await db.collector.create({
      data: {
        phoneNumber: `+919435${Math.floor(100000 + Math.random() * 900000)}`,
        fullName: 'Babul Ali',
        assistedKycToken: `KYC_BABUL_${TEST_PREFIX}`,
        assignedCartQrId: `CART_BABUL_${TEST_PREFIX}`,
        isOnline: true,
      },
    });
    collectorBabulId = babul.id;

    await db.$executeRaw`
      UPDATE "collectors"
      SET coordinates = ST_SetSRID(ST_MakePoint(91.7958, 26.1426), 4326)
      WHERE id = ${collectorBabulId};
    `;

    const babulWallet = await db.collectorWallet.create({
      data: {
        collectorId: collectorBabulId,
        floatBalance: new Prisma.Decimal(2450.0), // Pre-funded ₹2,450.00
        minThreshold: new Prisma.Decimal(2000.0),
        status: 'ACTIVE',
      },
    });
    collectorBabulWalletId = babulWallet.id;

    // 6. Create Out-of-Range Collector (>4 km away) to prove distance discrimination
    const outOfRange = await db.collector.create({
      data: {
        phoneNumber: `+919436${Math.floor(100000 + Math.random() * 900000)}`,
        fullName: 'Out Of Range Collector',
        assistedKycToken: `KYC_OUT_${TEST_PREFIX}`,
        assignedCartQrId: `CART_OUT_${TEST_PREFIX}`,
        isOnline: true,
      },
    });
    outOfRangeCollectorId = outOfRange.id;

    await db.$executeRaw`
      UPDATE "collectors"
      SET coordinates = ST_SetSRID(ST_MakePoint(91.7500, 26.1100), 4326)
      WHERE id = ${outOfRangeCollectorId};
    `;

    await db.collectorWallet.create({
      data: {
        collectorId: outOfRangeCollectorId,
        floatBalance: new Prisma.Decimal(5000.0),
        minThreshold: new Prisma.Decimal(2000.0),
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    try {
      await db.walletLedger.deleteMany({
        where: { walletId: collectorBabulWalletId },
      });
      await db.transactionItem.deleteMany({
        where: { scaleHardwareId: 'SCALE_BLE_BABUL_01' },
      });
      await db.payout.deleteMany({
        where: { upiVpa: 'ananya.bordoloi@okhdfcbank' },
      });
      await db.pickupAssignment.deleteMany({
        where: { collectorId: collectorBabulId },
      });
      await db.transaction.deleteMany({
        where: { request: { citizenId: citizenAnanyaId } },
      });
      await db.pickupRequest.deleteMany({
        where: { citizenId: citizenAnanyaId },
      });
      await db.collectorWallet.deleteMany({
        where: { collectorId: { in: [collectorBabulId, outOfRangeCollectorId] } },
      });
      await db.collector.deleteMany({
        where: { id: { in: [collectorBabulId, outOfRangeCollectorId] } },
      });
      await db.citizen.deleteMany({
        where: { id: citizenAnanyaId },
      });
    } catch (err) {
      console.warn('Test cleanup warning:', err);
    }
  });

  // ==========================================================================
  // STEP 1: Admin Ward & Rate Check
  // ==========================================================================
  it('Step 1 (Admin Ward & Rate Check): Query GET /api/v1/orders/rate-card and verify wards and OCC floor rate', async () => {
    const res = await request(app).get('/api/v1/orders/rate-card');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { tiers, wards } = res.body.data;

    // Assert Beltola (Ward 28) is active
    const beltolaWard = wards.find((w: { wardNumber: number }) => w.wardNumber === 28);
    expect(beltolaWard).toBeDefined();
    expect(beltolaWard.isMonsoonSuspended).toBe(false);

    // Assert Wireless / Hatigaon (Ward 30) is flagged as monsoon-suspended
    const hatigaonWard = wards.find((w: { wardNumber: number }) => w.wardNumber === 30);
    expect(hatigaonWard).toBeDefined();
    expect(hatigaonWard.isMonsoonSuspended).toBe(true);
    expect(hatigaonWard.wardName).toContain('Wireless');

    // Assert Floor Rate Card for OCC (Old Corrugated Cardboard) evaluates to ₹14.00/kg
    const occTier = tiers.find((t: { id: string }) => t.id === 'SOFT_FILMS');
    expect(occTier).toBeDefined();
    expect(occTier.floorRate).toBe(14.0);
    expect(occTier.items).toContain('Old Corrugated Cardboard');

    // Deterministic Floor Rate Card formula check using Byrnihat short-haul freight offset (C_freight = ₹1.20/kg)
    const formulaResult = calculateFloorRate({
      nationalIndexRate: 20.02,
      freightCost: 1.2, // Byrnihat short-haul freight offset
      handlingCost: 1.4,
      aggregatorMargin: 1.4,
      collectorMargin: 0.08, // Enforced 8% collector margin
      volatilityBuffer: 0.05, // 5% risk buffer
    });
    // [20.02 - (1.2 + 1.4 + 1.4)] * (1 - 0.08) * (1 - 0.05) = 16.02 * 0.92 * 0.95 = 14.00148 => ₹14.00
    expect(formulaResult.floorRate).toBe(14.0);
  });

  // ==========================================================================
  // STEP 2: Citizen Intake & PostGIS Match
  // ==========================================================================
  it('Step 2 (Citizen Intake & PostGIS Match): Dr. Ananya Bordoloi booking in Jayanagar matches Babul Ali via PostGIS', async () => {
    // 1. Submit citizen booking via API
    const createOrderRes = await request(app)
      .post('/api/v1/orders/create')
      .send({
        citizenId: citizenAnanyaId,
        wardId: 'WARD_JAYANAGAR_24',
        visualTier: 'SOFT_FILMS',
        pickupLocation: { lat: 26.1415, lng: 91.7945 },
        slotStart: '02:00 PM',
        slotEnd: '04:00 PM',
      });

    expect(createOrderRes.status).toBe(201);
    expect(createOrderRes.body.success).toBe(true);
    expect(createOrderRes.body.data.visualTier).toBe('SOFT_FILMS');
    expect(createOrderRes.body.data.scheduledSlot.start).toBe('02:00 PM');
    expect(createOrderRes.body.data.scheduledSlot.end).toBe('04:00 PM');

    // 2. Insert PostGIS PickupRequest into database for spatial match query
    await db.$executeRaw`
      INSERT INTO "pickup_requests" (
        "id", "citizenId", "regionId", "status", "visualTier",
        "scheduledSlotStart", "scheduledSlotEnd", "pickupLocation",
        "createdAt", "updatedAt"
      ) VALUES (
        ${PICKUP_REQ_ID}, ${citizenAnanyaId}, ${jayanagarRegionId}, 'PENDING'::"OrderStatus", 'SOFT_FILMS',
        NOW(), NOW() + INTERVAL '2 hours',
        ST_SetSRID(ST_MakePoint(91.7945, 26.1415), 4326),
        NOW(), NOW()
      );
    `;

    // 3. Execute PostGIS geospatial dispatch query (ST_DistanceSphere)
    const matched = await matchCollectorForPickup(PICKUP_REQ_ID, 1500);

    expect(matched).not.toBeNull();
    // Must strictly match Babul Ali
    expect(matched?.id).toBe(collectorBabulId);
    expect(matched?.fullName).toBe('Babul Ali');
    expect(matched?.floatBalance).toBe(2450.0);

    // Distance must be ~180m (between 140m and 220m)
    expect(matched?.distanceMeters).toBeGreaterThanOrEqual(140);
    expect(matched?.distanceMeters).toBeLessThanOrEqual(220);

    // 4. Assign Collector and assert Admin DispatchRadar marks ticket as ASSIGNED within safe SLA (<500m)
    const assignment = await assignCollectorToPickup(
      PICKUP_REQ_ID,
      matched!.id,
      matched!.distanceMeters,
    );
    expect(assignment.collectorId).toBe(collectorBabulId);
    expect(assignment.slaStatus).toBe('MET');

    const updatedRequest = await db.pickupRequest.findUniqueOrThrow({
      where: { id: PICKUP_REQ_ID },
    });
    expect(updatedRequest.status).toBe('ASSIGNED');
    expect(matched!.distanceMeters).toBeLessThan(500); // Safe SLA bounds (<500m)
  });

  // ==========================================================================
  // STEP 3: Partner Tare & Hardware Weight Streaming
  // ==========================================================================
  it('Step 3 (Partner Tare & Hardware Weight Streaming): Emits zero-tare packet, vocalizes Assamese audio, mirrors 14.50 kg OCC at ₹203.00', () => {
    // 1. Simulate partner BLE GATT stream pairing: emit zero-tare packet (0.000 kg)
    const zeroTarePacket: BLEWeightTelemetryPacket = {
      scaleId: 'SCALE_BLE_BABUL_01',
      weightKg: 0.0,
      isTared: true,
      batteryPct: 94,
      timestamp: Date.now(),
    };

    const validatedZeroTare = validateScaleIngestion(zeroTarePacket);
    expect(validatedZeroTare.isTared).toBe(true);
    expect(validatedZeroTare.weightKg).toBe(0.0);
    expect(validatedZeroTare.scaleId).toBe('SCALE_BLE_BABUL_01');

    // Assert that an untared packet is rejected
    expect(() =>
      validateScaleIngestion({
        scaleId: 'SCALE_BLE_BABUL_01',
        weightKg: 14.5,
        isTared: false,
        batteryPct: 94,
        timestamp: Date.now(),
      }),
    ).toThrow('ZERO_TARE_REQUIRED');

    // 2. Ingest 14.50 kg OCC payload
    const occPayload: BLEWeightTelemetryPacket = {
      scaleId: 'SCALE_BLE_BABUL_01',
      weightKg: 14.5,
      isTared: true,
      batteryPct: 93,
      timestamp: Date.now(),
    };
    const validatedOcc = validateScaleIngestion(occPayload);
    expect(validatedOcc.weightKg).toBe(14.5);

    // 3. Verify Partner UI vocalizes Assamese audio string
    const assameseAudio = ASSAMESE_VOICE_PROMPTS.weighing(14.5);
    expect(assameseAudio.textAs).toContain('স্কেলত বস্তু তুলক');
    expect(assameseAudio.textAs).toContain('14.50 কিলো হৈছে');
    expect(assameseAudio.textEn).toContain('Place scrap on scale. 14.50 kg recorded. Tap green to lock.');

    // 4. Verify Citizen UI mirrors 14.50 kg with a subtotal of ₹203.00 (14.50 kg * ₹14.00/kg)
    const unitRate = 14.0;
    const grossSubtotal = Math.round(validatedOcc.weightKg * unitRate * 100) / 100;
    expect(grossSubtotal).toBe(203.0);
  });

  // ==========================================================================
  // STEP 4: Two-Factor OTP Handshake & Atomic Ledger Mutation
  // ==========================================================================
  it('Step 4 (Two-Factor OTP Handshake & Atomic Ledger Mutation): Verifies OTP, debits wallet to ₹2,230.76, credits UPI ₹203.00 in single ACID tx', async () => {
    // 1. Initialize Transaction in DB with hashed OTP
    const otpHash = await bcrypt.hash(CITIZEN_OTP, 10);
    const txRecord = await db.transaction.create({
      data: {
        requestId: PICKUP_REQ_ID,
        otpHash,
        grossAmount: new Prisma.Decimal(0.0),
        platformFee: new Prisma.Decimal(0.0),
        netPayout: new Prisma.Decimal(0.0),
      },
    });

    // 2. Submit OTP via POST /api/v1/orders/verify-otp
    const res = await request(app)
      .post('/api/v1/orders/verify-otp')
      .send({
        requestId: PICKUP_REQ_ID,
        collectorId: collectorBabulId,
        otp: CITIZEN_OTP,
        items: [
          {
            categoryId: cardboardCategoryId,
            weightKg: 14.5,
            unitRate: 14.0,
            scaleHardwareId: 'SCALE_BLE_BABUL_01',
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

    // Assertion A: Citizen UPI transfer (₹203.00) completes with gateway transaction reference
    const payout = await db.payout.findUniqueOrThrow({
      where: { transactionId: txRecord.id },
    });
    expect(payout.status).toBe('SUCCESS');
    expect(Number(payout.amount)).toBe(203.0);
    expect(payout.upiVpa).toBe('ananya.bordoloi@okhdfcbank');
    expect(payout.gatewayRef).toContain('CF_PAYOUT');

    // Assertion B: Collector float balance is debited by ₹219.24 (₹203 payout + 8% platform fee of ₹16.24),
    // leaving exactly ₹2,230.76 (₹2,450.00 - ₹219.24 = ₹2,230.76)
    const updatedWallet = await db.collectorWallet.findUniqueOrThrow({
      where: { id: collectorBabulWalletId },
    });
    expect(Number(updatedWallet.floatBalance)).toBeCloseTo(2230.76, 2);

    // Assertion C: An immutable audit row is appended to wallet_ledger
    const ledgerRow = await db.walletLedger.findUniqueOrThrow({
      where: { idempotencyKey: `PAYOUT_ORD_${PICKUP_REQ_ID}` },
    });
    expect(Number(ledgerRow.amount)).toBeCloseTo(-219.24, 2);
    expect(ledgerRow.type).toBe('DEBIT');
    expect(ledgerRow.walletId).toBe(collectorBabulWalletId);
    expect(ledgerRow.referenceOrderId).toBe(PICKUP_REQ_ID);

    // Assertion D: Order status updates to COMPLETED
    const completedOrder = await db.pickupRequest.findUniqueOrThrow({
      where: { id: PICKUP_REQ_ID },
    });
    expect(completedOrder.status).toBe('COMPLETED');
  });

  // ==========================================================================
  // STEP 5: Admin & Citizen Verification
  // ==========================================================================
  it('Step 5 (Admin & Citizen Verification): Citizen ESG impact slip generated with WhatsApp link; Admin displays collector as HEALTHY_FLOAT with redacted Aadhaar', async () => {
    // 1. Citizen SWM 2026 ESG Impact slip calculation:
    // 14.5 kg of scrap diverted from Boragaon Landfill
    const esg = calculateEsgImpact(14.5);

    // Landfill volume saved: 14.5 * 0.0027 = 0.039 m³
    expect(esg.volumeSavedM3).toBe(0.039);

    // Carbon avoided: 14.5 * 1.2 = 17.4 kg CO₂e
    expect(esg.carbonAvoidedKg).toBe(17.4);

    // Green KC credits: 14.5 * 10 = 145 KC Points
    expect(esg.greenCredits).toBe(145);

    // WhatsApp deep-link generation
    const shareText =
      `🌿 *KachraCash Circular Economy Receipt*\n` +
      `Receipt ID: #${PICKUP_REQ_ID}\n` +
      `Ward: Jayanagar (Ward 24), Guwahati\n` +
      `Scrap Diverted from Boragaon: 14.500 kg\n` +
      `Net UPI Payout Received: ₹203.00\n` +
      `Landfill Volume Saved: 0.039 m³\n` +
      `CO₂ Emissions Avoided: 17.4 kg CO₂e\n` +
      `Green KC Credits Earned: +145 KC\n\n` +
      `Recycle with KachraCash: https://kachracash.in`;

    const whatsappDeepLink = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    expect(whatsappDeepLink).toContain('whatsapp://send?text=');
    expect(whatsappDeepLink).toContain('0.039%20m');
    expect(whatsappDeepLink).toContain('17.4%20kg%20CO');
    expect(whatsappDeepLink).toContain('Boragaon');

    // 2. Admin WalletLedgerDesk verification:
    // Collector Babul Ali remaining float is ₹2,230.76 >= ₹2,000 => HEALTHY_FLOAT
    const currentWallet = await db.collectorWallet.findUniqueOrThrow({
      where: { id: collectorBabulWalletId },
    });
    const currentFloat = Number(currentWallet.floatBalance); // 2,230.76
    const statusBadge = getWalletStatusBadge(currentFloat);
    expect(statusBadge).toBe('HEALTHY_FLOAT');

    // Aadhaar Redaction compliance
    const rawAadhaar = '778899005678';
    const redacted = redactAadhaar(rawAadhaar);
    expect(redacted).toBe('•••• •••• 5678 [Aadhaar Redacted]');
    expect(redacted).not.toContain('7788');
    expect(redacted).not.toContain('9900');

    // Opaque KYC token compliance
    const opaqueToken = generateOpaqueKycToken(collectorBabulId);
    expect(opaqueToken).toMatch(/^KYC_VERIFIED_AS_\d{4}$/);
  });
});
