import { z } from 'zod';

export const PricingInputSchema = z.object({
  nationalIndexRate: z.number().positive(),
  freightCost: z.number().nonnegative(),
  handlingCost: z.number().nonnegative(),
  aggregatorMargin: z.number().nonnegative(),
  collectorMargin: z.number().min(0).max(1).default(0.08),
  volatilityBuffer: z.number().min(0.03).max(0.07),
});
export type PricingInput = z.infer<typeof PricingInputSchema>;

export const FloorRateResultSchema = z.object({
  floorRate: z.number().nonnegative(),
  isValid: z.boolean(),
  rejectionReason: z.string().optional(),
  breakdown: z
    .object({
      nationalIndexRate: z.number(),
      logisticsDeductions: z.number(),
      collectorCommission: z.number(),
      riskBufferDeduction: z.number(),
    })
    .optional(),
});
export type FloorRateResult = z.infer<typeof FloorRateResultSchema>;

export const PayoutResultSchema = z.object({
  grossAmount: z.number().nonnegative(),
  platformFee: z.number().nonnegative(),
  citizenPayout: z.number().nonnegative(),
});
export type PayoutResult = z.infer<typeof PayoutResultSchema>;

/**
 * Deterministic Floor Rate Card Algorithm
 * P_floor = [P_national - (C_freight + C_handling + M_aggregator)] * (1 - M_collector) * (1 - alpha_risk)
 */
export function calculateFloorRate(input: PricingInput): FloorRateResult {
  // Enforce volatility buffer boundary
  if (input.volatilityBuffer < 0.03 || input.volatilityBuffer > 0.07) {
    throw new Error('Volatility buffer (alpha_risk) must be between 0.03 and 0.07');
  }

  const logisticsDeductions = input.freightCost + input.handlingCost + input.aggregatorMargin;
  const netBase = input.nationalIndexRate - logisticsDeductions;

  // Margin collapse guardrail
  if (netBase <= 0) {
    return {
      floorRate: 0.0,
      isValid: false,
      rejectionReason: 'COMMODITY_MARGIN_COLLAPSE',
    };
  }

  const afterCollector = netBase * (1 - input.collectorMargin);
  const rawFloor = afterCollector * (1 - input.volatilityBuffer);
  const floorRate = Math.round(rawFloor * 100) / 100;

  return {
    floorRate,
    isValid: true,
    breakdown: {
      nationalIndexRate: input.nationalIndexRate,
      logisticsDeductions,
      collectorCommission: input.collectorMargin,
      riskBufferDeduction: input.volatilityBuffer,
    },
  };
}

/**
 * Doorstep Settlement Payout Calculation
 * Enforces strict 8% platform take-rate and 92% net citizen payout
 */
export function calculatePayout(weightKg: number, ratePerKg: number): PayoutResult {
  if (weightKg <= 0 || ratePerKg <= 0) {
    return { grossAmount: 0, platformFee: 0, citizenPayout: 0 };
  }
  const grossAmount = Math.round(weightKg * ratePerKg * 100) / 100;
  const platformFee = Math.round(grossAmount * 0.08 * 100) / 100;
  const citizenPayout = Math.round((grossAmount - platformFee) * 100) / 100;

  return { grossAmount, platformFee, citizenPayout };
}
