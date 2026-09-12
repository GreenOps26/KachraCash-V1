import { z } from 'zod';

export const payoutGatewayProviderSchema = z.enum(['stub', 'cashfree', 'razorpayx']);
export type PayoutGatewayProvider = z.infer<typeof payoutGatewayProviderSchema>;

export const payoutGatewayModeSchema = z.enum(['stub', 'live']);
export type PayoutGatewayMode = z.infer<typeof payoutGatewayModeSchema>;

export interface InitiatePayoutResult {
	payoutId: string;
	transactionId: string;
	orderId: string;
	provider: PayoutGatewayProvider;
	gatewayRef: string;
	status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED';
	amount: number;
	upiVpa: string;
}

export const payoutWebhookPayloadSchema = z.object({
	transactionId: z.string().uuid(),
	gatewayRef: z.string().min(1),
	upiVpa: z.string().min(3),
	amount: z.number().positive(),
	idempotencyKey: z.string().min(8)
});

export type PayoutWebhookPayload = z.infer<typeof payoutWebhookPayloadSchema>;

/** Cashfree payout webhook (subset — extend when keys are wired). */
export const cashfreePayoutWebhookSchema = z.object({
	event: z.string(),
	transferId: z.string(),
	referenceId: z.string().optional(),
	utr: z.string().optional(),
	acknowledged: z.number().optional(),
	beneId: z.string().optional(),
	amount: z.union([z.string(), z.number()]).optional(),
	vpa: z.string().optional()
});

/** RazorpayX payout webhook (subset). */
export const razorpayxPayoutWebhookSchema = z.object({
	event: z.string(),
	payload: z.object({
		payout: z.object({
			id: z.string(),
			amount: z.number(),
			status: z.string(),
			reference_id: z.string().optional(),
			fund_account_id: z.string().optional()
		})
	})
});
