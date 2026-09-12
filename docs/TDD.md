# Test-Driven Development (TDD) Specification: KachraCash (`কচৰা ক্যাশ`)

> **Document Status:** Authoritative Testing Contract  
> **Target Audience:** QA Engineers, Backend Developers, Coding Agents  
> **Test Stack:** Vitest, Supertest, Prisma Client, Neon Ephemeral DB  
> **Version:** 1.2.0

---

## 1. Overview & Test Execution Strategy

This document defines the strict **Test-Driven Development (TDD)** contract for all applications and shared packages in the KachraCash monorepo. Coding agents must implement test suites matching these specifications before implementing production business logic.

### 1.0 Implementation Status

| Context | Path | Command |
|---------|------|---------|
| **Current repo** (SvelteKit scaffold) | `src/**/*.spec.ts` | `npm run test` |
| **Monorepo** | `packages/api/src/__tests__/` | `pnpm test:unit` / `pnpm test:integration` |

Until `packages/api` exists, implement pure-logic unit tests (pricing engine, BLE parser) under `src/lib/` in the current repo.

### 1.1 Test Suite Organization

```
packages/api/
├── src/
│   ├── __tests__/
│   │   ├── unit/
│   │   │   ├── pricing-engine.test.ts
│   │   │   └── ble-parser.test.ts
│   │   ├── integration/
│   │   │   ├── wallet-ledger.test.ts
│   │   │   ├── doorstep-settlement.test.ts
│   │   │   ├── payout-idempotency.test.ts
│   │   │   └── geofence-sla.test.ts
│   │   └── fixtures/
│   │       ├── database.fixture.ts
│   │       └── scale-packet.fixture.ts
```

### 1.2 Test Execution Commands

**Current repo (SvelteKit):**
```bash
npm run test              # Vitest unit tests (single run)
npm run test:unit         # Vitest watch mode
npm run check             # Svelte typecheck
npm run lint              # ESLint + Prettier
```

**Target monorepo (when scaffolded):**
```bash
pnpm run test:unit        # Unit tests only
pnpm run test:integration # DB integration tests (Neon ephemeral)
pnpm run test --coverage  # Full suite with coverage
```

### 1.3 Test Environment Variables

| Variable | Required for | Example |
|----------|--------------|---------|
| `DATABASE_URL` | Integration tests | Neon pooled connection string |
| `BLE_HW_SECRET` | BLE parser tests | `KACHRACASH_BLE_HW_SECRET_KEY_2026` |
| `PAYOUT_GATEWAY_KEY` | Payout webhook tests | Sandbox API key |
| `OTP_HASH_SALT` | Doorstep settlement tests | Random 32-byte hex |

---

## 2. Pricing & Floor Rate Engine Unit Tests

### 2.1 Theoretical Pricing Equation
The floor price $P_{\text{floor}}$ per commodity kilogram is deterministically computed as:

$$P_{\text{floor}} = \left[ P_{\text{national}} - (C_{\text{freight}} + C_{\text{handling}} + M_{\text{aggregator}}) \right] \times (1 - M_{\text{collector}}) \times (1 - \alpha_{\text{risk}})$$

Where:
* $P_{\text{national}}$ = Reference benchmark index rate ($\text{₹/kg}$).
* $C_{\text{freight}}$ = Regional logistics freight adjustment ($\text{₹/kg}$).
  * **Short-haul (Guwahati <-> Byrnihat Ferrous Hub):** $C_{\text{freight}} = \text{₹1.20/kg}$.
  * **Long-haul (Guwahati <-> Siliguri/West Bengal Polymer Hub):** $C_{\text{freight}} = \text{₹3.50/kg}$.
* $C_{\text{handling}}$ = Direct labor & processing expense ($\text{₹/kg}$).
* $M_{\text{aggregator}}$ = Central platform aggregator margin.
* $M_{\text{collector}}$ = Partner collector baseline commission rate ($8\% = 0.08$).
* $\alpha_{\text{risk}}$ = Volatility protection buffer ($0.03 \le \alpha_{\text{risk}} \le 0.07$).

### 2.2 Executable Unit Test Suite (`pricing-engine.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { calculateFloorRate, PricingInput } from '../../services/pricing-engine';

