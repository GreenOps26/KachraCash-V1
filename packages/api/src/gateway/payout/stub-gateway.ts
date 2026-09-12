import { cashfreePayoutWebhookSchema, razorpayxPayoutWebhookSchema } from '@kachracash/types';
import type { PayoutGateway } from './types';

/** Records transfers locally until live Cashfree/RazorpayX keys are configured. */
export class StubPayoutGateway implements PayoutGateway {
	readonly provider = 'stub' as const;

	isConfigured(): boolean {
		return true;
	}

	async initiateTransfer(input: import('./types').PayoutTransferRequest) {
		const gatewayRef = `STUB_${input.idempotencyKey}`;
		return {
			provider: this.provider,
			gatewayRef,
			status: 'PENDING' as const,
			rawResponse: {
				message: 'Payout queued in stub mode — add gateway keys to enable live UPI transfers',
				transferId: input.idempotencyKey
			}
		};
	}

	verifyWebhookSignature(): boolean {
		return true;
	}

	parseWebhookPayload(body: unknown) {
		if (!body || typeof body !== 'object') return null;
		const record = body as Record<string, unknown>;

		if (typeof record.transactionId === 'string') {
			return {
				transactionId: record.transactionId,
				gatewayRef: String(record.gatewayRef ?? 'STUB_WEBHOOK'),
				upiVpa: String(record.upiVpa ?? 'citizen@upi'),
				amount: Number(record.amount ?? 0),
				idempotencyKey: String(record.idempotencyKey ?? record.transactionId)
			};
		}

		return null;
	}
}

export function parseCashfreeWebhook(body: unknown) {
	const parsed = cashfreePayoutWebhookSchema.safeParse(body);
	if (!parsed.success) return null;

	const transferId = parsed.data.transferId;
	const referenceId = parsed.data.referenceId ?? transferId;

	return {
		gatewayRef: transferId,
		idempotencyKey: referenceId,
		upiVpa: parsed.data.vpa ?? 'unknown@upi',
		amount: Number(parsed.data.amount ?? 0)
	};
}

export function parseRazorpayxWebhook(body: unknown) {
	const parsed = razorpayxPayoutWebhookSchema.safeParse(body);
	if (!parsed.success) return null;

	const payout = parsed.data.payload.payout;
	return {
		gatewayRef: payout.id,
		idempotencyKey: payout.reference_id ?? payout.id,
		amount: payout.amount / 100,
		upiVpa: 'unknown@upi'
	};
}
