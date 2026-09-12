import { CashfreePayoutGateway } from './cashfree-gateway';
import { loadPayoutGatewayConfig, resolveActiveProvider } from './config';
import { RazorpayxPayoutGateway } from './razorpayx-gateway';
import { StubPayoutGateway } from './stub-gateway';
import type { PayoutGateway } from './types';

export function createPayoutGateway(config = loadPayoutGatewayConfig()): PayoutGateway {
	const provider = resolveActiveProvider(config);

	if (provider === 'cashfree') return new CashfreePayoutGateway(config);
	if (provider === 'razorpayx') return new RazorpayxPayoutGateway(config);
	return new StubPayoutGateway();
}

export { loadPayoutGatewayConfig, resolveActiveProvider };
