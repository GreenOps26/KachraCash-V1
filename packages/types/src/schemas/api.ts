import { z } from 'zod';

export const geoPointSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180)
});

export const visualTierSchema = z.enum(['RIGID_CONTAINERS', 'SOFT_FILMS', 'MIXED_BULKY']);

export type VisualTier = z.infer<typeof visualTierSchema>;

export const VISUAL_TIERS: VisualTier[] = ['RIGID_CONTAINERS', 'SOFT_FILMS', 'MIXED_BULKY'];

export interface FloorRateQuote {
	sku: string;
	name: string;
	visualTier: string;
	description: string | null;
	floorRate: number;
	version: number;
}

export interface RatesResponse {
	visualTier: VisualTier;
	rates: FloorRateQuote[];
}

export interface WardSummary {
	id: string;
	wardNumber: number;
	wardName: string;
	wardId: string;
	isFloodSuspended: boolean;
}

export interface WardsResponse {
	wards: WardSummary[];
}

export interface CreatePickupResponse {
	pickup: {
		id: string;
		status: string;
		visualTier: string;
		scheduledSlotStart: string;
		scheduledSlotEnd: string;
	};
}

export const createPickupSchema = z.object({
	citizenId: z.string().uuid(),
	wardId: z.string().min(1),
	visualTier: visualTierSchema,
	pickupLocation: geoPointSchema,
	scheduledSlotStart: z.string().datetime().optional(),
	scheduledSlotEnd: z.string().datetime().optional()
});

export const acceptPickupSchema = z.object({
	collectorId: z.string().uuid()
});

export const collectorDevLoginSchema = z.object({
	collectorId: z.string().uuid()
});

export const collectorPhoneLoginSchema = z.object({
	phoneNumber: z.string().min(8)
});

export const completeOrderSchema = z.object({
	collectorId: z.string().uuid(),
	otp: z.string().length(4),
	grossAmount: z.number().positive(),
	bleItems: z
		.array(
			z.object({
				categoryId: z.string().min(1),
				weightKg: z.number().positive(),
				unitRate: z.number().positive(),
				scaleHardwareId: z.string().min(1).optional()
			})
		)
		.default([])
});

export const wardSuspendSchema = z.object({
	isFloodSuspended: z.boolean(),
	reason: z.string().min(3),
	triggerCustomerRescheduleSms: z.boolean().optional()
});

export const walletTopUpSchema = z.object({
	collectorId: z.string().uuid(),
	amount: z.number().positive(),
	paymentGatewayRef: z.string().min(1),
	idempotencyKey: z.string().min(8)
});

export interface PickupListResponse {
	pickups: Array<{
		id: string;
		status: string;
		visualTier: string;
		scheduledSlotStart: string;
		scheduledSlotEnd: string;
		wardNumber: number;
		wardName: string;
		citizenName: string | null;
	}>;
}

export interface PickupDetailResponse {
	pickup: {
		id: string;
		status: string;
		visualTier: string;
		scheduledSlotStart: string;
		scheduledSlotEnd: string;
		wardNumber: number;
		wardName: string;
		citizenName: string | null;
		collectorId: string | null;
		settlement: {
			grossAmount: number;
			platformFee: number;
			netPayout: number;
			payoutStatus: string | null;
		} | null;
	};
	devOtp?: string;
}

export interface AcceptPickupResponse {
	status: 'WEIGHING';
	devOtp?: string;
}

export type CreatePickupInput = z.infer<typeof createPickupSchema>;
export interface CollectorLoginResponse {
	token: string;
	collectorId: string;
	fullName: string;
}

export type AcceptPickupInput = z.infer<typeof acceptPickupSchema>;
export type CollectorDevLoginInput = z.infer<typeof collectorDevLoginSchema>;
export type CollectorPhoneLoginInput = z.infer<typeof collectorPhoneLoginSchema>;
export type CompleteOrderInput = z.infer<typeof completeOrderSchema>;
export type WardSuspendInput = z.infer<typeof wardSuspendSchema>;

export interface WardSuspendResponse {
	wardId: string;
	isFloodSuspended: boolean;
	triggerCustomerRescheduleSms: boolean;
}
export type WalletTopUpInput = z.infer<typeof walletTopUpSchema>;
