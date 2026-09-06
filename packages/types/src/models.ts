import { z } from 'zod';

// ==========================================
// 1. ENUMS
// ==========================================
export const RoleEnum = z.enum(['CITIZEN', 'COLLECTOR', 'ADMIN']);
export type Role = z.infer<typeof RoleEnum>;

export const WalletStatusEnum = z.enum(['ACTIVE', 'FROZEN']);
export type WalletStatus = z.infer<typeof WalletStatusEnum>;

export const TransactionTypeEnum = z.enum(['DEBIT', 'CREDIT', 'PENALTY', 'HOLD']);
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const OrderStatusEnum = z.enum([
  'PENDING',
  'ASSIGNED',
  'EN_ROUTE',
  'ARRIVED',
  'WEIGHING',
  'COMPLETED',
  'DISPUTED',
  'REASSIGNED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const VisualTierEnum = z.enum(['RIGID_CONTAINERS', 'SOFT_FILMS', 'MIXED_BULKY']);
export type VisualTier = z.infer<typeof VisualTierEnum>;

export const SWMStreamEnum = z.enum(['DRY_RECYCLABLE', 'SPECIAL_CARE']);
export type SWMStream = z.infer<typeof SWMStreamEnum>;

// ==========================================
// 2. GEOSPATIAL PRIMITIVES
// ==========================================
export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

export const GeoPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});
export type GeoPolygon = z.infer<typeof GeoPolygonSchema>;

// ==========================================
// 3. 14 CORE DOMAIN ENTITY SCHEMAS
// ==========================================

// 1. Region
export const RegionSchema = z.object({
  id: z.string().uuid(),
  wardNumber: z.number().int().positive(),
  wardName: z.string().min(1),
  isFloodSuspended: z.boolean().default(false),
  updatedAt: z.date(),
});
export type Region = z.infer<typeof RegionSchema>;

// 2. Scrap Category
export const ScrapCategorySchema = z.object({
  id: z.string().uuid(),
  sku: z.string().min(1),
  name: z.string().min(1),
  visualTier: VisualTierEnum,
  swmStream: SWMStreamEnum,
  description: z.string().nullable().optional(),
  iconUrl: z.string().url().nullable().optional(),
});
export type ScrapCategory = z.infer<typeof ScrapCategorySchema>;

// 3. Floor Rate Card
export const FloorRateCardSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  nationalIndexRate: z.number().positive(),
  freightOffset: z.number().nonnegative(),
  handlingOffset: z.number().nonnegative(),
  floorRate: z.number().nonnegative(),
  version: z.number().int().positive().default(1),
  createdAt: z.date(),
});
export type FloorRateCard = z.infer<typeof FloorRateCardSchema>;

// 4. Citizen
export const CitizenSchema = z.object({
  id: z.string().uuid(),
  phoneNumber: z.string().regex(/^\+91[6-9]\d{9}$|^[6-9]\d{9}$/),
  fullName: z.string().nullable().optional(),
  upiVpa: z.string().nullable().optional(),
  kycVerified: z.boolean().default(false),
  regionId: z.string().uuid().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Citizen = z.infer<typeof CitizenSchema>;

// 5. Collector
export const CollectorSchema = z.object({
  id: z.string().uuid(),
  phoneNumber: z.string().regex(/^\+91[6-9]\d{9}$|^[6-9]\d{9}$/),
  fullName: z.string().min(1),
  assistedKycToken: z.string().min(1),
  assignedCartQrId: z.string().min(1),
  isOnline: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Collector = z.infer<typeof CollectorSchema>;

// 6. Collector Device
export const CollectorDeviceSchema = z.object({
  id: z.string().uuid(),
  collectorId: z.string().uuid(),
  hardwareUuid: z.string().min(1),
  bleScaleMacAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/),
  lastCalibrationAt: z.date(),
  createdAt: z.date(),
});
export type CollectorDevice = z.infer<typeof CollectorDeviceSchema>;

// 7. Collector Wallet
export const CollectorWalletSchema = z.object({
  id: z.string().uuid(),
  collectorId: z.string().uuid(),
  floatBalance: z.number().nonnegative(),
  lockedAmount: z.number().nonnegative().default(0),
  minThreshold: z.number().default(2000.0),
  status: WalletStatusEnum.default('ACTIVE'),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CollectorWallet = z.infer<typeof CollectorWalletSchema>;

// 8. Wallet Ledger (Immutable Append-Only)
export const WalletLedgerSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  amount: z.number(),
  type: TransactionTypeEnum,
  description: z.string().min(1),
  idempotencyKey: z.string().min(1),
  referenceOrderId: z.string().nullable().optional(),
  createdAt: z.date(),
});
export type WalletLedger = z.infer<typeof WalletLedgerSchema>;

// 9. Pickup Request
export const PickupRequestSchema = z.object({
  id: z.string().uuid(),
  citizenId: z.string().uuid(),
  regionId: z.string().uuid(),
  status: OrderStatusEnum.default('PENDING'),
  visualTier: VisualTierEnum,
  scheduledSlotStart: z.date(),
  scheduledSlotEnd: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type PickupRequest = z.infer<typeof PickupRequestSchema>;

// 10. Pickup Assignment
export const PickupAssignmentSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  collectorId: z.string().uuid(),
  matchedAt: z.date(),
  proximityMeters: z.number().nonnegative(),
  slaStatus: z.enum(['MET', 'BREACHED_REASSIGNED', 'PENDING']),
});
export type PickupAssignment = z.infer<typeof PickupAssignmentSchema>;

// 11. Transaction
export const TransactionSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  otpHash: z.string().min(1),
  grossAmount: z.number().nonnegative().default(0),
  platformFee: z.number().nonnegative().default(0),
  netPayout: z.number().nonnegative().default(0),
  completedAt: z.date().nullable().optional(),
  createdAt: z.date(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

// 12. Transaction Item
export const TransactionItemSchema = z.object({
  id: z.string().uuid(),
  transactionId: z.string().uuid(),
  categoryId: z.string().uuid(),
  weightKg: z.number().positive(),
  unitRate: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  scaleHardwareId: z.string().min(1),
  createdAt: z.date(),
});
export type TransactionItem = z.infer<typeof TransactionItemSchema>;

// 13. Payout
export const PayoutSchema = z.object({
  id: z.string().uuid(),
  transactionId: z.string().uuid(),
  gatewayRef: z.string().nullable().optional(),
  upiVpa: z.string().min(3),
  amount: z.number().positive(),
  status: z.enum(['INITIATED', 'SUCCESS', 'FAILED']),
  idempotencyKey: z.string().min(1),
  createdAt: z.date(),
});
export type Payout = z.infer<typeof PayoutSchema>;

// 14. Rating & Audit Log
export const RatingSchema = z.object({
  id: z.string().uuid(),
  citizenId: z.string().uuid(),
  collectorId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  feedback: z.string().nullable().optional(),
  createdAt: z.date(),
});
export type Rating = z.infer<typeof RatingSchema>;

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  entityName: z.string().min(1),
  entityId: z.string().min(1),
  action: z.string().min(1),
  payload: z.record(z.unknown()),
  performedBy: z.string().min(1),
  createdAt: z.date(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;
