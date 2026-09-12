import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { OrderStatus } from '@kachracash/db';
import { buildServer } from '../../app';
import {
	cleanDatabase,
	createTestUser,
	createTestWallet,
	ensureBeltolaRegion
} from '../fixtures/database.fixture';

const hasDatabase = Boolean(process.env.DATABASE_URL);

let app: FastifyInstance;

beforeAll(async () => {
	process.env.PICKUP_DEV_OTP = 'true';
	process.env.COLLECTOR_DEV_AUTH = 'true';
	process.env.PAYOUT_STUB_AUTO_CONFIRM = 'true';
	app = await buildServer();
});

afterAll(async () => {
	await app.close();
});

describe.skipIf(!hasDatabase)('Pickup HTTP E2E', () => {
	beforeEach(async () => {
		await cleanDatabase();
	});

	it('books, accepts, completes, and initiates payout for one pickup', async () => {
		const collector = await createTestUser('COLLECTOR');
		await createTestWallet(collector.id, 5000);
		const citizen = await createTestUser('CITIZEN');
		await ensureBeltolaRegion();

		const { db } = await import('@kachracash/db');
		await db.citizen.update({
			where: { id: citizen.id },
			data: { upiVpa: 'demo.citizen@upi' }
		});

		await db.scrapCategory.upsert({
			where: { sku: 'PET_RIGID' },
			update: { name: 'PET bottles', visualTier: 'RIGID_CONTAINERS', swmStream: 'DRY_RECYCLABLE' },
			create: {
				sku: 'PET_RIGID',
				name: 'PET bottles',
				visualTier: 'RIGID_CONTAINERS',
				swmStream: 'DRY_RECYCLABLE'
			}
		});

		const login = await app.inject({
			method: 'POST',
			url: '/api/v1/auth/collector/dev-login',
			payload: { collectorId: collector.id }
		});

		expect(login.statusCode).toBe(200);
		const { token } = login.json() as { token: string };

		const create = await app.inject({
			method: 'POST',
			url: '/api/v1/pickups',
			payload: {
				citizenId: citizen.id,
				wardId: 'GMC-WARD-28',
				visualTier: 'RIGID_CONTAINERS',
				pickupLocation: { lat: 26.1445, lng: 91.7362 }
			}
		});

		expect(create.statusCode, JSON.stringify(create.json())).toBe(201);
		const { pickup } = create.json() as { pickup: { id: string } };

		const accept = await app.inject({
			method: 'POST',
			url: `/api/v1/pickups/${pickup.id}/accept`,
			headers: { authorization: `Bearer ${token}` },
			payload: { collectorId: collector.id }
		});

		expect(accept.statusCode).toBe(200);

		const complete = await app.inject({
			method: 'POST',
			url: `/api/v1/orders/${pickup.id}/complete`,
			headers: { authorization: `Bearer ${token}` },
			payload: {
				collectorId: collector.id,
				otp: '4829',
				grossAmount: 160,
				bleItems: [{ categoryId: 'PET_RIGID', weightKg: 10, unitRate: 16 }]
			}
		});

		expect(complete.statusCode).toBe(200);
		const body = complete.json() as { status: string; payout: { status: string } };
		expect(body.status).toBe('COMPLETED');
		expect(body.payout.status).toBe('SUCCESS');

		const detail = await app.inject({
			method: 'GET',
			url: `/api/v1/pickups/${pickup.id}?citizenId=${citizen.id}`
		});

		expect(detail.statusCode).toBe(200);
		const detailBody = detail.json() as { pickup: { status: string } };
		expect(detailBody.pickup.status).toBe(OrderStatus.COMPLETED);
	}, 30000);
});
