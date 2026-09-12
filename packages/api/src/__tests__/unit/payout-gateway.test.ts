import { afterEach, describe, expect, it } from 'vitest';
import { loadPayoutGatewayConfig, resolveActiveProvider } from '../../gateway/payout/config';
import { StubPayoutGateway } from '../../gateway/payout/stub-gateway';

describe('Payout gateway configuration', () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it('defaults to stub provider when keys are absent', () => {
		delete process.env.PAYOUT_GATEWAY_PROVIDER;
		delete process.env.PAYOUT_GATEWAY_MODE;
		delete process.env.CASHFREE_PAYOUT_CLIENT_ID;

		const config = loadPayoutGatewayConfig();
		expect(resolveActiveProvider(config)).toBe('stub');
	});

	it('selects cashfree when live mode and credentials are present', () => {
		process.env.PAYOUT_GATEWAY_PROVIDER = 'cashfree';
		process.env.PAYOUT_GATEWAY_MODE = 'live';
		process.env.CASHFREE_PAYOUT_CLIENT_ID = 'cf_test_client';
		process.env.CASHFREE_PAYOUT_CLIENT_SECRET = 'cf_test_secret';

		const config = loadPayoutGatewayConfig();
		expect(resolveActiveProvider(config)).toBe('cashfree');
	});
});

describe('Stub payout gateway', () => {
	it('queues a transfer with STUB gateway reference', async () => {
		const gateway = new StubPayoutGateway();
		const result = await gateway.initiateTransfer({
			transactionId: '00000000-0000-4000-8000-000000000099',
			orderId: 'ORD_STUB_001',
			idempotencyKey: 'PAYOUT_ORD_STUB_001',
			amount: 230,
			upiVpa: 'demo@upi'
		});

		expect(result.provider).toBe('stub');
		expect(result.gatewayRef).toBe('STUB_PAYOUT_ORD_STUB_001');
		expect(result.status).toBe('PENDING');
	});
});
