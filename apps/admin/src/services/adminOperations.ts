import { calculateFloorRate, FloorRateResult } from '@kachracash/types';

// ============================================================================
// 1. PostGIS Geospatial Radar & SLA Monitor
// ============================================================================

export interface CollectorRadarMarker {
  collectorId: string;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  floatBalance: number;
  status: 'ONLINE' | 'IN_TRANSIT' | 'OFFLINE';
  assignedTicketId?: string;
  aadhaarRaw?: string;
}

export interface ActivePickupCoordinate {
  ticketId: string;
  orderId: string;
  citizenName: string;
  citizenPhone: string;
  wardId: string;
  wardName: string;
  wardNumber: number;
  lat: number;
  lng: number;
  visualTier: string;
  scheduledSlot: string;
  timeToSlotMinutes: number;
  assignedCollectorId: string;
  assignedCollectorName: string;
  slaStatus: 'OPTIMAL' | 'WARNING_T20' | 'BREACH_T15';
  distanceMeters: number;
  reassignedToCollectorId?: string;
}

/**
 * Standard Haversine distance formula equivalent to PostGIS ST_DistanceSphere (SRID 4326)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Proximity SLA Evaluation Logic:
 * - Outside 500m at T-20 min => WARNING_T20 (Amber)
 * - Outside 500m at T-15 min => BREACH_T15 (Red Alert: ₹150 penalty, ₹100 voucher, auto-reassign)
 * - Otherwise => OPTIMAL (Green)
 */
export function evaluateSlaStatus(
  distanceMeters: number,
  timeToSlotMinutes: number,
): 'OPTIMAL' | 'WARNING_T20' | 'BREACH_T15' {
  if (timeToSlotMinutes <= 15 && distanceMeters > 500) {
    return 'BREACH_T15';
  }
  if (timeToSlotMinutes <= 20 && distanceMeters > 500) {
    return 'WARNING_T20';
  }
  return 'OPTIMAL';
}

export interface ReassignmentResult {
  success: boolean;
  ticketId: string;
  previousCollectorId: string;
  newCollectorId: string;
  newCollectorName: string;
  penaltyLevied: number;
  citizenVoucherIssued: number;
  newDistanceMeters: number;
  message: string;
}

export function reassignBreachedTicket(
  ticket: ActivePickupCoordinate,
  candidateCollectors: CollectorRadarMarker[],
): ReassignmentResult {
  // Find eligible candidate collectors: ONLINE, floatBalance >= 2000, not current collector
  const eligible = candidateCollectors
    .filter(
      (c) =>
        c.collectorId !== ticket.assignedCollectorId &&
        c.status === 'ONLINE' &&
        c.floatBalance >= 2000.0,
    )
    .map((c) => ({
      collector: c,
      dist: calculateDistanceMeters(c.lat, c.lng, ticket.lat, ticket.lng),
    }))
    .sort((a, b) => a.dist - b.dist);

  if (eligible.length === 0 || !eligible[0]) {
    throw new Error(
      `No available collectors with >= ₹2,000 float balance found for emergency reassignment of ticket ${ticket.ticketId}`,
    );
  }

  const selected = eligible[0];

  return {
    success: true,
    ticketId: ticket.ticketId,
    previousCollectorId: ticket.assignedCollectorId,
    newCollectorId: selected.collector.collectorId,
    newCollectorName: selected.collector.name,
    penaltyLevied: 150.0,
    citizenVoucherIssued: 100.0,
    newDistanceMeters: selected.dist,
    message: `Ticket reassigned to ${selected.collector.name}. ₹150 penalty debited from previous collector; ₹100 voucher issued to citizen.`,
  };
}

// ============================================================================
// 2. Dynamic Floor Rate Card Desk
// ============================================================================

export const REGIONAL_FREIGHT_HUBS = {
  BYRNIHAT_FERROUS: {
    id: 'BYRNIHAT_FERROUS',
    name: 'Byrnihat Short-Haul Ferrous Freight Hub',
    freightOffsetPerKg: 1.2,
    destination: 'Byrnihat Industrial Area (Assam-Meghalaya Border)',
  },
  SILIGURI_POLYMER: {
    id: 'SILIGURI_POLYMER',
    name: 'West Bengal / Siliguri Paper & Polymer Freight Hub',
    freightOffsetPerKg: 3.5,
    destination: 'Siliguri North Bengal Reprocessing Corridor',
  },
  INTERSTATE_HAZMAT: {
    id: 'INTERSTATE_HAZMAT',
    name: 'Kolkata E-Waste / White Goods Hazmat Hub',
    freightOffsetPerKg: 5.0,
    destination: 'West Bengal SPCB Approved E-Waste Recycler',
  },
} as const;

