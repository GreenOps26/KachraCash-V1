import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@kachracash/db';
import { createPickupRequest, evaluateDispatchSLA, toggleWardSuspension } from '../../services/dispatch-sla';
import { cleanDatabase, createTestUser, createTestWallet, ensureBeltolaRegion } from '../fixtures/database.fixture';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('Operational SLA & Monsoon Dispatch Integration', () => {
	beforeEach(async () => {
		await cleanDatabase();
	});

	it('should execute T-15 min SLA reassignment, debit ₹150 penalty from collector, and generate ₹100 citizen credit voucher when collector is outside 500m', async () => {
		const collector = await createTestUser('COLLECTOR');
		const wallet = await createTestWallet(collector.id, 4000.0);

		const result = await evaluateDispatchSLA({
			orderId: 'ORD_SLA_BREACH_001',
			collectorId: collector.id,
			collectorLocation: { lat: 26.11, lng: 91.75 },
			pickupLocation: { lat: 26.12, lng: 91.76 },
			timeToSlotMinutes: 15
		});

		expect(result.status).toBe('REASSIGNED');
		expect(result.penaltyLevied).toBe(150.0);
		expect(result.citizenVoucherIssued).toBe(100.0);

		const updatedWallet = await db.collectorWallet.findUniqueOrThrow({ where: { id: wallet.id } });
		expect(Number(updatedWallet.floatBalance)).toBe(3850.0);
	});

	it('should BLOCK new pickup requests and trigger customer rescheduling SMS when Beltola Ward is suspended for monsoon flooding', async () => {
		await ensureBeltolaRegion();
		const citizen = await createTestUser('CITIZEN');

		await toggleWardSuspension({
			wardId: 'WARD_BELTOLA_28',
			isFloodSuspended: true,
			reason: 'Severe urban waterlogging on Beltola Survey Bypass Road'
		});

		await expect(
			createPickupRequest({
				citizenId: citizen.id,
				wardId: 'WARD_BELTOLA_28',
				visualTier: 'RIGID_CONTAINERS',
				pickupLocation: { lat: 26.13, lng: 91.78 }
			})
		).rejects.toThrowError(
			'WARD_TEMPORARILY_SUSPENDED: Pickup requests in Beltola are suspended due to flash flooding. Slot rescheduling notification dispatched via SMS.'
		);
	});
});