describe('Pricing & Floor Rate Card Engine', () => {
  it('should compute correct floor price for short-haul Byrnihat Ferrous scrap (C_freight = ₹1.20/kg)', () => {
    const input: PricingInput = {
      nationalIndexRate: 40.00,  // ₹40/kg
      freightCost: 1.20,         // Short-haul Byrnihat
      handlingCost: 1.80,
      aggregatorMargin: 2.00,
      collectorMargin: 0.08,    // 8% take-rate
      volatilityBuffer: 0.05    // 5% alpha_risk
    };

    // Expected: [40 - (1.20 + 1.80 + 2.00)] * (1 - 0.08) * (1 - 0.05)
    // = [35.00] * 0.92 * 0.95 = 30.59
    const result = calculateFloorRate(input);
    expect(result.floorRate).toBeCloseTo(30.59, 2);
    expect(result.isValid).toBe(true);
  });

  it('should compute correct floor price for long-haul Siliguri Polymer scrap (C_freight = ₹3.50/kg)', () => {
    const input: PricingInput = {
      nationalIndexRate: 32.00,
      freightCost: 3.50,         // Long-haul Siliguri
      handlingCost: 2.00,
      aggregatorMargin: 1.50,
      collectorMargin: 0.08,
      volatilityBuffer: 0.04
    };

    // Expected: [32 - (3.50 + 2.00 + 1.50)] * 0.92 * 0.96
    // = [25.00] * 0.92 * 0.96 = 22.08
    const result = calculateFloorRate(input);
    expect(result.floorRate).toBeCloseTo(22.08, 2);
    expect(result.isValid).toBe(true);
  });

  it('should enforce volatility buffer bounds (0.03 <= alpha_risk <= 0.07)', () => {
    const invalidInputLow: PricingInput = {
      nationalIndexRate: 30.00,
      freightCost: 1.20,
      handlingCost: 1.00,
      aggregatorMargin: 1.00,
      collectorMargin: 0.08,
      volatilityBuffer: 0.01 // Violates min bound (0.03)
    };

    expect(() => calculateFloorRate(invalidInputLow)).toThrowError(
      'Volatility buffer (alpha_risk) must be between 0.03 and 0.07'
    );
  });

  it('should reject commodity index crash scenarios resulting in sub-zero rates', () => {
    const crashInput: PricingInput = {
      nationalIndexRate: 4.00, // Index crash below operational costs
      freightCost: 3.50,
      handlingCost: 2.00,
      aggregatorMargin: 1.00,
      collectorMargin: 0.08,
      volatilityBuffer: 0.05
    };

    const result = calculateFloorRate(crashInput);
    expect(result.isValid).toBe(false);
    expect(result.floorRate).toBe(0.00);
    expect(result.rejectionReason).toBe('COMMODITY_MARGIN_COLLAPSE');
  });
});
```

---

## 3. Atomic Wallet Ledger & Escrow Settlement Integration Tests

### 3.1 Executable Integration Test Suite (`wallet-ledger.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@kachracash/db';
import { Prisma } from '@prisma/client';
import { assignPickupOrder, processPayoutWebhook } from '../../services/wallet-service';
import { createTestUser, createTestWallet, cleanDatabase } from '../fixtures/database.fixture';

