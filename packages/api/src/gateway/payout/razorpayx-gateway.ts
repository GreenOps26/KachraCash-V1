import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PayoutGatewayConfig } from './config';
import { parseRazorpayxWebhook } from './stub-gateway';
import type { PayoutGateway, PayoutTransferRequest, PayoutTransferResult } from './types';

export class RazorpayxPayoutGateway implements PayoutGateway {
	readonly provider = 'razorpayx' as const;
	private config: PayoutGatewayConfig;

	constructor(config: PayoutGatewayConfig) {
		this.config = config;
	}

	isConfigured(): boolean {
		return Boolean(
			this.config.razorpayx.keyId &&
			this.config.razorpayx.keySecret &&
			this.config.razorpayx.accountNumber
		);
	}

	async initiateTransfer(input: PayoutTransferRequest): Promise<PayoutTransferResult> {
		if (!this.isConfigured()) {
			throw new Error(
				'RAZORPAYX_NOT_CONFIGURED: Set RAZORPAYX_KEY_ID, RAZORPAYX_KEY_SECRET, and RAZORPAYX_ACCOUNT_NUMBER'
			);
		}

		const auth = Buffer.from(
			`${this.config.razorpayx.keyId}:${this.config.razorpayx.keySecret}`
		).toString('base64');

		const response = await fetch('https://api.razorpay.com/v1/payouts', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${auth}`
			},
			body: JSON.stringify({
				account_number: this.config.razorpayx.accountNumber,
				amount: Math.round(input.amount * 100),
				currency: 'INR',
				mode: 'UPI',
				purpose: 'payout',
				reference_id: input.idempotencyKey,
				narration: input.remarks ?? `KachraCash ${input.orderId}`,
				fund_account: {
					account_type: 'vpa',
					vpa: { address: input.upiVpa },
					contact: {
						name: input.citizenName ?? 'KachraCash Citizen',
						type: 'customer',
						email: 'payouts@kachracash.in',
						contact: '9999999999'
					}
				}
			})
		});

		const raw = (await response.json()) as Record<string, unknown>;

		if (!response.ok) {
			throw new Error(`RAZORPAYX_PAYOUT_FAILED: ${JSON.stringify(raw)}`);
		}

		const gatewayRef = String(raw.id ?? input.idempotencyKey);
		const status = String(raw.status ?? 'processing').toLowerCase();

		return {
			provider: this.provider,
			gatewayRef,
			status: status === 'processed' ? 'SUCCESS' : 'INITIATED',
			rawResponse: raw
		};
	}

	verifyWebhookSignature(
		headers: Record<string, string | string[] | undefined>,
		rawBody: string
	): boolean {
		const secret = this.config.razorpayx.webhookSecret;
		if (!secret) return this.config.mode !== 'live';

		const signature = headers['x-razorpay-signature'] ?? headers['X-Razorpay-Signature'];
		if (!signature || Array.isArray(signature)) return false;

		const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
		try {
			return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
		} catch {
			return false;
		}
	}

	parseWebhookPayload(body: unknown) {
		const parsed = parseRazorpayxWebhook(body);
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
