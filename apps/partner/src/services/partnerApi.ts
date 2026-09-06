import {
  VerifyOtpRequest,
  WalletTopupRequest,
} from '@kachracash/types';
import { offlineQueue, QueuedDoorstepTransaction } from './offlineQueue.js';

const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] || 'http://10.0.2.2:3001';

export interface DispatchMatchResponse {
  success: boolean;
  data?: {
    requestId: string;
    visualTier: string;
    wardName: string;
    slotStart?: string;
    slotEnd?: string;
    distanceMeters: number;
  } | null;
  message?: string;
  error?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  isOfflineQueued?: boolean;
  queueId?: string;
  data?: {
    citizenPayout: number;
    platformFee: number;
    totalCollectorDebit: number;
    status: string;
    payoutStatus: string;
  };
  error?: string;
}

export interface WalletTopupResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class PartnerApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  /**
   * Match pending pickup orders near collector within maxRadiusMeters (default 1500m)
   * POST /api/v1/dispatch/match
   */
  async matchDispatch(collectorId: string, maxRadiusMeters: number = 1500): Promise<DispatchMatchResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${this.baseUrl}/api/v1/dispatch/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectorId, maxRadiusMeters }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = (await res.json()) as DispatchMatchResponse;
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[PartnerApi] matchDispatch request error:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Verify citizen 4-digit OTP & settle doorstep order atomically
   * POST /api/v1/orders/verify-otp
   * Automatically enqueues into SQLite offlineQueue if network drops or times out
   */
  async verifyOtp(
    request: VerifyOtpRequest,
    options?: { telemetrySignature?: string; timeoutMs?: number },
  ): Promise<VerifyOtpResult> {
    const timeoutMs = options?.timeoutMs || 5000;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${this.baseUrl}/api/v1/orders/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        const errorMsg = errorData.error || `HTTP ${res.status} settlement failure`;

        if (res.status >= 500) {
          console.warn('[PartnerApi] Server error during OTP verification. Enqueueing to SQLite offlineQueue...');
          const queueId = await this.enqueueOffline(request, options?.telemetrySignature);
          return {
            success: true,
            isOfflineQueued: true,
            queueId,
            data: {
              citizenPayout: request.items.reduce((sum, i) => sum + i.weightKg * i.unitRate, 0),
              platformFee: request.items.reduce((sum, i) => sum + i.weightKg * i.unitRate * 0.08, 0),
              totalCollectorDebit: request.items.reduce((sum, i) => sum + i.weightKg * i.unitRate * 1.08, 0),
              status: 'COMPLETED',
              payoutStatus: 'OFFLINE_QUEUED',
            },
          };
        }

        return {
          success: false,
          error: errorMsg,
        };
      }

      const body = (await res.json()) as { success: boolean; data: VerifyOtpResult['data'] };
      return {
        success: true,
        data: body.data,
      };
    } catch (err: unknown) {
      console.warn('[PartnerApi] Network timeout or failure during OTP settlement. Storing in SQLite offlineQueue:', err);
      const queueId = await this.enqueueOffline(request, options?.telemetrySignature);
      const citizenPayout = request.items.reduce((sum, i) => sum + i.weightKg * i.unitRate, 0);
      const platformFee = Math.round(citizenPayout * 0.08 * 100) / 100;
      const totalCollectorDebit = Math.round((citizenPayout + platformFee) * 100) / 100;

      return {
        success: true,
        isOfflineQueued: true,
        queueId,
        data: {
          citizenPayout,
          platformFee,
          totalCollectorDebit,
          status: 'COMPLETED',
          payoutStatus: 'OFFLINE_QUEUED',
        },
      };
    }
  }

  private async enqueueOffline(
    request: VerifyOtpRequest,
    telemetrySignature?: string,
  ): Promise<string> {
    const signature =
      telemetrySignature ||
      `HMAC_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return await offlineQueue.enqueue({
      requestId: request.requestId,
      collectorId: request.collectorId,
      otp: request.otp,
      items: request.items,
      signature,
      timestamp: Date.now(),
    });
  }

  /**
   * Mid-Route Float Topup via payment gateway
   * POST /api/v1/wallets/topup
   */
  async topupWallet(request: WalletTopupRequest, collectorId: string): Promise<WalletTopupResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/wallets/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-collector-id': collectorId,
        },
        body: JSON.stringify(request),
      });

      const body = (await res.json()) as { success: boolean; message?: string; error?: string };
      return {
        success: res.ok && body.success,
        message: body.message,
        error: body.error,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Sync all pending offline transactions against the backend
   */
  async syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
    return await offlineQueue.syncAll(async (tx: QueuedDoorstepTransaction) => {
      try {
        const res = await fetch(`${this.baseUrl}/api/v1/orders/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: tx.requestId,
            collectorId: tx.collectorId,
            otp: tx.otp,
            items: tx.items,
          }),
        });

        if (res.ok) {
          const body = (await res.json()) as { success: boolean };
          return body.success;
        }
        return false;
      } catch {
        return false;
      }
    });
  }
}

export const partnerApi = new PartnerApiClient();