export interface RateCardAuditRow {
  versionId: string;
  timestamp: string;
  publishedBy: string;
  nationalIndexRate: number;
  freightCost: number;
  freightHubName: string;
  handlingCost: number;
  aggregatorMargin: number;
  collectorMargin: number;
  volatilityBuffer: number;
  computedFloorRate: number;
  status: 'PUBLISHED_ACTIVE' | 'ARCHIVED';
}

export function computeFloorRateWithFreight(
  nationalIndexRate: number,
  freightCost: number,
  handlingCost: number = 1.8,
  aggregatorMargin: number = 2.0,
  collectorMargin: number = 0.08,
  volatilityBuffer: number = 0.05,
): FloorRateResult {
  return calculateFloorRate({
    nationalIndexRate,
    freightCost,
    handlingCost,
    aggregatorMargin,
    collectorMargin,
    volatilityBuffer,
  });
}

// ============================================================================
// 3. Monsoon Flood Suspension Desk
// ============================================================================

export interface WardFloodStatus {
  id: string;
  wardNumber: number;
  wardName: string;
  isMonsoonSuspended: boolean;
  waterloggedHotspots: string;
  activeRescheduledPickups: number;
  lastToggledAt?: string;
  toggledBy?: string;
}

export const INITIAL_GUWAHATI_WARDS: WardFloodStatus[] = [
  {
    id: 'WARD_BELTOLA_28',
    wardNumber: 28,
    wardName: 'Beltola',
    isMonsoonSuspended: false,
    waterloggedHotspots: 'Beltola Tiniali, Survey Bypass',
    activeRescheduledPickups: 0,
  },
  {
    id: 'WARD_JAYANAGAR_24',
    wardNumber: 24,
    wardName: 'Jayanagar',
    isMonsoonSuspended: false,
    waterloggedHotspots: 'Six Mile Link Road',
    activeRescheduledPickups: 0,
  },
  {
    id: 'WARD_GANESHGURI_29',
    wardNumber: 29,
    wardName: 'Ganeshguri',
    isMonsoonSuspended: false,
    waterloggedHotspots: 'GS Road Flyover Underpass',
    activeRescheduledPickups: 0,
  },
  {
    id: 'WARD_NOONMATI_15',
    wardNumber: 15,
    wardName: 'Noonmati',
    isMonsoonSuspended: false,
    waterloggedHotspots: 'Refinery Gate Sector 2',
    activeRescheduledPickups: 0,
  },
  {
    id: 'WARD_WIRELESS_30',
    wardNumber: 30,
    wardName: 'Wireless / Hatigaon',
    isMonsoonSuspended: true, // Flash flood suspended
    waterloggedHotspots: 'Sijubari Chariali, Bhetapara Road',
    activeRescheduledPickups: 14,
    lastToggledAt: '2026-09-06T14:30:00Z',
    toggledBy: 'Admin Ops Desk',
  },
];

// ============================================================================
// 4. Float Ledger, Escrow & Sensitive ID Redaction Desk
// ============================================================================

export type WalletStatusBadge = 'HEALTHY_FLOAT' | 'ROUTE_BUFFER' | 'CRITICAL_FROZEN';

export function getWalletStatusBadge(floatBalance: number): WalletStatusBadge {
  if (floatBalance >= 2000.0) return 'HEALTHY_FLOAT';
  if (floatBalance >= 1000.0) return 'ROUTE_BUFFER';
  return 'CRITICAL_FROZEN';
}

/**
 * Mandated Sensitive Identifier Redaction
 * Enforces strict masking of raw identity digits (Aadhaar, PAN).
 */
