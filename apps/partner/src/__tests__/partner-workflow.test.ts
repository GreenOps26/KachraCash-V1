import { describe, it, expect, vi, beforeEach } from 'vitest';
import { speakAssamesePrompt, assamesePrompts } from '../audio/assamesePrompts.js';
import { offlineQueue } from '../services/offlineQueue.js';
import { PartnerApiClient } from '../services/partnerApi.js';
import { validateScaleIngestion, BLEWeightTelemetryPacket } from '@kachracash/types';

describe('Partner Collector Operational Workflow & Systems Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Assamese Voice Engine Prompts (Zero-Text / Low-Literacy Audio)', () => {
    it('should play colloquial Assamese prompt on Dispatch arrival ("Notun bhonga-kuhila aahise...")', () => {
      const text = speakAssamesePrompt('dispatch');
      expect(text).toContain('নতুন ভঙা-কুহিলা আহিছে');
      expect(assamesePrompts.dispatch.textEn).toContain('New pickup request');
    });

    it('should play colloquial Assamese prompt on Tare/Weighing ("Scale-ot bastu tu tulok...")', () => {
      const text = speakAssamesePrompt('weighing', 14.5);
      expect(text).toContain('স্কেলত বস্তু তুলক');
      expect(text).toContain('14.50 কিলো হৈছে');
    });

    it('should play colloquial Assamese prompt on Settlement ("Grahokok tinisho dohotoka diyok...")', () => {
      const text = speakAssamesePrompt('settlement', 310.0, 24.8);
      expect(text).toContain('গ্ৰাহকক 310 টকা দিয়ক');
      expect(text).toContain('আপোনাৰ লাভ 25 টকা');
    });

    it('should play offline queue prompt when cellular data drops', () => {
      const text = speakAssamesePrompt('offlineQueued');
      expect(text).toContain('নেটৱৰ্ক সংযোগ নাই');
      expect(text).toContain('অফলাইন মজুত কৰা হৈছে');
    });
  });

  describe('2. Scale Stream & Anti-Tamper Zero-Tare Enforcement', () => {
    it('should confirm valid zero-tared packet from authenticated BLE stream', () => {
      const validTaredPacket: BLEWeightTelemetryPacket = {
        scaleId: 'SCALE_BLE_01',
        weightKg: 14.5,
        isTared: true,
        batteryPct: 92,
        timestamp: Date.now(),
      };

      const validated = validateScaleIngestion(validTaredPacket);
      expect(validated.isTared).toBe(true);
      expect(validated.weightKg).toBe(14.5);
      expect(validated.scaleId).toBe('SCALE_BLE_01');
    });

    it('should REJECT weighment if scale was not zero-tared before scrap placement', () => {
      const untaredPacket: BLEWeightTelemetryPacket = {
        scaleId: 'SCALE_BLE_01',
        weightKg: 14.5,
        isTared: false, // Tare not registered
        batteryPct: 92,
        timestamp: Date.now(),
      };

      expect(() => validateScaleIngestion(untaredPacket)).toThrowError(
        'ZERO_TARE_REQUIRED: Scale must register 0.000 kg baseline tare before accepting scrap weight.',
      );
    });

    it('should strictly reject manual weight input attempts', () => {
      const fakeManualInput = {
        manualWeightInputKg: 20.0,
      };
      expect(() => validateScaleIngestion(fakeManualInput as unknown as BLEWeightTelemetryPacket)).toThrowError(
        'FORBIDDEN_MANUAL_WEIGHT',
      );
    });
  });

  describe('3. Offline SQLite Queue & Automated Sync Resilience', () => {
    it('should enqueue signed doorstep transactions and track pending state', async () => {
      const txId = await offlineQueue.enqueue({
        requestId: 'REQ_TEST_OFFLINE_01',
        collectorId: 'COL_TEST_01',
        otp: '4455',
        items: [
          {
            categoryId: 'c0a80101-0000-0000-0000-000000000001',
            weightKg: 14.5,
            unitRate: 14.0,
            scaleHardwareId: 'SCALE_BLE_01',
          },
        ],
        signature: 'HMAC_TEST_SIG_123',
        timestamp: Date.now(),
      });

      expect(txId).toBeDefined();
      expect(txId).toContain('OFFLINE_TX_');

      const pending = await offlineQueue.getPendingTransactions();
      const enqueued = pending.find((t) => t.id === txId);
      expect(enqueued).toBeDefined();
      expect(enqueued?.otp).toBe('4455');
      expect(enqueued?.items[0]?.weightKg).toBe(14.5);
      expect(enqueued?.syncStatus).toBe('PENDING');
    });

    it('should sync pending offline transactions once network reconnects', async () => {
      const txId = await offlineQueue.enqueue({
        requestId: 'REQ_TEST_OFFLINE_02',
        collectorId: 'COL_TEST_01',
        otp: '1234',
        items: [
          {
            categoryId: 'c0a80101-0000-0000-0000-000000000001',
            weightKg: 8.0,
            unitRate: 14.0,
            scaleHardwareId: 'SCALE_BLE_01',
          },
        ],
        signature: 'HMAC_TEST_SIG_456',
        timestamp: Date.now(),
      });

      // Simulate network sync function
      const syncFn = vi.fn().mockResolvedValue(true);
      const result = await offlineQueue.syncAll(syncFn);

      expect(result.synced).toBeGreaterThanOrEqual(1);
      expect(syncFn).toHaveBeenCalled();

      // Ensure marked synced
      const pendingAfter = await offlineQueue.getPendingTransactions();
      const stillPending = pendingAfter.find((t) => t.id === txId);
      expect(stillPending).toBeUndefined();
    });
  });

  describe('4. Partner API Client & Offline Failover', () => {
    it('should failover to offlineQueue when cellular network drops or times out during OTP settlement', async () => {
      const client = new PartnerApiClient('http://mock-api.local');

      // Mock fetch to simulate cellular network drop / timeout
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('NETWORK_TIMEOUT: Cellular dropped')));

      const result = await client.verifyOtp({
        requestId: 'REQ_DROPPED_01',
        collectorId: 'COL_TEST_01',
        otp: '8899',
        items: [
          {
            categoryId: 'c0a80101-0000-0000-0000-000000000001',
            weightKg: 14.5,
            unitRate: 14.0,
            scaleHardwareId: 'SCALE_BLE_01',
          },
        ],
      });

      // Must report success with offline queued flag
      expect(result.success).toBe(true);
      expect(result.isOfflineQueued).toBe(true);
      expect(result.queueId).toBeDefined();
      expect(result.data?.status).toBe('COMPLETED');
      expect(result.data?.payoutStatus).toBe('OFFLINE_QUEUED');
      expect(result.data?.citizenPayout).toBe(203.0);
    });

    it('should successfully parse HTTP 200 responses from API server', async () => {
      const client = new PartnerApiClient('http://mock-api.local');

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              citizenPayout: 203.0,
              platformFee: 16.24,
              totalCollectorDebit: 219.24,
              status: 'COMPLETED',
              payoutStatus: 'SUCCESS',
            },
          }),
        }),
      );

      const result = await client.verifyOtp({
        requestId: 'REQ_SUCCESS_01',
        collectorId: 'COL_TEST_01',
        otp: '7788',
        items: [
          {
            categoryId: 'c0a80101-0000-0000-0000-000000000001',
            weightKg: 14.5,
            unitRate: 14.0,
            scaleHardwareId: 'SCALE_BLE_01',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.isOfflineQueued).toBeUndefined();
      expect(result.data?.citizenPayout).toBe(203.0);
      expect(result.data?.platformFee).toBe(16.24);
      expect(result.data?.totalCollectorDebit).toBe(219.24);
      expect(result.data?.status).toBe('COMPLETED');
      expect(result.data?.payoutStatus).toBe('SUCCESS');
    });
  });
});
