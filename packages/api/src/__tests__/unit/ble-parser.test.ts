import { describe, it, expect } from 'vitest';
import { parseBLEScalePacket, validateScaleIngestion, BLEWeightTelemetryPacket } from '@kachracash/types';

describe('Hardware BLE Scale Stream & Anti-Tamper Validation', () => {
  const SECRET = 'KACHRACASH_BLE_HW_SECRET_KEY_2026';

  it('should parse valid signed 8-byte BLE scale telemetry packet', () => {
    // Binary packet: [Header:0xAA, ScaleMode:0x01, Weight:15400g (0x3C28), Batt:95%, Tare:1, Sig:ValidHMAC]
    const validPacket = Buffer.from([0xaa, 0x01, 0x3c, 0x28, 0x5f, 0x01, 0xa4, 0x12]);

    const parsed = parseBLEScalePacket(validPacket, SECRET);
    expect(parsed.weightKg).toBe(15.4);
    expect(parsed.isTared).toBe(true);
    expect(parsed.batteryPct).toBe(95);
  });

  it('should REJECT weight ingestion if zero-tare confirmation (isTared = false) was not recorded prior to weighing', () => {
    const untaredPacket = Buffer.from([0xaa, 0x01, 0x0f, 0xa0, 0x5f, 0x00, 0xbf, 0x44]);

    const parsed = parseBLEScalePacket(untaredPacket, SECRET);
    expect(() => validateScaleIngestion(parsed)).toThrowError(
      'ZERO_TARE_REQUIRED: Scale must register 0.000 kg baseline tare before accepting scrap weight.',
    );
  });

  it('should REJECT requests attempting to inject manual numeric text weights (403 Forbidden)', async () => {
    const manualWeightPayload = {
      orderId: 'ORD_MANUAL_HACK',
      manualWeightInputKg: 45.0, // Client side text input attempt
      scaleTelemetryPacket: null,
    };

    expect(() => validateScaleIngestion(manualWeightPayload as unknown as BLEWeightTelemetryPacket)).toThrowError(
      'FORBIDDEN_MANUAL_WEIGHT: Manual numeric text input is strictly forbidden. Scrap weight must originate from BLE scale stream.',
    );
  });
});
