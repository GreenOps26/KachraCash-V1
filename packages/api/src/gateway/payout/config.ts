import {
	payoutGatewayModeSchema,
	payoutGatewayProviderSchema,
	type PayoutGatewayMode,
	type PayoutGatewayProvider
} from '@kachracash/types';

export interface PayoutGatewayConfig {
	provider: PayoutGatewayProvider;
	mode: PayoutGatewayMode;
	stubAutoConfirm: boolean;
	cashfree: {
		clientId: string;
		clientSecret: string;
		apiBase: string;
		webhookSecret: string;
	};
	razorpayx: {
		keyId: string;
		keySecret: string;
		accountNumber: string;
		webhookSecret: string;
	};
}

export function loadPayoutGatewayConfig(): PayoutGatewayConfig {
	const provider = payoutGatewayProviderSchema.catch('stub').parse(process.env.PAYOUT_GATEWAY_PROVIDER);
	const mode = payoutGatewayModeSchema.catch('stub').parse(process.env.PAYOUT_GATEWAY_MODE);

	return {
		provider,
		mode,
		stubAutoConfirm: process.env.PAYOUT_STUB_AUTO_CONFIRM === 'true',
		cashfree: {
			clientId: process.env.CASHFREE_PAYOUT_CLIENT_ID ?? '',
			clientSecret: process.env.CASHFREE_PAYOUT_CLIENT_SECRET ?? '',
			apiBase: process.env.CASHFREE_PAYOUT_API_BASE ?? 'https://sandbox.cashfree.com/payout',
			webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET ?? ''
		},
		razorpayx: {
			keyId: process.env.RAZORPAYX_KEY_ID ?? '',
			keySecret: process.env.RAZORPAYX_KEY_SECRET ?? '',
			accountNumber: process.env.RAZORPAYX_ACCOUNT_NUMBER ?? '',
			webhookSecret: process.env.RAZORPAYX_WEBHOOK_SECRET ?? ''
		}
	};
}

export function isCashfreeConfigured(config: PayoutGatewayConfig): boolean {
	return Boolean(config.cashfree.clientId && config.cashfree.clientSecret);
}

export function isRazorpayxConfigured(config: PayoutGatewayConfig): boolean {
	return Boolean(
		config.razorpayx.keyId && config.razorpayx.keySecret && config.razorpayx.accountNumber
	);
}

export function resolveActiveProvider(config: PayoutGatewayConfig): PayoutGatewayProvider {
	if (config.mode === 'stub') return 'stub';

	if (config.provider === 'cashfree' && isCashfreeConfigured(config)) return 'cashfree';
	if (config.provider === 'razorpayx' && isRazorpayxConfigured(config)) return 'razorpayx';

	return 'stub';
}
