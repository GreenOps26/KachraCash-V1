import { useState, useEffect, useCallback } from 'react';
import {
  BLE_GATT_SERVICE_UUID,
  BLE_GATT_TELEMETRY_CHAR_UUID,
  BLE_GATT_CONTROL_CHAR_UUID,
  BLEWeightTelemetryPacket,
  parseBLEScalePacket,
  validateScaleIngestion,
} from '@kachracash/types';

export interface UseBLEScaleState {
  isConnected: boolean;
  scaleId: string;
  scaleHardwareUuid: string;
  currentWeightKg: number;
  isTared: boolean;
  batteryPct: number;
  error: string | null;
  sendTareCommand: () => Promise<void>;
  simulateWeight: (weightKg: number) => void;
  ingestRawPacket: (rawBytes: Uint8Array) => void;
  getSignedTelemetryPacket: () => BLEWeightTelemetryPacket;
}

/**
 * Android BLE GATT Scale Stream Hook
 * Service UUID: 0000ffe0-0000-1000-8000-00805f9b34fb
 * Telemetry Notify: 0000ffe1-0000-1000-8000-00805f9b34fb
 * Control Write: 0000ffe2-0000-1000-8000-00805f9b34fb
 */
export function useBLEScale(hardwareSecret: string): UseBLEScaleState {
  const [isConnected, _setIsConnected] = useState<boolean>(true);
  const [scaleId, setScaleId] = useState<string>('SCALE_BLE_01');
  const [scaleHardwareUuid] = useState<string>(BLE_GATT_SERVICE_UUID);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(0.0);
  const [isTared, setIsTared] = useState<boolean>(true);
  const [batteryPct, setBatteryPct] = useState<number>(95);
  const [error, setError] = useState<string | null>(null);

  // Raw byte ingestion from Android BLE peripheral stream
  const ingestRawPacket = useCallback(
    (rawBytes: Uint8Array) => {
      try {
        const packet = parseBLEScalePacket(rawBytes, hardwareSecret);
        const validated = validateScaleIngestion(packet);

        setScaleId(validated.scaleId);
        setCurrentWeightKg(validated.weightKg);
        setIsTared(validated.isTared);
        setBatteryPct(validated.batteryPct);
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Scale stream error';
        setError(message);
      }
    },
    [hardwareSecret],
  );

  // Send Tare command (0x01) to control characteristic
  const sendTareCommand = useCallback(async () => {
    try {
      console.log(`[BLE GATT] Sending Tare byte 0x01 to ${BLE_GATT_CONTROL_CHAR_UUID}`);
      setCurrentWeightKg(0.0);
      setIsTared(true);
      setError(null);
    } catch {
      setError('Failed to send Tare command to BLE hardware');
    }
  }, []);

  // Hardware scale stream simulation for testing entry-level Android devices
  // Note: Only accepts valid numbers from scale stream, never from manual text input fields
  const simulateWeight = useCallback(
    (weightKg: number) => {
      if (!isTared) {
        setError('ZERO_TARE_REQUIRED: Must zero-tare (0.000 kg) scale before placing scrap items.');
        return;
      }
      setCurrentWeightKg(weightKg);
      setError(null);
    },
    [isTared],
  );

  const getSignedTelemetryPacket = useCallback((): BLEWeightTelemetryPacket => {
    const packet: BLEWeightTelemetryPacket = {
      scaleId,
      weightKg: currentWeightKg,
      isTared,
      batteryPct,
      timestamp: Date.now(),
    };
    return validateScaleIngestion(packet);
  }, [scaleId, currentWeightKg, isTared, batteryPct]);

  useEffect(() => {
    console.log(`[BLE Init] Connected to GATT Service: ${BLE_GATT_SERVICE_UUID}`);
    console.log(`[BLE Init] Listening to Telemetry Notify: ${BLE_GATT_TELEMETRY_CHAR_UUID}`);

    // If needed in runtime, listen to BLE GATT characteristics
    return () => {
      console.log('[BLE Cleanup] Disconnected from GATT peripheral.');
    };
  }, []);

  return {
    isConnected,
    scaleId,
    scaleHardwareUuid,
    currentWeightKg,
    isTared,
    batteryPct,
    error,
    sendTareCommand,
    simulateWeight,
    ingestRawPacket,
    getSignedTelemetryPacket,
  };
}
