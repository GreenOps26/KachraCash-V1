export interface PricingInput {
	nationalIndexRate: number;
	freightCost: number;
	handlingCost: number;
	aggregatorMargin: number;
	collectorMargin: number;
	volatilityBuffer: number;
}

export interface PricingResult {
	floorRate: number;
	isValid: boolean;
	rejectionReason?: string;
}

const MIN_VOLATILITY = 0.03;
const MAX_VOLATILITY = 0.07;

export function calculateFloorRate(input: PricingInput): PricingResult {
	if (input.volatilityBuffer < MIN_VOLATILITY || input.volatilityBuffer > MAX_VOLATILITY) {
		throw new Error('Volatility buffer (alpha_risk) must be between 0.03 and 0.07');
	}

	const costStack = input.freightCost + input.handlingCost + input.aggregatorMargin;
	const base = input.nationalIndexRate - costStack;

	if (base <= 0) {
		return {
			floorRate: 0,
			isValid: false,
			rejectionReason: 'COMMODITY_MARGIN_COLLAPSE'
		};
	}

	const floorRate = base * (1 - input.collectorMargin) * (1 - input.volatilityBuffer);

	if (floorRate <= 0) {
		return {
			floorRate: 0,
			isValid: false,
			rejectionReason: 'COMMODITY_MARGIN_COLLAPSE'
		};
	}

	return { floorRate, isValid: true };
}
