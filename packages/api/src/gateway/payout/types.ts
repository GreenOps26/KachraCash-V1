import type { PayoutGatewayProvider } from '@kachracash/types';

export interface PayoutTransferRequest {
	transactionId: string;
	orderId: string;
	idempotencyKey: string;
	amount: number;
	upiVpa: string;
	citizenName?: string;
	remarks?: string;
}

export interface PayoutTransferResult {
	provider: PayoutGatewayProvider;
	gatewayRef: string;
	status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED';
	rawResponse?: unknown;
}

export interface PayoutGateway {
	readonly provider: PayoutGatewayProvider;
	isConfigured(): boolean;
	initiateTransfer(input: PayoutTransferRequest): Promise<PayoutTransferResult>;
	verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, rawBody: string): boolean;
	parseWebhookPayload(body: unknown): {
		transactionId: string;
		gatewayRef: string;
		upiVpa: string;
		amount: number;
		idempotencyKey: string;
	} | null;
}
