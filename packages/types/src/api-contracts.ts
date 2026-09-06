import { z } from 'zod';
import { BLEWeightTelemetryPacketSchema } from './ble.js';
import { VisualTierEnum } from './models.js';

// Mid-route wallet topup
export const WalletTopupRequestSchema = z.object({
  amount: z.number().positive(),
  paymentGatewayRef: z.string().min(1),
  idempotencyKey: z.string().min(1),
});
export type WalletTopupRequest = z.infer<typeof WalletTopupRequestSchema>;

// Monsoon ward suspension toggle
export const WardSuspensionRequestSchema = z.object({
  isFloodSuspended: z.boolean(),
  reason: z.string().min(1),
  triggerCustomerRescheduleSms: z.boolean().default(true),
});
export type WardSuspensionRequest = z.infer<typeof WardSuspensionRequestSchema>;

// Doorstep settlement / Order complete
export const DoorstepItemSchema = z.object({
  categoryId: z.string().min(1),
  telemetryPacket: BLEWeightTelemetryPacketSchema,
});
export type DoorstepItem = z.infer<typeof DoorstepItemSchema>;

export const CompleteOrderRequestSchema = z.object({
  requestId: z.string().min(1),
  collectorId: z.string().min(1),
  otp: z.string().length(4),
  items: z.array(DoorstepItemSchema).min(1),
});
export type CompleteOrderRequest = z.infer<typeof CompleteOrderRequestSchema>;

// Atomic OTP verification endpoint contract
export const VerifyOtpItemSchema = z.object({
  categoryId: z.string().min(1),
  weightKg: z.number().positive(),
  unitRate: z.number().positive(),
  scaleHardwareId: z.string().min(1),
  telemetryPacket: BLEWeightTelemetryPacketSchema.optional(),
});
export type VerifyOtpItem = z.infer<typeof VerifyOtpItemSchema>;

export const VerifyOtpRequestSchema = z.object({
  requestId: z.string().min(1),
  collectorId: z.string().min(1),
  otp: z.string().length(4),
  items: z.array(VerifyOtpItemSchema).min(1),
  simulateFailure: z.boolean().optional(),
});
export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;

// Payout webhook payload
export const PayoutWebhookPayloadSchema = z.object({
  transactionId: z.string().min(1),
  gatewayRef: z.string().min(1),
  upiVpa: z.string().min(1),
  amount: z.number().positive(),
  idempotencyKey: z.string().min(1),
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING']).default('SUCCESS'),
});
export type PayoutWebhookPayload = z.infer<typeof PayoutWebhookPayloadSchema>;

// Dispatch SLA assessment
export const DispatchSLARequestSchema = z.object({
  orderId: z.string().min(1),
  collectorId: z.string().min(1),
  collectorLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  pickupLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  timeToSlotMinutes: z.number(),
});
export type DispatchSLARequest = z.infer<typeof DispatchSLARequestSchema>;

// Create pickup request
export const CreatePickupRequestInputSchema = z.object({
  citizenId: z.string().min(1),
  wardId: z.string().min(1),
  visualTier: VisualTierEnum,
  pickupLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  scheduledSlotStart: z.date().optional(),
  scheduledSlotEnd: z.date().optional(),
});
export type CreatePickupRequestInput = z.infer<typeof CreatePickupRequestInputSchema>;
