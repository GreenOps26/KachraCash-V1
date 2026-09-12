import {
	BLE_SCALE_CONTROL_UUID,
	BLE_SCALE_SERVICE_UUID,
	BLE_SCALE_TELEMETRY_UUID,
	BLE_TARE_COMMAND_BYTE
} from '@kachracash/types';
import type { BleConnectionStatus, BleDiscoveredDevice, BleScaleTransport } from './types';

type BleManagerType = import('react-native-ble-plx').BleManager;
type DeviceType = import('react-native-ble-plx').Device;
type SubscriptionType = import('react-native-ble-plx').Subscription;

function base64ToUint8Array(value: string): Uint8Array {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

/** Production GATT client — requires Expo dev build with react-native-ble-plx native module. */
export class BlePlxTransport implements BleScaleTransport {
	private manager: BleManagerType;
	private status: BleConnectionStatus = 'disconnected';
	private device: DeviceType | null = null;
	private monitorSub: SubscriptionType | null = null;
	private packetListener: ((packet: Uint8Array) => void) | null = null;

	constructor(manager: BleManagerType) {
		this.manager = manager;
	}

	getStatus(): BleConnectionStatus {
		return this.status;
	}

	async startScan(onDevice: (device: BleDiscoveredDevice) => void): Promise<void> {
		this.status = 'scanning';
		const state = await this.manager.state();
		if (state !== 'PoweredOn') {
			this.status = 'error';
			throw new Error('BLUETOOTH_OFF: Enable Bluetooth to pair the hanging scale.');
		}

		this.manager.startDeviceScan(
			[BLE_SCALE_SERVICE_UUID],
			{ allowDuplicates: false },
			(error, device) => {
				if (error) {
					this.status = 'error';
					return;
				}
				if (!device) return;

				onDevice({
					id: device.id,
					name: device.name ?? device.localName ?? 'BLE Scale',
					rssi: device.rssi
				});
			}
		);
	}

	stopScan(): void {
		this.manager.stopDeviceScan();
		if (this.status === 'scanning') {
			this.status = 'disconnected';
		}
	}

	async connect(deviceId: string): Promise<void> {
		this.stopScan();
		this.status = 'connecting';

		const connected = await this.manager.connectToDevice(deviceId, { autoConnect: false });
		this.device = await connected.discoverAllServicesAndCharacteristics();
		this.status = 'connected';

		if (this.packetListener) {
			this.attachMonitor(this.packetListener);
		}
	}

	async disconnect(): Promise<void> {
		this.monitorSub?.remove();
		this.monitorSub = null;

		if (this.device) {
			await this.manager.cancelDeviceConnection(this.device.id);
		}

		this.device = null;
		this.status = 'disconnected';
	}

	async sendTare(): Promise<void> {
		if (!this.device) {
			throw new Error('SCALE_NOT_CONNECTED');
		}

		const payload = uint8ArrayToBase64(new Uint8Array([BLE_TARE_COMMAND_BYTE]));
		await this.device.writeCharacteristicWithResponseForService(
			BLE_SCALE_SERVICE_UUID,
			BLE_SCALE_CONTROL_UUID,
			payload
		);
	}

	subscribe(onPacket: (packet: Uint8Array) => void): () => void {
		this.packetListener = onPacket;
		if (this.device && this.status === 'connected') {
			this.attachMonitor(onPacket);
		}

		return () => {
			this.packetListener = null;
			this.monitorSub?.remove();
			this.monitorSub = null;
		};
	}

	private attachMonitor(onPacket: (packet: Uint8Array) => void): void {
		if (!this.device) return;

		this.monitorSub?.remove();
		this.monitorSub = this.device.monitorCharacteristicForService(
			BLE_SCALE_SERVICE_UUID,
			BLE_SCALE_TELEMETRY_UUID,
			(error, characteristic) => {
				if (error || !characteristic?.value) return;
				onPacket(base64ToUint8Array(characteristic.value));
			}
		);
	}
}
