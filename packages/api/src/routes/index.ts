import bcrypt from 'bcryptjs';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@kachracash/db';
import {
	acceptPickupSchema,
	collectorDevLoginSchema,
	collectorPhoneLoginSchema,
	completeOrderSchema,
	createPickupSchema,
	visualTierSchema,
	wardSuspendSchema,
	walletTopUpSchema
} from '@kachracash/types';
import { OrderStatus } from '@kachracash/db';
import { CashfreePayoutGateway } from '../gateway/payout/cashfree-gateway';
import { loadPayoutGatewayConfig } from '../gateway/payout/factory';
import { RazorpayxPayoutGateway } from '../gateway/payout/razorpayx-gateway';
import { StubPayoutGateway } from '../gateway/payout/stub-gateway';
import { createPickupRequest, toggleWardSuspension } from '../services/dispatch-sla';
import {
	extractBearerToken,
	loginCollectorByPhone,
	loginCollectorDev,
	verifyCollectorToken
} from '../services/auth-service';
import { listCollectorWallets, listDispatchAssignments, listRecentLedgerEntries } from '../services/admin-ops-service';
import { acceptPickup, getPickupDetail, listPickups } from '../services/pickup-flow';
import { handleProviderPayoutWebhook, initiateCitizenPayout } from '../services/payout-service';
import { getFloorRatesByTier, listPilotWards } from '../services/rate-cards';
import { completeDoorstepSettlement, topUpCollectorWallet } from '../services/wallet-service';

function requireCollectorAuth(request: FastifyRequest, reply: FastifyReply) {
	const token = extractBearerToken(request.headers.authorization);

	if (!token) {
		reply.status(401).send({ error: 'UNAUTHORIZED' });
		return null;
	}

	const auth = verifyCollectorToken(token);

	if (!auth) {
		reply.status(401).send({ error: 'INVALID_TOKEN' });
		return null;
	}

	return auth;
}

