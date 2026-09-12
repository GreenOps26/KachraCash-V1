import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseBLEScalePacket, validateScaleIngestion, type ParsedBleScalePacket } from '@kachracash/types';
import { createBleTransport, getBleTransportMode, getSimulatorTransport } from '../lib/ble/create-transport';
import type { BleConnectionStatus, BleDiscoveredDevice, BleScaleTransport } from '../lib/ble/types';

const HW_SECRET = process.env.EXPO_PUBLIC_BLE_HW_SECRET ?? 'KACHRACASH_BLE_HW_SECRET_KEY_2026';

export interface UseBleScaleResult {
	mode: 'simulator' | 'hardware';
	status: BleConnectionStatus;
	deviceName: string | null;
	reading: ParsedBleScalePacket | null;
	parseError: string | null;
	discoveredDevices: BleDiscoveredDevice[];
	isTared: boolean;
	canLockWeight: boolean;
	lockedWeightKg: number | null;
	lockError: string | null;
	startScan: () => Promise<void>;
	stopScan: () => void;
	connect: (deviceId: string) => Promise<void>;
	disconnect: () => Promise<void>;
	sendTare: () => Promise<void>;
	lockWeight: () => void;
	clearLock: () => void;
	simulateAddWeight: (grams: number) => void;
}

export function useBleScale(): UseBleScaleResult {
	const transportRef = useRef<BleScaleTransport | null>(null);
	const [status, setStatus] = useState<BleConnectionStatus>('disconnected');
	const [deviceName, setDeviceName] = useState<string | null>(null);
	const [reading, setReading] = useState<ParsedBleScalePacket | null>(null);
	const [parseError, setParseError] = useState<string | null>(null);
	const [discoveredDevices, setDiscoveredDevices] = useState<BleDiscoveredDevice[]>([]);
	const [lockedWeightKg, setLockedWeightKg] = useState<number | null>(null);
	const [lockError, setLockError] = useState<string | null>(null);

	const mode = getBleTransportMode();

	const ensureTransport = useCallback(() => {
		if (!transportRef.current) {
			transportRef.current = createBleTransport();
		}
		return transportRef.current;
	}, []);

	useEffect(() => {
		const transport = ensureTransport();

		const unsubscribe = transport.subscribe((packet) => {
			try {
				const parsed = parseBLEScalePacket(packet, HW_SECRET);
				setReading(parsed);
				setParseError(null);
			} catch (error) {
				setParseError(error instanceof Error ? error.message : 'Invalid BLE packet');
			}
		});

		return () => {
			unsubscribe();
			transport.disconnect().catch(() => undefined);
			transportRef.current = null;
		};
	}, [ensureTransport]);

	const syncStatus = useCallback(() => {
		const transport = transportRef.current;
		if (transport) setStatus(transport.getStatus());
	}, []);

	const startScan = useCallback(async () => {
		const transport = ensureTransport();
		setDiscoveredDevices([]);
		setParseError(null);
		setLockError(null);

		const seen = new Set<string>();
		await transport.startScan((device) => {
			if (seen.has(device.id)) return;
			seen.add(device.id);
			setDiscoveredDevices((current) => [...current, device]);
		});
		syncStatus();
	}, [ensureTransport, syncStatus]);

	const stopScan = useCallback(() => {
		transportRef.current?.stopScan();
		syncStatus();
	}, [syncStatus]);

	const connect = useCallback(
		async (deviceId: string) => {
			const transport = ensureTransport();
			const device = discoveredDevices.find((entry) => entry.id === deviceId);
			setDeviceName(device?.name ?? 'BLE Scale');
			setLockError(null);

			try {
				await transport.connect(deviceId);
				syncStatus();
			} catch (error) {
				setStatus('error');
				setParseError(error instanceof Error ? error.message : 'Connection failed');
			}
		},
		[discoveredDevices, ensureTransport, syncStatus]
	);

	const disconnect = useCallback(async () => {
		await transportRef.current?.disconnect();
		setDeviceName(null);
		setReading(null);
		setLockedWeightKg(null);
		syncStatus();
	}, [syncStatus]);

	const sendTare = useCallback(async () => {
		setLockError(null);
		try {
			await ensureTransport().sendTare();
		} catch (error) {
			setParseError(error instanceof Error ? error.message : 'Tare command failed');
		}
	}, [ensureTransport]);

	const lockWeight = useCallback(() => {
		if (!reading) return;

		try {
			const validated = validateScaleIngestion(reading);
			if (validated.weightKg <= 0) {
				setLockError('Place scrap on the scale before locking weight.');
				return;
			}
			setLockedWeightKg(validated.weightKg);
			setLockError(null);
		} catch (error) {
			setLockError(error instanceof Error ? error.message : 'Cannot lock weight');
		}
	}, [reading]);

	const clearLock = useCallback(() => {
		setLockedWeightKg(null);
		setLockError(null);
	}, []);

	const simulateAddWeight = useCallback(
		(grams: number) => {
			const sim = getSimulatorTransport(ensureTransport());
			sim?.simulateAddWeight(grams);
		},
		[ensureTransport]
	);

	const isTared = reading?.isTared === true && (reading?.weightKg ?? 0) < 0.05;
	const canLockWeight =
		lockedWeightKg === null &&
		status === 'connected' &&
		reading?.isTared === true &&
		(reading?.weightKg ?? 0) > 0;

	return useMemo(
		() => ({
			mode,
			status,
			deviceName,
			reading,
			parseError,
			discoveredDevices,
			isTared,
			canLockWeight,
			lockedWeightKg,
			lockError,
			startScan,
			stopScan,
			connect,
			disconnect,
			sendTare,
			lockWeight,
			clearLock,
			simulateAddWeight
		}),
		[
			mode,
			status,
			deviceName,
			reading,
			parseError,
			discoveredDevices,
			isTared,
			canLockWeight,
			lockedWeightKg,
			lockError,
			startScan,
			stopScan,
			connect,
			disconnect,
			sendTare,
			lockWeight,
			clearLock,
			simulateAddWeight
		]
	);
}

export function formatWeightKg(weightKg: number | null | undefined): string {
	if (weightKg == null || Number.isNaN(weightKg)) return '0.000';
	return weightKg.toFixed(3);
}
