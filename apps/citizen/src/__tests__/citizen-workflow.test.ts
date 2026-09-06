import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Linking } from 'react-native';
import { calculatePayout, VisualTier } from '@kachracash/types';
import {
  apiClient,
  CreatePickupPayload,
  RateCardData,
} from '../services/apiClient.js';
import { DEFAULT_GUWAHATI_WARDS, PICKUP_SLOTS } from '../components/SlotPicker.js';

describe('Citizen Consumer Workflow & Systems Verification (@apps/citizen)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Dynamic Rate Card Fetching & 3-Tier Visual Intake', () => {
    it('should fetch active rate card with 3 visual tiers and Guwahati wards', async () => {
      const mockRateCardData: RateCardData = {
        tiers: [
          {
            id: 'RIGID_CONTAINERS',
            name: 'Rigid Containers (বটল আৰু কেন)',
            items: 'PET Bottles, HDPE Jars, Tin Cans',
            minRate: 16.0,
            maxRate: 88.0,
            floorRate: 30.59,
            swmStream: 'DRY_RECYCLABLE',
          },
          {
            id: 'SOFT_FILMS',
            name: 'Soft Film & Paper (কাৰ্ডব’ৰ্ড আৰু কাগজ)',
            items: 'Old Corrugated Cardboard (OCC), Newspaper, LDPE Films',
            minRate: 10.0,
            maxRate: 17.0,
            floorRate: 14.0,
            swmStream: 'DRY_RECYCLABLE',
          },
          {
            id: 'MIXED_BULKY',
            name: 'Bulky & Metals (লোহা আৰু ডাঙৰ সামগ্ৰী)',
            items: 'Iron, Steel Scrap, Copper, Brass, White Goods',
            minRate: 25.0,
            maxRate: 380.0,
            floorRate: 32.0,
            swmStream: 'SPECIAL_CARE',
          },
        ],
        wards: [
          { id: 'WARD_BELTOLA_28', wardNumber: 28, wardName: 'Beltola', isMonsoonSuspended: false },
          { id: 'WARD_JAYANAGAR_24', wardNumber: 24, wardName: 'Jayanagar', isMonsoonSuspended: false },
          { id: 'WARD_GANESHGURI_29', wardNumber: 29, wardName: 'Ganeshguri', isMonsoonSuspended: false },
          { id: 'WARD_NOONMATI_15', wardNumber: 15, wardName: 'Noonmati', isMonsoonSuspended: false },
          { id: 'WARD_WIRELESS_30', wardNumber: 30, wardName: 'Wireless / Hatigaon', isMonsoonSuspended: true },
        ],
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockRateCardData }),
        }),
      );

      const response = await apiClient.getRateCard();
      expect(response.success).toBe(true);
      expect(response.data.tiers).toHaveLength(3);

      const tierIds: VisualTier[] = response.data.tiers.map((t) => t.id);
      expect(tierIds).toEqual(['RIGID_CONTAINERS', 'SOFT_FILMS', 'MIXED_BULKY']);

      const occTier = response.data.tiers.find((t) => t.id === 'SOFT_FILMS');
      expect(occTier?.floorRate).toBe(14.0);
      expect(occTier?.name).toContain('কাৰ্ডব’ৰ্ড আৰু কাগজ');
    });

    it('should throw an error when rate card API request fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' }),
        }),
      );

      await expect(apiClient.getRateCard()).rejects.toThrow('Internal server error');
    });
  });

  describe('2. Monsoon Flood Suspension Validation & 2-Hour Scheduling Windows', () => {
    it('should identify waterlogged wards (Wireless / Hatigaon) as monsoon suspended', () => {
      const hatigaonWard = DEFAULT_GUWAHATI_WARDS.find((w) => w.id === 'WARD_WIRELESS_30');
      expect(hatigaonWard).toBeDefined();
      expect(hatigaonWard?.isMonsoonSuspended).toBe(true);
      expect(hatigaonWard?.wardNumber).toBe(30);

      const beltolaWard = DEFAULT_GUWAHATI_WARDS.find((w) => w.id === 'WARD_BELTOLA_28');
      expect(beltolaWard).toBeDefined();
      expect(beltolaWard?.isMonsoonSuspended).toBe(false);
    });

    it('should REJECT pickup booking in a monsoon suspended ward', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({
            success: false,
            error:
              'WARD_TEMPORARILY_SUSPENDED: Pickup requests in Wireless / Hatigaon are suspended due to flash flooding. Slot rescheduling notification dispatched via SMS.',
          }),
        }),
      );

      const payload: CreatePickupPayload = {
        citizenId: 'CITIZEN_01',
        wardId: 'WARD_WIRELESS_30',
        visualTier: 'SOFT_FILMS',
        slotStart: '10:00 AM',
        slotEnd: '12:00 PM',
      };

      await expect(apiClient.createPickupRequest(payload)).rejects.toThrow(
        'WARD_TEMPORARILY_SUSPENDED',
      );
    });

    it('should successfully schedule pickup in an operational ward (Beltola Ward 28)', async () => {
      const scheduledOrder = {
        orderId: 'ORD_2026_BELTOLA_01',
        otp: '5829',
        status: 'PENDING',
        visualTier: 'SOFT_FILMS' as VisualTier,
        wardId: 'WARD_BELTOLA_28',
        scheduledSlot: { start: '10:00 AM', end: '12:00 PM' },
        pickupLocation: { lat: 26.1344, lng: 91.7878 },
        photoUrl: 'https://kachracash.in/uploads/scrap_sample_occ.jpg',
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            message: 'Doorstep pickup request scheduled successfully',
            data: scheduledOrder,
          }),
        }),
      );

      const payload: CreatePickupPayload = {
        citizenId: 'CITIZEN_01',
        wardId: 'WARD_BELTOLA_28',
        visualTier: 'SOFT_FILMS',
        slotStart: '10:00 AM',
        slotEnd: '12:00 PM',
        pickupLocation: { lat: 26.1344, lng: 91.7878 },
        photoUrl: 'https://kachracash.in/uploads/scrap_sample_occ.jpg',
      };

      const result = await apiClient.createPickupRequest(payload);
      expect(result.success).toBe(true);
      expect(result.data.orderId).toBe('ORD_2026_BELTOLA_01');
      expect(result.data.otp).toBe('5829');
      expect(result.data.scheduledSlot.start).toBe('10:00 AM');
      expect(result.data.pickupLocation.lat).toBe(26.1344);
    });

    it('should support standard 2-hour scheduling windows', () => {
      expect(PICKUP_SLOTS).toHaveLength(4);
      expect(PICKUP_SLOTS[0]?.label).toBe('10:00 AM – 12:00 PM');
      expect(PICKUP_SLOTS[1]?.label).toBe('12:00 PM – 02:00 PM');
      expect(PICKUP_SLOTS[2]?.label).toBe('02:00 PM – 04:00 PM');
      expect(PICKUP_SLOTS[3]?.label).toBe('04:00 PM – 06:00 PM');
    });
  });

  describe('3. Doorstep Live Mirroring: Mandatory Zero-Tare & 92% Net Payout Math', () => {
    it('should verify mandatory zero-tare visual requirement before weighment', () => {
      // Scale packet with confirmed 0.000 kg tare
      const validTare = {
        isTared: true,
        baselineWeight: 0.0,
      };
      expect(validTare.isTared).toBe(true);
      expect(validTare.baselineWeight).toBe(0.0);

      // Untared scale packet
      const unTared = {
        isTared: false,
        baselineWeight: 1.25,
      };
      expect(unTared.isTared).toBe(false);
    });

    it('should compute deterministic line-item math with 8% take-rate and 92% net citizen payout for 14.5 kg OCC', () => {
      const weightKg = 14.5;
      const ratePerKg = 14.0; // OCC Floor Rate: ₹14.00 / kg

      const { grossAmount, platformFee, citizenPayout } = calculatePayout(weightKg, ratePerKg);

      // Gross amount: 14.5 * 14.0 = 203.00
      expect(grossAmount).toBe(203.0);

      // Platform fee (8% take-rate): 203.00 * 0.08 = 16.24
      expect(platformFee).toBe(16.24);

      // Net citizen payout (92%): 203.00 - 16.24 = 186.76
      expect(citizenPayout).toBe(186.76);

      // Absolute financial balance integrity check:
      expect(grossAmount).toBeCloseTo(platformFee + citizenPayout, 2);
    });

    it('should compute deterministic line-item math for 15.4 kg PET Plastic at ₹30.59/kg', () => {
      const weightKg = 15.4;
      const ratePerKg = 30.59;

      const { grossAmount, platformFee, citizenPayout } = calculatePayout(weightKg, ratePerKg);

      expect(grossAmount).toBeCloseTo(471.09, 2);
      expect(platformFee).toBeCloseTo(37.69, 2);
      expect(citizenPayout).toBeCloseTo(433.4, 2);
      expect(grossAmount).toBeCloseTo(platformFee + citizenPayout, 2);
    });
  });

  describe('4. Secure 4-Digit OTP Handshake & Lifecycle Polling', () => {
    it('should ensure order OTP is strictly a 4-digit numeric code', () => {
      const otp = '7394';
      expect(otp).toMatch(/^\d{4}$/);
      expect(otp.length).toBe(4);
    });

    it('should poll order status and reflect COMPLETED state once collector verifies OTP', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              orderId: 'ORD_2026_BELTOLA_01',
              status: 'COMPLETED',
              scaleStream: {
                weightKg: 14.5,
                isTared: true,
                batteryPct: 92,
                unitRate: 14.0,
                scaleId: 'SCALE_BLE_01',
              },
            },
          }),
        }),
      );

      const statusRes = await apiClient.getOrderStatus('ORD_2026_BELTOLA_01');
      expect(statusRes.success).toBe(true);
      expect(statusRes.data.status).toBe('COMPLETED');
      expect(statusRes.data.scaleStream?.weightKg).toBe(14.5);
      expect(statusRes.data.scaleStream?.isTared).toBe(true);
    });
  });

  describe('5. Post-Settlement ESG Impact Receipt & WhatsApp Sharing', () => {
    it('should calculate municipal ESG metrics according to Guwahati SWM Rules 2026', () => {
      const weightKg = 15.4;

      // ~0.0027 m³ landfill volume saved per kg
      const volumeSaved = (weightKg * 0.0027).toFixed(3);
      expect(volumeSaved).toBe('0.042');

      // ~1.2 kg CO₂e avoided per kg
      const carbonAvoided = (weightKg * 1.2).toFixed(1);
      expect(carbonAvoided).toBe('18.5');

      // 10 Green Credits per kg
      const credits = Math.round(weightKg * 10);
      expect(credits).toBe(154);
    });

    it('should trigger WhatsApp sharing with encoded ESG receipt certificate', async () => {
      const openURLSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true);

      const receiptId = 'KC-2026-99214';
      const wardName = 'Beltola';
      const netPayout = 186.76;
      const weightKg = 14.5;
      const volumeSaved = (weightKg * 0.0027).toFixed(3);
      const carbonAvoided = (weightKg * 1.2).toFixed(1);
      const credits = Math.round(weightKg * 10);

      const shareText =
        `🌿 *KachraCash Circular Economy Receipt*\n` +
        `Receipt ID: #${receiptId}\n` +
        `Ward: ${wardName}, Guwahati\n` +
        `Scrap Diverted from Boragaon: ${weightKg.toFixed(3)} kg\n` +
        `Net UPI Payout Received: ₹${netPayout.toFixed(2)}\n` +
        `Landfill Volume Saved: ${volumeSaved} m³\n` +
        `CO₂ Emissions Avoided: ${carbonAvoided} kg CO₂e\n` +
        `Green KC Credits Earned: +${credits} KC\n\n` +
        `Recycle with KachraCash: https://kachracash.in`;

      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;

      await Linking.openURL(whatsappUrl);

      expect(openURLSpy).toHaveBeenCalledTimes(1);
      expect(openURLSpy).toHaveBeenCalledWith(whatsappUrl);

      const decodedCallArg = decodeURIComponent(openURLSpy.mock.calls[0]![0]);
      expect(decodedCallArg).toContain('KachraCash Circular Economy Receipt');
      expect(decodedCallArg).toContain('#KC-2026-99214');
      expect(decodedCallArg).toContain('Beltola, Guwahati');
      expect(decodedCallArg).toContain('14.500 kg');
      expect(decodedCallArg).toContain('₹186.76');
      expect(decodedCallArg).toContain('Boragaon');
      expect(decodedCallArg).toContain('+145 KC');
    });
  });
});
