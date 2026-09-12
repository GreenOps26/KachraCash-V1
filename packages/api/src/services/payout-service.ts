import { db } from '@kachracash/db';
import type { InitiatePayoutResult, PayoutGatewayProvider } from '@kachracash/types';
import { createPayoutGateway, loadPayoutGatewayConfig } from '../gateway/payout/factory';
import type { PayoutGateway } from '../gateway/payout/types';
import { processPayoutWebhook } from './wallet-service';

export async function initiateCitizenPayout(orderId: string): Promise<InitiatePayoutResult> {
	const transaction = await db.transaction.findUnique({
		where: { requestId: orderId },
		include: {
			payout: true,
			request: { include: { citizen: true } }
		}
	});

	if (!transaction) {
		throw new Error('TRANSACTION_NOT_FOUND');
	}

	if (transaction.payout) {
		return {
			payoutId: transaction.payout.id,
			transactionId: transaction.id,
			orderId,
			provider: 'stub',
			gatewayRef: transaction.payout.gatewayRef ?? `EXISTING_${transaction.payout.id}`,
			status: transaction.payout.status as InitiatePayoutResult['status'],
			amount: Number(transaction.payout.amount),
			upiVpa: transaction.payout.upiVpa
		};
	}

	const citizen = transaction.request.citizen;
	if (!citizen.upiVpa) {
		throw new Error('CITIZEN_VPA_MISSING: Citizen must register a UPI VPA before payout');
	}

	const netPayout = Number(transaction.netPayout);
	if (netPayout <= 0) {
		throw new Error('INVALID_NET_PAYOUT');
	}

	const idempotencyKey = `PAYOUT_${orderId}`;
	const gateway = createPayoutGateway();
	const provider = gateway.provider as PayoutGatewayProvider;

	const payout = await db.payout.create({
		data: {
			transactionId: transaction.id,
			upiVpa: citizen.upiVpa,
			amount: netPayout,
			status: 'INITIATED',
			idempotencyKey
		}
	});

	const transfer = await gateway.initiateTransfer({
		transactionId: transaction.id,
		orderId,
		idempotencyKey,
		amount: netPayout,
		upiVpa: citizen.upiVpa,
		citizenName: citizen.fullName ?? undefined,
		remarks: `KachraCash scrap payout ${orderId}`
	});

	const payoutStatus = transfer.status === 'SUCCESS' ? 'SUCCESS' : 'INITIATED';

	await db.payout.update({
		where: { id: payout.id },
		data: {
			gatewayRef: transfer.gatewayRef,
			status: payoutStatus
		}
	});

	const config = loadPayoutGatewayConfig();
	if (config.stubAutoConfirm && provider === 'stub' && payoutStatus !== 'SUCCESS') {
		await db.payout.update({
			where: { id: payout.id },
			data: { status: 'SUCCESS' }
		});
	}

	return {
		payoutId: payout.id,
		transactionId: transaction.id,
		orderId,
		provider,
		gatewayRef: transfer.gatewayRef,
		status: config.stubAutoConfirm && provider === 'stub' ? 'SUCCESS' : payoutStatus,
		amount: netPayout,
		upiVpa: citizen.upiVpa
	};
}

export async function handleProviderPayoutWebhook(
	gateway: PayoutGateway,
	headers: Record<string, string | string[] | undefined>,
	rawBody: string,
	parsedBody: unknown
) {
	if (!gateway.verifyWebhookSignature(headers, rawBody)) {
		throw new Error('INVALID_WEBHOOK_SIGNATURE');
	}

	const parsed = gateway.parseWebhookPayload(parsedBody);
	if (!parsed) {
		throw new Error('INVALID_WEBHOOK_PAYLOAD');
	}

	const payout = await db.payout.findFirst({
		where: {
			OR: [{ idempotencyKey: parsed.idempotencyKey }, { gatewayRef: parsed.gatewayRef }]
		},
		include: { transaction: { include: { request: true } } }
	});

	if (!payout) {
		throw new Error('PAYOUT_NOT_FOUND');
	}

	return processPayoutWebhook({
		transactionId: payout.transactionId,
		gatewayRef: parsed.gatewayRef,
		upiVpa: payout.upiVpa,
		amount: Number(payout.amount),
		idempotencyKey: `PAYOUT_HOOK_${payout.transaction.requestId}`
	});
}
