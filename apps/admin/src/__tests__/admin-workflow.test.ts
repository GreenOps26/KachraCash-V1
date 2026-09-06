import { describe, it, expect } from 'vitest';
import {
  calculateDistanceMeters,
  evaluateSlaStatus,
  reassignBreachedTicket,
  computeFloorRateWithFreight,
  REGIONAL_FREIGHT_HUBS,
  INITIAL_GUWAHATI_WARDS,
  getWalletStatusBadge,
  redactAadhaar,
  generateOpaqueKycToken,
  BULK_GENERATORS,
  generateSwmComplianceCertificate,
  CollectorRadarMarker,
  ActivePickupCoordinate,
} from '../services/adminOperations';

describe('Admin Operations Console & Systems Architecture (@apps/admin)', () => {
  describe('1. PostGIS Dispatch Radar & T-15 Min SLA Proximity Logic', () => {
    it('should accurately compute spherical distance equivalent to PostGIS ST_DistanceSphere', () => {
      // Pickup in Beltola Tiniali
      const pickupLat = 26.1344;
      const pickupLng = 91.7878;

      // Nearby collector in Survey
      const nearbyCollectorLat = 26.1355;
      const nearbyCollectorLng = 91.7885;

      const distanceNearby = calculateDistanceMeters(
        nearbyCollectorLat,
        nearbyCollectorLng,
        pickupLat,
        pickupLng,
      );
      expect(distanceNearby).toBeLessThan(500);
      expect(distanceNearby).toBeGreaterThan(50);

      // Distant collector in Lokhra (>3 km away)
      const distantCollectorLat = 26.1150;
      const distantCollectorLng = 91.7650;

      const distanceDistant = calculateDistanceMeters(
        distantCollectorLat,
        distantCollectorLng,
        pickupLat,
        pickupLng,
      );
      expect(distanceDistant).toBeGreaterThan(2500);
    });

    it('should flag SLA status according to T-20 and T-15 proximity rules', () => {
      // 1. Within 500m -> OPTIMAL regardless of time
      expect(evaluateSlaStatus(350, 10)).toBe('OPTIMAL');
      expect(evaluateSlaStatus(450, 18)).toBe('OPTIMAL');

      // 2. Outside 500m at T-25 min -> OPTIMAL (buffer available)
      expect(evaluateSlaStatus(1200, 25)).toBe('OPTIMAL');

      // 3. Outside 500m at T-20 min -> WARNING_T20 (Amber Warning)
      expect(evaluateSlaStatus(1200, 20)).toBe('WARNING_T20');
      expect(evaluateSlaStatus(800, 19)).toBe('WARNING_T20');

      // 4. Outside 500m at T-15 min -> BREACH_T15 (Red Alert)
      expect(evaluateSlaStatus(1200, 15)).toBe('BREACH_T15');
      expect(evaluateSlaStatus(600, 12)).toBe('BREACH_T15');
    });

    it('should reassign breached ticket, levy ₹150 collector penalty, and issue ₹100 citizen voucher', () => {
      const ticket: ActivePickupCoordinate = {
        ticketId: 'TCK_TEST_01',
        orderId: 'ORD_99182',
        citizenName: 'Anita Goswami',
        citizenPhone: '+91 98641 55667',
        wardId: 'WARD_BELTOLA_28',
        wardName: 'Beltola',
        wardNumber: 28,
        lat: 26.1344,
        lng: 91.7878,
        visualTier: 'SOFT_FILMS',
        scheduledSlot: '10:00 AM – 12:00 PM',
        timeToSlotMinutes: 14, // T-14 min breach
        assignedCollectorId: 'COLL_BREACH',
        assignedCollectorName: 'Dhruba Bora',
        distanceMeters: 2800,
        slaStatus: 'BREACH_T15',
      };

      const candidateCollectors: CollectorRadarMarker[] = [
        {
          collectorId: 'COLL_BREACH',
          name: 'Dhruba Bora',
          phone: '+91 97060 77889',
          lat: 26.1150,
          lng: 91.7650,
          floatBalance: 2500.0,
          status: 'IN_TRANSIT',
        },
        {
          collectorId: 'COLL_NEARBY',
          name: 'Mridul Das',
          phone: '+91 94351 22334',
          lat: 26.1355,
          lng: 91.7885, // ~140m away
          floatBalance: 3200.0,
          status: 'ONLINE',
        },
        {
          collectorId: 'COLL_LOW_FLOAT',
          name: 'Underfunded Collector',
          phone: '+91 98640 00000',
          lat: 26.1345,
          lng: 91.7879,
          floatBalance: 1200.0, // < ₹2,000 => ineligible
          status: 'ONLINE',
        },
      ];

      const result = reassignBreachedTicket(ticket, candidateCollectors);

      expect(result.success).toBe(true);
      expect(result.ticketId).toBe('TCK_TEST_01');
      expect(result.previousCollectorId).toBe('COLL_BREACH');
      expect(result.newCollectorId).toBe('COLL_NEARBY');
      expect(result.newCollectorName).toBe('Mridul Das');
      expect(result.penaltyLevied).toBe(150.0);
      expect(result.citizenVoucherIssued).toBe(100.0);
      expect(result.newDistanceMeters).toBeLessThan(500);
      expect(result.message).toContain('₹150 penalty debited');
      expect(result.message).toContain('₹100 voucher issued');
    });
  });

  describe('2. Dynamic Floor Rate Calculations & Freight Corridor Offsets', () => {
    it('should compute deterministic floor rate for Byrnihat short-haul ferrous freight (C_freight = ₹1.20/kg)', () => {
      const nationalIndex = 40.0;
      const freightCost = REGIONAL_FREIGHT_HUBS.BYRNIHAT_FERROUS.freightOffsetPerKg; // 1.2
      const handlingCost = 1.8;
      const aggregatorMargin = 2.0;
      const collectorMargin = 0.08;
      const volatilityBuffer = 0.05;

      const result = computeFloorRateWithFreight(
        nationalIndex,
        freightCost,
        handlingCost,
        aggregatorMargin,
        collectorMargin,
        volatilityBuffer,
      );

      // Formula: [40 - (1.2 + 1.8 + 2.0)] * (1 - 0.08) * (1 - 0.05)
      // = 35.0 * 0.92 * 0.95 = 30.59
      expect(result.floorRate).toBe(30.59);
      expect(result.isValid).toBe(true);
      expect(result.breakdown?.logisticsDeductions).toBe(5.0);
      expect(result.breakdown?.collectorCommission).toBe(0.08);
      expect(result.breakdown?.riskBufferDeduction).toBe(0.05);
    });

    it('should compute deterministic floor rate for Siliguri paper/polymer freight (C_freight = ₹3.50/kg)', () => {
      const nationalIndex = 16.0;
      const freightCost = REGIONAL_FREIGHT_HUBS.SILIGURI_POLYMER.freightOffsetPerKg; // 3.5
      const handlingCost = 1.0;
      const aggregatorMargin = 1.0;
      const collectorMargin = 0.08;
      const volatilityBuffer = 0.04;

      const result = computeFloorRateWithFreight(
        nationalIndex,
        freightCost,
        handlingCost,
        aggregatorMargin,
        collectorMargin,
        volatilityBuffer,
      );

      // Formula: [16 - (3.5 + 1.0 + 1.0)] * (1 - 0.08) * (1 - 0.04)
      // = 10.5 * 0.92 * 0.96 = 9.2736 => 9.27
      expect(result.floorRate).toBe(9.27);
    });

    it('should confirm Byrnihat short-haul produces higher net floor rate than Siliguri for identical commodities', () => {
      const nationalIndex = 50.0;
      const byrnihatRate = computeFloorRateWithFreight(nationalIndex, 1.2);
      const siliguriRate = computeFloorRateWithFreight(nationalIndex, 3.5);

      expect(byrnihatRate.floorRate).toBeGreaterThan(siliguriRate.floorRate);
      expect(byrnihatRate.floorRate - siliguriRate.floorRate).toBeCloseTo(2.01, 1);
    });
  });

  describe('3. Monsoon Ward Suspension Desk & Disaster Governance', () => {
    it('should maintain Guwahati municipal polygons with accurate flood vulnerability status', () => {
      const hatigaon = INITIAL_GUWAHATI_WARDS.find((w) => w.id === 'WARD_WIRELESS_30');
      expect(hatigaon).toBeDefined();
      expect(hatigaon?.isMonsoonSuspended).toBe(true);
      expect(hatigaon?.wardNumber).toBe(30);

      const beltola = INITIAL_GUWAHATI_WARDS.find((w) => w.id === 'WARD_BELTOLA_28');
      expect(beltola).toBeDefined();
      expect(beltola?.isMonsoonSuspended).toBe(false);
      expect(beltola?.wardNumber).toBe(28);
    });

    it('should track active pickup reschedules and notify residents when a ward is suspended', () => {
      const jayanagar = INITIAL_GUWAHATI_WARDS.find((w) => w.id === 'WARD_JAYANAGAR_24');
      expect(jayanagar?.isMonsoonSuspended).toBe(false);

      // Simulate toggling suspension
      const suspendedJayanagar = {
        ...jayanagar!,
        isMonsoonSuspended: true,
        activeRescheduledPickups: 11,
        lastToggledAt: '2026-09-07T00:00:00Z',
      };

      expect(suspendedJayanagar.isMonsoonSuspended).toBe(true);
      expect(suspendedJayanagar.activeRescheduledPickups).toBe(11);
    });
  });

  describe('4. Wallet Float Status & Sensitive KYC Redaction Compliance', () => {
    it('should assign correct status badges based on pre-funded float thresholds', () => {
      // ≥ ₹2,000 -> HEALTHY_FLOAT (Green)
      expect(getWalletStatusBadge(4250.0)).toBe('HEALTHY_FLOAT');
      expect(getWalletStatusBadge(2000.0)).toBe('HEALTHY_FLOAT');

      // ₹1,000 – ₹1,999 -> ROUTE_BUFFER (Amber)
      expect(getWalletStatusBadge(1999.99)).toBe('ROUTE_BUFFER');
      expect(getWalletStatusBadge(1500.0)).toBe('ROUTE_BUFFER');
      expect(getWalletStatusBadge(1000.0)).toBe('ROUTE_BUFFER');

      // < ₹1,000 -> CRITICAL_FROZEN (Red)
      expect(getWalletStatusBadge(999.99)).toBe('CRITICAL_FROZEN');
      expect(getWalletStatusBadge(450.0)).toBe('CRITICAL_FROZEN');
    });

    it('should strictly redact raw Aadhaar numbers and display opaque verification tokens', () => {
      const rawAadhaar = '542198761234';
      const redacted = redactAadhaar(rawAadhaar);

      expect(redacted).toBe('•••• •••• 1234 [Aadhaar Redacted]');
      expect(redacted).not.toContain('5421');
      expect(redacted).not.toContain('9876');

      const kycToken = generateOpaqueKycToken('COLL_01');
      expect(kycToken).toMatch(/^KYC_VERIFIED_AS_\d{4}$/);
    });
  });

  describe('5. SWM Rules 2026 Bulk Compliance Certificate Calculations', () => {
    it('should correctly calculate bulk generator compliance metrics and certified diversion', () => {
      const society = BULK_GENERATORS[0]!; // Green Valley Heights (240 kg/day)
      const certificate = generateSwmComplianceCertificate(society, 30);

      expect(certificate.generatorId).toBe('GEN_01_GREEN_VALLEY');
      expect(certificate.totalWasteGeneratedKg).toBe(7200); // 240 * 30

      // Dry scrap: 95 kg/day * 30 days = 2850 kg
      expect(certificate.dryScrapDivertedKg).toBe(2850);

      // Landfill volume saved: 2850 * 0.0027 = 7.70 m³
      expect(certificate.landfillVolumeSavedCubicMeters).toBe(7.7);

      // Carbon offset: 2850 * 1.2 = 3420 kg CO₂e
      expect(certificate.carbonOffsetKgCO2e).toBe(3420);

      // Segregation compliance %: (130 + 95) / 240 = 225 / 240 = 93.8%
      expect(certificate.segregationCompliancePct).toBe(93.8);
      expect(certificate.status).toBe('CERTIFIED_COMPLIANT');

      // Cryptographic verification hash
      expect(certificate.gmcCertificationHash).toContain('GMC-SWM2026-CERT-GEN_01_GREEN_VALLEY');
    });

    it('should verify bulk waste generation status for commercial hotel facility', () => {
      const hotel = BULK_GENERATORS[1]!; // Hotel Brahmaputra Grand (185 kg/day)
      expect(hotel.avgDailyWasteKg).toBeGreaterThan(100);
      expect(hotel.isBulkGenerator).toBe(true);

      const cert = generateSwmComplianceCertificate(hotel, 30);
      expect(cert.dryScrapDivertedKg).toBe(1950); // 65 * 30
      expect(cert.status).toBe('CERTIFIED_COMPLIANT');
    });
  });
});