export function redactAadhaar(rawDigits?: string): string {
  if (!rawDigits) return '[Aadhaar Not Provided]';
  const clean = rawDigits.replace(/\D/g, '');
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4} [Aadhaar Redacted]`;
}

export function generateOpaqueKycToken(collectorId: string): string {
  const hash = collectorId
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 10000, 7)
    .toString()
    .padStart(4, '0');
  return `KYC_VERIFIED_AS_${hash}`;
}

export interface WalletLedgerAuditEntry {
  id: string;
  walletId: string;
  collectorName: string;
  amount: number;
  type: 'DEBIT_ORDER_AND_FEE' | 'CREDIT_TOPUP' | 'PENALTY_SLA_BREACH';
  description: string;
  referenceOrderId: string;
  gatewayPayoutRef: string;
  idempotencyKey: string;
  timestamp: string;
}

// ============================================================================
// 5. Photographic Dispute Resolution Queue
// ============================================================================

export interface DisputeItem {
  id: string;
  orderId: string;
  wardName: string;
  citizenName: string;
  collectorName: string;
  citizenClaim: string;
  collectorClaim: string;
  intakePhotoDescription: string;
  doorstepPhotoDescription: string;
  scaleTelemetryWeightKg: number;
  scaleTelemetryTareStatus: boolean;
  escrowHoldAmount: number;
  status: 'PENDING_REVIEW' | 'AFFIRMED_RESIDENT' | 'AFFIRMED_COLLECTOR';
  resolutionSummary?: string;
}

// ============================================================================
// 6. SWM Rules 2026 Bulk Compliance Engine
// ============================================================================

export interface BulkGeneratorAccount {
  id: string;
  name: string;
  category: 'HOUSING_SOCIETY' | 'HOTEL_COMMERCIAL' | 'EDUCATIONAL';
  address: string;
  wardNumber: number;
  avgDailyWasteKg: number;
  isBulkGenerator: boolean; // > 100 kg/day
  massBalance: {
    wetKg: number;
    dryKg: number;
    sanitaryKg: number;
    specialCareKg: number;
  };
}

export const BULK_GENERATORS: BulkGeneratorAccount[] = [
  {
    id: 'GEN_01_GREEN_VALLEY',
    name: 'Green Valley Heights Housing Society',
    category: 'HOUSING_SOCIETY',
    address: 'Beltola Survey, Ward 28, Guwahati',
    wardNumber: 28,
    avgDailyWasteKg: 240.0,
    isBulkGenerator: true,
    massBalance: {
      wetKg: 130.0,
      dryKg: 95.0,
      sanitaryKg: 9.0,
      specialCareKg: 6.0,
    },
  },
  {
    id: 'GEN_02_BRAHMAPUTRA_GRAND',
    name: 'Hotel Brahmaputra Grand',
    category: 'HOTEL_COMMERCIAL',
    address: 'GS Road, Ganeshguri, Ward 29, Guwahati',
    wardNumber: 29,
    avgDailyWasteKg: 185.0,
    isBulkGenerator: true,
    massBalance: {
      wetKg: 110.0,
      dryKg: 65.0,
      sanitaryKg: 4.0,
      specialCareKg: 6.0,
    },
  },
];

export interface SwmComplianceCertificate {
  certificateId: string;
  generatorId: string;
  generatorName: string;
  reportingPeriod: string;
  totalWasteGeneratedKg: number;
  dryScrapDivertedKg: number;
  landfillVolumeSavedCubicMeters: number;
  carbonOffsetKgCO2e: number;
  segregationCompliancePct: number;
  gmcCertificationHash: string;
  status: 'CERTIFIED_COMPLIANT' | 'NON_COMPLIANT';
}

export function generateSwmComplianceCertificate(
  generator: BulkGeneratorAccount,
  daysInPeriod: number = 30,
): SwmComplianceCertificate {
  const totalDryScrapKg = generator.massBalance.dryKg * daysInPeriod;
  const totalWasteKg = generator.avgDailyWasteKg * daysInPeriod;

  // Landfill volume saved: ~0.0027 m³ per kg of scrap diverted from Boragaon
  const landfillVolumeSaved = Number((totalDryScrapKg * 0.0027).toFixed(2));

  // Carbon offset: 1.2 kg CO₂e per kg of dry scrap
  const carbonOffset = Number((totalDryScrapKg * 1.2).toFixed(2));

  // Segregation rate: (Dry + Wet) / Total
  const segregationPct = Number(
    (
      ((generator.massBalance.wetKg + generator.massBalance.dryKg) /
        generator.avgDailyWasteKg) *
      100
    ).toFixed(1),
  );

  const hash = `GMC-SWM2026-CERT-${generator.id}-${Date.now().toString(36).toUpperCase()}`;

  return {
    certificateId: `CERT_${generator.id}_2026`,
    generatorId: generator.id,
    generatorName: generator.name,
    reportingPeriod: 'Monthly Compliance (Guwahati SWM Rules 2026)',
    totalWasteGeneratedKg: totalWasteKg,
    dryScrapDivertedKg: totalDryScrapKg,
    landfillVolumeSavedCubicMeters: landfillVolumeSaved,
    carbonOffsetKgCO2e: carbonOffset,
    segregationCompliancePct: segregationPct,
    gmcCertificationHash: hash,
    status: segregationPct >= 80.0 ? 'CERTIFIED_COMPLIANT' : 'NON_COMPLIANT',
  };
}
