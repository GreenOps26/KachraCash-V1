/** GATT service + characteristics for KachraCash certified hanging scales */
export const BLE_SCALE_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
export const BLE_SCALE_TELEMETRY_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
export const BLE_SCALE_CONTROL_UUID = '0000ffe2-0000-1000-8000-00805f9b34fb';

/** Tare command byte written to the control characteristic */
export const BLE_TARE_COMMAND_BYTE = 0x01;

export interface BleScaleReading {
	weightKg: number;
	stable: boolean;
	deviceId: string;
	timestamp: string;
}

export interface BleTareCommand {
	deviceId: string;
	requestedAt: string;
}

/** Build an 8-byte telemetry packet matching `parseBLEScalePacket` (dev simulator + tests). */
export function buildBleScalePacket(params: {
	scaleMode?: number;
	weightGrams: number;
	batteryPct: number;
	isTared: boolean;
}): Uint8Array {
	const packet = new Uint8Array(8);
	packet[0] = 0xaa;
	packet[1] = params.scaleMode ?? 0x01;
	packet[2] = (params.weightGrams >> 8) & 0xff;
	packet[3] = params.weightGrams & 0xff;
	packet[4] = params.batteryPct;
	packet[5] = params.isTared ? 0x01 : 0x00;
	// Signature bytes — HMAC validation deferred to hardware firmware phase
	packet[6] = 0xa4;
	packet[7] = 0x12;
	return packet;
}