export async function registerRoutes(app: FastifyInstance) {
	app.post('/api/v1/auth/collector/login', async (request, reply) => {
		const parsed = collectorPhoneLoginSchema.safeParse(request.body);

		if (!parsed.success) {
			return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		try {
			return await loginCollectorByPhone(parsed.data.phoneNumber);
		} catch (error) {
			if (error instanceof Error) {
				return reply.status(404).send({ error: error.message });
			}
			throw error;
		}
	});

	app.post('/api/v1/auth/collector/dev-login', async (request, reply) => {
		const parsed = collectorDevLoginSchema.safeParse(request.body);

		if (!parsed.success) {
			return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		try {
			return await loginCollectorDev(parsed.data.collectorId);
		} catch (error) {
			if (error instanceof Error) {
				return reply.status(400).send({ error: error.message });
			}
			throw error;
		}
	});

	app.get('/api/v1/admin/dispatch', async (_request, reply) => {
		try {
			const assignments = await listDispatchAssignments();
			return { assignments };
		} catch {
			return reply.status(503).send({ error: 'DATABASE_UNAVAILABLE' });
		}
	});

	app.get('/api/v1/admin/ledger', async (_request, reply) => {
		try {
			const [collectors, entries] = await Promise.all([
				listCollectorWallets(),
				listRecentLedgerEntries()
			]);
			return { collectors, entries };
		} catch {
			return reply.status(503).send({ error: 'DATABASE_UNAVAILABLE' });
		}
	});

	app.get('/api/v1/health', async () => {
		const payoutConfig = loadPayoutGatewayConfig();
		return {
			status: 'ok',
			service: 'kachracash-api',
			timestamp: new Date().toISOString(),
			payoutGateway: {
				provider: payoutConfig.provider,
				mode: payoutConfig.mode
			}
		};
	});

	app.get('/api/v1/wards', async (_request, reply) => {
		try {
			const wards = await listPilotWards();
			return { wards };
		} catch {
			return reply.status(503).send({ error: 'DATABASE_UNAVAILABLE' });
		}
	});

	app.get('/api/v1/rates', async (request, reply) => {
		const tierParam = (request.query as { tier?: string }).tier;
		const parsedTier = visualTierSchema.safeParse(tierParam);

		if (!parsedTier.success) {
			return reply.status(400).send({ error: 'INVALID_VISUAL_TIER' });
		}

		try {
			const rates = await getFloorRatesByTier(parsedTier.data);
			return { visualTier: parsedTier.data, rates };
		} catch {
			return reply.status(503).send({ error: 'DATABASE_UNAVAILABLE' });
		}
	});

	app.get('/api/v1/pickups', async (request, reply) => {
		const query = request.query as { status?: string; collectorId?: string };
		const status = query.status as OrderStatus | undefined;

		if (status && !Object.values(OrderStatus).includes(status)) {
			return reply.status(400).send({ error: 'INVALID_STATUS' });
		}

		try {
			const pickups = await listPickups({
				status,
				collectorId: query.collectorId
			});
			return { pickups };
		} catch {
			return reply.status(503).send({ error: 'DATABASE_UNAVAILABLE' });
		}
	});

	app.get('/api/v1/pickups/:requestId', async (request, reply) => {
		const { requestId } = request.params as { requestId: string };
		const query = request.query as { citizenId?: string };

		try {
			const pickup = await getPickupDetail(requestId, { citizenId: query.citizenId });
			const { devOtp, ...rest } = pickup;
			return { pickup: rest, devOtp };
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === 'PICKUP_NOT_FOUND') {
					return reply.status(404).send({ error: error.message });
				}
				if (error.message === 'PICKUP_ACCESS_DENIED') {
					return reply.status(403).send({ error: error.message });
				}
			}
			return reply.status(503).send({ error: 'DATABASE_UNAVAILABLE' });
		}
	});

	app.post('/api/v1/pickups/:requestId/accept', async (request, reply) => {
		const auth = requireCollectorAuth(request, reply);
		if (!auth) return;

		const { requestId } = request.params as { requestId: string };
		const parsed = acceptPickupSchema.safeParse(request.body);

		if (!parsed.success) {
			return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		if (parsed.data.collectorId !== auth.collectorId) {
			return reply.status(403).send({ error: 'COLLECTOR_MISMATCH' });
		}

		try {
			const result = await acceptPickup(requestId, parsed.data.collectorId);
			return result;
		} catch (error) {
			if (error instanceof Error) {
				return reply.status(400).send({ error: error.message });
			}
			throw error;
		}
	});

	app.post('/api/v1/pickups', async (request, reply) => {
		const parsed = createPickupSchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		try {
			const pickup = await createPickupRequest({
				citizenId: parsed.data.citizenId,
				wardId: parsed.data.wardId,
				visualTier: parsed.data.visualTier,
				pickupLocation: parsed.data.pickupLocation,
				scheduledSlotStart: parsed.data.scheduledSlotStart
					? new Date(parsed.data.scheduledSlotStart)
					: undefined,
				scheduledSlotEnd: parsed.data.scheduledSlotEnd
					? new Date(parsed.data.scheduledSlotEnd)
					: undefined
			});

			return reply.status(201).send({ pickup });
		} catch (error) {
			if (error instanceof Error) {
				return reply.status(400).send({ error: error.message });
			}
			throw error;
		}
	});

	app.post('/api/v1/orders/:requestId/complete', async (request, reply) => {
		const auth = requireCollectorAuth(request, reply);
		if (!auth) return;

		const { requestId } = request.params as { requestId: string };
		const parsed = completeOrderSchema.safeParse(request.body);

		if (!parsed.success) {
			return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		if (parsed.data.collectorId !== auth.collectorId) {
			return reply.status(403).send({ error: 'COLLECTOR_MISMATCH' });
		}

		const pickup = await db.pickupRequest.findUnique({ where: { id: requestId } });
		if (!pickup) {
			return reply.status(404).send({ error: 'ORDER_NOT_FOUND' });
		}

		const transaction = await db.transaction.findUnique({ where: { requestId } });
		const otpHash = transaction?.otpHash ?? (await bcrypt.hash(parsed.data.otp, 10));

		try {
			const result = await completeDoorstepSettlement({
				orderId: requestId,
				collectorId: parsed.data.collectorId,
				otp: parsed.data.otp,
				otpHash,
				grossAmount: parsed.data.grossAmount,
				takeRatePercentage: 0.08,
				bleItems: parsed.data.bleItems
			});

			let payout: Awaited<ReturnType<typeof initiateCitizenPayout>> | { error: string };
			try {
				payout = await initiateCitizenPayout(requestId);
			} catch (payoutError) {
				payout = {
					error: payoutError instanceof Error ? payoutError.message : 'PAYOUT_INITIATION_FAILED'
				};
			}

			return { ...result, payout };
		} catch (error) {
			if (error instanceof Error) {
				return reply.status(400).send({ error: error.message });
			}
			throw error;
		}
	});

	app.post('/api/v1/admin/wards/:wardId/suspend', async (request, reply) => {
		const { wardId } = request.params as { wardId: string };
		const parsed = wardSuspendSchema.safeParse(request.body);

		if (!parsed.success) {
			return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		try {
			await toggleWardSuspension({
				wardId,
				isFloodSuspended: parsed.data.isFloodSuspended,
				reason: parsed.data.reason
			});

			return {
				wardId,
				isFloodSuspended: parsed.data.isFloodSuspended,
				triggerCustomerRescheduleSms: parsed.data.triggerCustomerRescheduleSms ?? false
			};
		} catch (error) {
			if (error instanceof Error) {
				return reply.status(400).send({ error: error.message });
			}
			throw error;
		}
	});

	app.post('/api/v1/webhooks/payouts/cashfree', async (request, reply) => {
		const gateway = new CashfreePayoutGateway(loadPayoutGatewayConfig());
		const rawBody = JSON.stringify(request.body ?? {});

		try {
			const result = await handleProviderPayoutWebhook(
				gateway,
				request.headers,
				rawBody,
				request.body
			);
			return result;
		} catch (error) {
			if (error instanceof Error) {
				return reply.status(400).send({ error: error.message });
			}
			throw error;
		}
	});

	app.post('/api/v1/webhooks/payouts/razorpayx', async (request, reply) => {
		const gateway = new RazorpayxPayoutGateway(loadPayoutGatewayConfig());
		const rawBody = JSON.stringify(request.body ?? {});

		try {
			const result = await handleProviderPayoutWebhook(
				gateway,
				request.headers,
				rawBody,
				request.body
			);
			return result;
		} catch (error) {
			if (error instanceof Error) {
				return reply.status(400).send({ error: error.message });
			}
			throw error;
		}
	});

	app.post('/api/v1/webhooks/payouts/stub', async (request, reply) => {
		const gateway = new StubPayoutGateway();
		const rawBody = JSON.stringify(request.body ?? {});

		try {
			const result = await handleProviderPayoutWebhook(
				gateway,
				request.headers,
				rawBody,
				request.body
			);
			return result;
		} catch (error) {
			if (error instanceof Error) {
				return reply.status(400).send({ error: error.message });
			}
			throw error;
		}
	});

	app.post('/api/v1/wallets/topup', async (request, reply) => {
		const parsed = walletTopUpSchema.safeParse(request.body);

		if (!parsed.success) {
			return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		try {
			const result = await topUpCollectorWallet(parsed.data);
			return result;
		} catch (error) {
			if (error instanceof Error) {
				return reply.status(400).send({ error: error.message });
			}
			throw error;
		}
	});
}
