import type { BleScaleTransport } from './types';
import { SimulatorTransport } from './simulator-transport';

export type BleTransportMode = 'simulator' | 'hardware';

export function getBleTransportMode(): BleTransportMode {
	const mode = process.env.EXPO_PUBLIC_BLE_MODE;
	return mode === 'hardware' ? 'hardware' : 'simulator';
}

export function createBleTransport(): BleScaleTransport {
	if (getBleTransportMode() === 'hardware') {
		try {
			const { BleManager } = require('react-native-ble-plx') as typeof import('react-native-ble-plx');
			const { BlePlxTransport } = require('./ble-plx-transport') as typeof import('./ble-plx-transport');
			return new BlePlxTransport(new BleManager());
		} catch {
			throw new Error(
				'BLE_NATIVE_UNAVAILABLE: Hardware mode needs an Expo dev build with react-native-ble-plx. Use EXPO_PUBLIC_BLE_MODE=simulator for Expo Go.'
			);
		}
	}

	return new SimulatorTransport();
}

export function getSimulatorTransport(transport: BleScaleTransport): SimulatorTransport | null {
	return transport instanceof SimulatorTransport ? transport : null;
}