describe('Atomic Wallet Ledger & Escrow Settlement Integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it('should REJECT order assignment if collector float balance is below ₹2,000 threshold', async () => {
    const collector = await createTestUser('COLLECTOR');
    await createTestWallet(collector.id, 1450.00); // Float balance < ₹2,000 threshold

    const orderId = 'ORD_TEST_001';

    await expect(assignPickupOrder(orderId, collector.id)).rejects.toThrowError(
      'INSUFFICIENT_FLOAT_BALANCE: Collector wallet float (₹1,450.00) is below minimum threshold of ₹2,000.00'
    );
  });

  it('should grant provisional float extension (+₹1,000) for active in-route collector experiencing float depletion', async () => {
    const collector = await createTestUser('COLLECTOR');
    const wallet = await createTestWallet(collector.id, 1200.00); // Float dropped mid-route

    const orderId = 'ORD_ACTIVE_ROUTE_002';

    // Execution with active route flag grants provisional buffer
    const assignment = await assignPickupOrder(orderId, collector.id, 500.00, { activeRouteExtension: true });
    expect(assignment.status).toBe('ASSIGNED');
    expect(assignment.provisionalBufferApplied).toBe(1000.00);
  });

  it('should verify that collector_wallets.float_balance strictly equals mathematical sum of wallet_ledger', async () => {
    const collector = await createTestUser('COLLECTOR');
    const wallet = await createTestWallet(collector.id, 2000.00); // Initial deposit

    // Create a series of debits, credits, and penalties
    await db.$transaction(async (tx) => {
      await tx.walletLedger.createMany({
        data: [
          { walletId: wallet.id, amount: new Prisma.Decimal(500.00), type: 'CREDIT', description: 'Topup', idempotencyKey: 'TOPUP_1' },
          { walletId: wallet.id, amount: new Prisma.Decimal(-250.00), type: 'DEBIT', description: 'Order 1', idempotencyKey: 'DEBIT_1' },
          { walletId: wallet.id, amount: new Prisma.Decimal(-150.00), type: 'PENALTY', description: 'SLA Breach', idempotencyKey: 'PENALTY_1' }
        ]
      });

      await tx.collectorWallet.update({
        where: { id: wallet.id },
        data: { floatBalance: 2100.00 } // 2000 + 500 - 250 - 150 = 2100
      });
    });

    const refreshedWallet = await db.collectorWallet.findUniqueOrThrow({ where: { id: wallet.id } });
    const ledgerSum = await db.walletLedger.aggregate({
      where: { walletId: wallet.id },
      _sum: { amount: true }
    });

    // Assert absolute parity between cached float balance and ledger sum
    const totalExpected = 2000.00 + Number(ledgerSum._sum.amount);
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
      idempotencyKey
    };

    // First webhook call: should succeed
    const firstResult = await processPayoutWebhook(payload);
    expect(firstResult.status).toBe('SUCCESS');

    // Duplicate webhook call: should return 200 OK with duplicate flag without writing new ledger row
    const duplicateResult = await processPayoutWebhook(payload);
    expect(duplicateResult.status).toBe('SUCCESS');
    expect(duplicateResult.isDuplicate).toBe(true);

    const ledgerRows = await db.walletLedger.count({
      where: { idempotencyKey }
    });
    expect(ledgerRows).toBe(1); // Strictly ONE ledger entry recorded
  });
});
```

---

## 4. Hardware BLE Scale Stream & Anti-Tamper Tests

### 4.1 Executable Hardware Test Suite (`ble-parser.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { parseBLEScalePacket, validateScaleIngestion } from '@kachracash/types';

describe('Hardware BLE Scale Stream & Anti-Tamper Validation', () => {
  const SECRET = 'KACHRACASH_BLE_HW_SECRET_KEY_2026';

  it('should parse valid signed 8-byte BLE scale telemetry packet', () => {
    // Binary packet: [Header:0xAA, ScaleMode:0x01, Weight:15400g (0x3C28), Batt:95%, Tare:1, Sig:ValidHMAC]
    const validPacket = Buffer.from([0xAA, 0x01, 0x3C, 0x28, 0x5F, 0x01, 0xA4, 0x12]);

    const parsed = parseBLEScalePacket(validPacket, SECRET);
    expect(parsed.weightKg).toBe(15.400);
    expect(parsed.isTared).toBe(true);
    expect(parsed.batteryPct).toBe(95);
  });

  it('should REJECT weight ingestion if zero-tare confirmation (isTared = false) was not recorded prior to weighing', () => {
    const untaredPacket = Buffer.from([0xAA, 0x01, 0x0F, 0xA0, 0x5F, 0x00, 0xBF, 0x44]);

    const parsed = parseBLEScalePacket(untaredPacket, SECRET);
    expect(() => validateScaleIngestion(parsed)).toThrowError(
      'ZERO_TARE_REQUIRED: Scale must register 0.000 kg baseline tare before accepting scrap weight.'
    );
  });

  it('should REJECT requests attempting to inject manual numeric text weights (403 Forbidden)', async () => {
    const manualWeightPayload = {
      orderId: 'ORD_MANUAL_HACK',
      manualWeightInputKg: 45.0, // Client side text input attempt
      scaleTelemetryPacket: null
    };

    expect(() => validateScaleIngestion(manualWeightPayload as any)).toThrowError(
      'FORBIDDEN_MANUAL_WEIGHT: Manual numeric text input is strictly forbidden. Scrap weight must originate from BLE scale stream.'
    );
  });
});
```

---

## 5. Operational SLA & Monsoon Dispatch Tests

### 5.1 Executable SLA & Monsoon Test Suite (`geofence-sla.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@kachracash/db';
import { evaluateDispatchSLA, toggleWardSuspension, createPickupRequest } from '../../services/dispatch-sla';
import { createTestUser, createTestWallet, cleanDatabase } from '../fixtures/database.fixture';

