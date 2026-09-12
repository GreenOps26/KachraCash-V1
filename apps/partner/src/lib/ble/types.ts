import type { ParsedBleScalePacket } from '@kachracash/types';

export type BleConnectionStatus =
	| 'disconnected'
	| 'scanning'
	| 'connecting'
	| 'connected'
	| 'error';

export interface BleDiscoveredDevice {
	id: string;
	name: string;
	rssi: number | null;
}

export interface BleScaleTransport {
	startScan(onDevice: (device: BleDiscoveredDevice) => void): Promise<void>;
	stopScan(): void;
	connect(deviceId: string): Promise<void>;
	disconnect(): Promise<void>;
	sendTare(): Promise<void>;
	subscribe(onPacket: (packet: Uint8Array) => void): () => void;
	getStatus(): BleConnectionStatus;
}

export interface BleScaleStreamState {
	status: BleConnectionStatus;
	deviceId: string | null;
	deviceName: string | null;
	reading: ParsedBleScalePacket | null;
	parseError: string | null;
	discoveredDevices: BleDiscoveredDevice[];
}
