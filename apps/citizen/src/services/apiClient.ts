import { VisualTier } from '@kachracash/types';

export const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] || 'http://localhost:4000';

export interface TierRate {
  id: VisualTier;
  name: string;
  items: string;
  minRate: number;
  maxRate: number;
  floorRate: number;
  swmStream: string;
}

export interface WardData {
  id: string;
  wardNumber: number;
  wardName: string;
  isMonsoonSuspended: boolean;
}

export interface RateCardData {
  tiers: TierRate[];
  wards: WardData[];
}

export interface CreatePickupPayload {
  citizenId?: string;
  wardId: string;
  visualTier: VisualTier;
  pickupLocation?: { lat: number; lng: number };
  slotStart: string;
  slotEnd: string;
  photoUrl?: string | null;
}

export interface CreatedOrderData {
  orderId: string;
  otp: string;
  status: string;
  visualTier: VisualTier;
  wardId: string;
  scheduledSlot: {
    start: string;
    end: string;
  };
  pickupLocation: { lat: number; lng: number };
  photoUrl: string | null;
}

export interface OrderScaleStream {
  weightKg: number;
  isTared: boolean;
  batteryPct: number;
  unitRate: number;
  scaleId: string;
}

export interface OrderStatusData {
  orderId: string;
  status: 'PENDING' | 'WEIGHING' | 'OTP_PENDING' | 'COMPLETED' | 'CANCELLED';
  scaleStream?: OrderScaleStream;
}

export const apiClient = {
  async getRateCard(): Promise<{ success: boolean; data: RateCardData }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/orders/rate-card`);
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || 'Failed to fetch rate card');
    }
    return res.json() as Promise<{ success: boolean; data: RateCardData }>;
  },

  async createPickupRequest(payload: CreatePickupPayload): Promise<{
    success: boolean;
    message: string;
    data: CreatedOrderData;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || 'Failed to create pickup request');
    }
    return res.json() as Promise<{
      success: boolean;
      message: string;
      data: CreatedOrderData;
    }>;
  },

  async getOrderStatus(orderId: string): Promise<{
    success: boolean;
    data: OrderStatusData;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/status`);
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || 'Failed to fetch order status');
    }
    return res.json() as Promise<{
      success: boolean;
      data: OrderStatusData;
    }>;
  },

  async getFloorRates() {
    const res = await fetch(`${API_BASE_URL}/api/v1/rates`);
    if (!res.ok) throw new Error('Failed to fetch floor rates');
    return res.json();
  },

  async getPayoutPreview(weightKg: number, ratePerKg: number) {
    const res = await fetch(`${API_BASE_URL}/api/v1/payout/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg, ratePerKg }),
    });
    if (!res.ok) throw new Error('Failed to get payout preview');
    return res.json();
  },
};
