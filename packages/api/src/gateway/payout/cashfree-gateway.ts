import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PayoutGatewayConfig } from './config';
import { parseCashfreeWebhook } from './stub-gateway';
import type { PayoutGateway, PayoutTransferRequest, PayoutTransferResult } from './types';

export class CashfreePayoutGateway implements PayoutGateway {
	readonly provider = 'cashfree' as const;
	private config: PayoutGatewayConfig;

	constructor(config: PayoutGatewayConfig) {
		this.config = config;
	}

	isConfigured(): boolean {
		return Boolean(this.config.cashfree.clientId && this.config.cashfree.clientSecret);
	}

	async initiateTransfer(input: PayoutTransferRequest): Promise<PayoutTransferResult> {
		if (!this.isConfigured()) {
			throw new Error('CASHFREE_NOT_CONFIGURED: Set CASHFREE_PAYOUT_CLIENT_ID and CASHFREE_PAYOUT_CLIENT_SECRET');
		}

		const response = await fetch(`${this.config.cashfree.apiBase}/v1/directTransfer`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Client-Id': this.config.cashfree.clientId,
				'X-Client-Secret': this.config.cashfree.clientSecret
			},
			body: JSON.stringify({
				transferId: input.idempotencyKey,
				transferMode: 'upi',
				amount: input.amount.toFixed(2),
				remarks: input.remarks ?? `KachraCash payout ${input.orderId}`,
				beneDetails: {
					name: input.citizenName ?? 'KachraCash Citizen',
					email: 'payouts@kachracash.in',
					phone: '9999999999',
					vpa: input.upiVpa
				}
			})
		});

		const raw = (await response.json()) as Record<string, unknown>;

		if (!response.ok) {
			throw new Error(`CASHFREE_PAYOUT_FAILED: ${JSON.stringify(raw)}`);
		}

		const gatewayRef = String(raw.transferId ?? raw.referenceId ?? input.idempotencyKey);
		const status = String(raw.status ?? 'PENDING').toUpperCase();

		return {
			provider: this.provider,
			gatewayRef,
			status: status === 'SUCCESS' ? 'SUCCESS' : 'INITIATED',
			rawResponse: raw
		};
	}

	verifyWebhookSignature(
		headers: Record<string, string | string[] | undefined>,
		rawBody: string
	): boolean {
		const secret = this.config.cashfree.webhookSecret;
		if (!secret) return this.config.mode !== 'live';

		const signature = headers['x-webhook-signature'] ?? headers['X-Webhook-Signature'];
		if (!signature || Array.isArray(signature)) return false;

		const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
		try {
			return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
		} catch {
			return false;
		}
	}

	parseWebhookPayload(body: unknown) {
		const parsed = parseCashfreeWebhook(body);
		if (!parsed) return null;

		return {
			transactionId: '',
			gatewayRef: parsed.gatewayRef,
			upiVpa: parsed.upiVpa,
			amount: parsed.amount,
			idempotencyKey: parsed.idempotencyKey
		};
	}
}
