import { BLE_TARE_COMMAND_BYTE, buildBleScalePacket } from '@kachracash/types';
import type { BleConnectionStatus, BleDiscoveredDevice, BleScaleTransport } from './types';

const SIM_DEVICE: BleDiscoveredDevice = {
	id: 'sim-kachra-scale-01',
	name: 'KACHRA-SIM-SCALE',
	rssi: -42
};

/** Dev-only GATT notifier — emits real 8-byte packets, not manual weight fields. */
export class SimulatorTransport implements BleScaleTransport {
	private status: BleConnectionStatus = 'disconnected';
	private weightGrams = 0;
	private isTared = false;
	private batteryPct = 95;
	private listener: ((packet: Uint8Array) => void) | null = null;
	private scanTimer: ReturnType<typeof setInterval> | null = null;

	getStatus(): BleConnectionStatus {
		return this.status;
	}

	async startScan(onDevice: (device: BleDiscoveredDevice) => void): Promise<void> {
		this.status = 'scanning';
		onDevice(SIM_DEVICE);
	}

	stopScan(): void {
		if (this.scanTimer) {
			clearInterval(this.scanTimer);
			this.scanTimer = null;
		}
		if (this.status === 'scanning') {
			this.status = 'disconnected';
		}
	}

	async connect(_deviceId: string): Promise<void> {
		this.status = 'connecting';
		await delay(400);
		this.status = 'connected';
		this.emit();
		this.scanTimer = setInterval(() => this.emit(), 500);
	}

	async disconnect(): Promise<void> {
		this.stopScan();
		this.status = 'disconnected';
		this.listener = null;
	}

	async sendTare(): Promise<void> {
		if (this.status !== 'connected') return;
		if (BLE_TARE_COMMAND_BYTE !== 0x01) return;
		this.weightGrams = 0;
		this.isTared = true;
		this.emit();
	}

	subscribe(onPacket: (packet: Uint8Array) => void): () => void {
		this.listener = onPacket;
		return () => {
			this.listener = null;
		};
	}

	/** Simulator-only: step weight up for demo weigh-ins (still via GATT packets). */
	simulateAddWeight(grams: number): void {
		if (this.status !== 'connected') return;
		this.weightGrams = Math.max(0, this.weightGrams + grams);
		this.emit();
	}

	private emit(): void {
		if (!this.listener) return;
		this.listener(
			buildBleScalePacket({
				weightGrams: this.weightGrams,
				batteryPct: this.batteryPct,
				isTared: this.isTared
			})
		);
	}
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