describe('Operational SLA & Monsoon Dispatch Integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should execute T-15 min SLA reassignment, debit ₹150 penalty from collector, and generate ₹100 citizen credit voucher when collector is outside 500m', async () => {
    const collector = await createTestUser('COLLECTOR');
    const wallet = await createTestWallet(collector.id, 4000.00);

    const orderId = 'ORD_SLA_BREACH_001';

    const result = await evaluateDispatchSLA({
      orderId,
      collectorId: collector.id,
      collectorLocation: { lat: 26.1100, lng: 91.7500 }, // 1.2 km away from pickup
      pickupLocation: { lat: 26.1200, lng: 91.7600 },
      timeToSlotMinutes: 15
    });

    expect(result.status).toBe('REASSIGNED');
    expect(result.penaltyLevied).toBe(150.00);
    expect(result.citizenVoucherIssued).toBe(100.00);

    // Assert ₹150 penalty debited from collector wallet
    const updatedWallet = await db.collectorWallet.findUniqueOrThrow({
      where: { id: wallet.id }
    });
    expect(Number(updatedWallet.floatBalance)).toBe(3850.00);
  });

  it('should BLOCK new pickup requests and trigger customer rescheduling SMS when Beltola Ward is suspended for monsoon flooding', async () => {
    const citizen = await createTestUser('CITIZEN');

    // 1. Admin suspends Beltola Ward due to flash flooding
    await toggleWardSuspension({
      wardId: 'WARD_BELTOLA_28',
      isFloodSuspended: true,
      reason: 'Severe urban waterlogging on Beltola Survey Bypass Road'
    });

    // 2. Citizen attempts to create new pickup request in suspended ward
    await expect(
      createPickupRequest({
        citizenId: citizen.id,
        wardId: 'WARD_BELTOLA_28',
        visualTier: 'RIGID_CONTAINERS',
        pickupLocation: { lat: 26.1300, lng: 91.7800 }
      })
    ).rejects.toThrowError(
      'WARD_TEMPORARILY_SUSPENDED: Pickup requests in Beltola are suspended due to flash flooding. Slot rescheduling notification dispatched via SMS.'
    );
  });
});
```

---

## 6. Doorstep OTP Settlement Integration Tests

### 6.1 Executable Settlement Test Suite (`doorstep-settlement.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@kachracash/db';
import { completeDoorstepSettlement } from '../../services/wallet-service';
import { createTestUser, createTestWallet, cleanDatabase } from '../fixtures/database.fixture';
import bcrypt from 'bcrypt';

describe('Doorstep OTP Settlement Integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should complete settlement with flat 8% platform fee on MVP transactions', async () => {
    const collector = await createTestUser('COLLECTOR');
    await createTestWallet(collector.id, 5000.00);
    const grossAmount = 250.00;
    const otp = '4829';
    const otpHash = await bcrypt.hash(otp, 10);

    const result = await completeDoorstepSettlement({
      orderId: 'ORD_SETTLE_001',
      collectorId: collector.id,
      otp,
      otpHash,
      grossAmount,
      takeRatePercentage: 0.08, // MVP flat rate
      bleItems: [{ categoryId: 'PET_RIGID', weightKg: 10.0, unitRate: 25.0 }]
    });

    expect(result.platformFee).toBe(20.00);
    expect(result.netPayout).toBe(230.00);
    expect(result.status).toBe('COMPLETED');
  });

  it('should REJECT settlement with incorrect OTP', async () => {
    const collector = await createTestUser('COLLECTOR');
    await createTestWallet(collector.id, 5000.00);
    const otpHash = await bcrypt.hash('4829', 10);

    await expect(
      completeDoorstepSettlement({
        orderId: 'ORD_BAD_OTP',
        collectorId: collector.id,
        otp: '0000',
        otpHash,
        grossAmount: 100.00,
        takeRatePercentage: 0.08,
        bleItems: []
      })
    ).rejects.toThrowError('INVALID_OTP');
  });

  it('should REJECT settlement when order status is not WEIGHING', async () => {
    // Order in ASSIGNED state — weighing not yet started
    await expect(
      completeDoorstepSettlement({ orderId: 'ORD_NOT_WEIGHING', /* ... */ })
    ).rejects.toThrowError('INVALID_ORDER_STATE');
  });
});
```

---

## 7. Coverage Targets

| Module | Minimum coverage | Priority |
|--------|-----------------|----------|
| `pricing-engine` | 90% | P0 |
| `ble-parser` | 95% | P0 |
| `wallet-service` (ledger mutations) | 100% on debit/credit paths | P0 |
| `dispatch-sla` | 85% | P1 |
| `doorstep-settlement` | 90% | P0 |
