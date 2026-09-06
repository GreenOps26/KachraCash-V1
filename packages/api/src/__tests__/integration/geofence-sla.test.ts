import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@kachracash/db';
import {
  evaluateDispatchSLA,
  toggleWardSuspension,
  createPickupRequest,
} from '../../services/dispatch-sla.js';
import {
  createTestUser,
  createTestWallet,
  cleanDatabase,
} from '../fixtures/database.fixture.js';

describe('Operational SLA & Monsoon Dispatch Integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should execute T-15 min SLA reassignment, debit ₹150 penalty from collector, and generate ₹100 citizen credit voucher when collector is outside 500m', async () => {
    const collector = await createTestUser('COLLECTOR');
    const wallet = await createTestWallet(collector.id, 4000.0);

    const orderId = 'ORD_SLA_BREACH_001';

    const result = await evaluateDispatchSLA({
      orderId,
      collectorId: collector.id,
      collectorLocation: { lat: 26.11, lng: 91.75 }, // ~1.5 km away from pickup
      pickupLocation: { lat: 26.12, lng: 91.76 },
      timeToSlotMinutes: 15,
    });

    expect(result.status).toBe('REASSIGNED');
    expect(result.penaltyLevied).toBe(150.0);
    expect(result.citizenVoucherIssued).toBe(100.0);

    // Assert ₹150 penalty debited from collector wallet
    const updatedWallet = await db.collectorWallet.findUniqueOrThrow({
      where: { id: wallet.id },
    });
    expect(Number(updatedWallet.floatBalance)).toBe(3850.0);
  });

  it('should BLOCK new pickup requests and trigger customer rescheduling SMS when Beltola Ward is suspended for monsoon flooding', async () => {
    const citizen = await createTestUser('CITIZEN');

    // 1. Admin suspends Beltola Ward due to flash flooding
    await toggleWardSuspension({
      wardId: 'WARD_BELTOLA_28',
      isFloodSuspended: true,
      reason: 'Severe urban waterlogging on Beltola Survey Bypass Road',
    });

    // 2. Citizen attempts to create new pickup request in suspended ward
    await expect(
      createPickupRequest({
        citizenId: citizen.id,
        wardId: 'WARD_BELTOLA_28',
        visualTier: 'RIGID_CONTAINERS',
        pickupLocation: { lat: 26.13, lng: 91.78 },
      }),
    ).rejects.toThrowError(
      'WARD_TEMPORARILY_SUSPENDED: Pickup requests in Beltola are suspended due to flash flooding. Slot rescheduling notification dispatched via SMS.',
    );
  });
});
