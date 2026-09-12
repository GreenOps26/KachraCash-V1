import { describe, expect, it } from 'vitest';
import { calculateFloorRate, type PricingInput } from '../../services/pricing-engine';

describe('Pricing & Floor Rate Card Engine', () => {
	it('should compute correct floor price for short-haul Byrnihat Ferrous scrap (C_freight = ₹1.20/kg)', () => {
		const input: PricingInput = {
			nationalIndexRate: 40.0,
			freightCost: 1.2,
			handlingCost: 1.8,
			aggregatorMargin: 2.0,
			collectorMargin: 0.08,
			volatilityBuffer: 0.05
		};

		const result = calculateFloorRate(input);
		expect(result.floorRate).toBeCloseTo(30.59, 2);
		expect(result.isValid).toBe(true);
	});

	it('should compute correct floor price for long-haul Siliguri Polymer scrap (C_freight = ₹3.50/kg)', () => {
		const input: PricingInput = {
			nationalIndexRate: 32.0,
			freightCost: 3.5,
			handlingCost: 2.0,
			aggregatorMargin: 1.5,
			collectorMargin: 0.08,
			volatilityBuffer: 0.04
		};

		const result = calculateFloorRate(input);
		expect(result.floorRate).toBeCloseTo(22.08, 2);
		expect(result.isValid).toBe(true);
	});

	it('should enforce volatility buffer bounds (0.03 <= alpha_risk <= 0.07)', () => {
		const invalidInputLow: PricingInput = {
			nationalIndexRate: 30.0,
			freightCost: 1.2,
			handlingCost: 1.0,
			aggregatorMargin: 1.0,
			collectorMargin: 0.08,
			volatilityBuffer: 0.01
		};

		expect(() => calculateFloorRate(invalidInputLow)).toThrowError(
			'Volatility buffer (alpha_risk) must be between 0.03 and 0.07'
		);
	});

	it('should reject commodity index crash scenarios resulting in sub-zero rates', () => {
		const crashInput: PricingInput = {
			nationalIndexRate: 4.0,
			freightCost: 3.5,
			handlingCost: 2.0,
			aggregatorMargin: 1.0,
			collectorMargin: 0.08,
			volatilityBuffer: 0.05
		};

		const result = calculateFloorRate(crashInput);
		expect(result.isValid).toBe(false);
		expect(result.floorRate).toBe(0.0);
		expect(result.rejectionReason).toBe('COMMODITY_MARGIN_COLLAPSE');
	});
});
