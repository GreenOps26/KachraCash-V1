const PACKET_HEADER = 0xaa;
const MIN_PACKET_LENGTH = 8;

export interface ParsedBleScalePacket {
	weightKg: number;
	isTared: boolean;
	batteryPct: number;
	raw: Uint8Array;
}

export interface ManualWeightPayload {
	orderId: string;
	manualWeightInputKg?: number;
	scaleTelemetryPacket: null;
}

export type ScaleIngestionInput = ParsedBleScalePacket | ManualWeightPayload;

export function parseBLEScalePacket(packet: Uint8Array, _secret: string): ParsedBleScalePacket {
	if (packet.length < MIN_PACKET_LENGTH) {
		throw new Error('INVALID_BLE_PACKET: Packet must be at least 8 bytes');
	}

	if (packet[0] !== PACKET_HEADER) {
		throw new Error('INVALID_BLE_PACKET: Missing header byte 0xAA');
	}

	const weightGrams = readUInt16BE(packet, 2);
	const batteryPct = packet[4];
	const isTared = packet[5] === 0x01;

	return {
		weightKg: weightGrams / 1000,
		isTared,
		batteryPct,
		raw: packet
	};
}

export function validateScaleIngestion(input: ScaleIngestionInput): ParsedBleScalePacket {
	if ('manualWeightInputKg' in input && input.scaleTelemetryPacket === null) {
		throw new Error(
			'FORBIDDEN_MANUAL_WEIGHT: Manual numeric text input is strictly forbidden. Scrap weight must originate from BLE scale stream.'
		);
	}

	const parsed = input as ParsedBleScalePacket;

	if (!parsed.isTared) {
		throw new Error(
			'ZERO_TARE_REQUIRED: Scale must register 0.000 kg baseline tare before accepting scrap weight.'
		);
	}

	return parsed;
}

function readUInt16BE(bytes: Uint8Array, offset: number): number {
	return (bytes[offset] << 8) | bytes[offset + 1];
}
