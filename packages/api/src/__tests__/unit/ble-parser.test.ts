import { describe, expect, it } from 'vitest';
import { parseBLEScalePacket, validateScaleIngestion } from '@kachracash/types';

describe('Hardware BLE Scale Stream & Anti-Tamper Validation', () => {
	const SECRET = 'KACHRACASH_BLE_HW_SECRET_KEY_2026';

	it('should parse valid signed 8-byte BLE scale telemetry packet', () => {
		const validPacket = Uint8Array.from([0xaa, 0x01, 0x3c, 0x28, 0x5f, 0x01, 0xa4, 0x12]);

		const parsed = parseBLEScalePacket(validPacket, SECRET);
		expect(parsed.weightKg).toBe(15.4);
		expect(parsed.isTared).toBe(true);
		expect(parsed.batteryPct).toBe(95);
	});

	it('should REJECT weight ingestion if zero-tare confirmation (isTared = false) was not recorded prior to weighing', () => {
		const untaredPacket = Uint8Array.from([0xaa, 0x01, 0x0f, 0xa0, 0x5f, 0x00, 0xbf, 0x44]);

		const parsed = parseBLEScalePacket(untaredPacket, SECRET);
		expect(() => validateScaleIngestion(parsed)).toThrowError(
			'ZERO_TARE_REQUIRED: Scale must register 0.000 kg baseline tare before accepting scrap weight.'
		);
	});

	it('should REJECT requests attempting to inject manual numeric text weights (403 Forbidden)', () => {
		const manualWeightPayload = {
			orderId: 'ORD_MANUAL_HACK',
			manualWeightInputKg: 45.0,
			scaleTelemetryPacket: null
		};

		expect(() => validateScaleIngestion(manualWeightPayload)).toThrowError(
			'FORBIDDEN_MANUAL_WEIGHT: Manual numeric text input is strictly forbidden. Scrap weight must originate from BLE scale stream.'
		);
	});
});
