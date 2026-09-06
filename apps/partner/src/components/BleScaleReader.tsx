import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { partnerTheme } from '../theme/partnerTheme.js';

interface BleScaleReaderProps {
  scaleId: string;
  scaleHardwareUuid?: string;
  weightKg: number;
  isTared: boolean;
  batteryPct: number;
  commodityName?: string;
  unitRate?: number;
  onTare: () => void;
  onLockWeight: () => void;
  onSimulateWeight?: (weightKg: number) => void;
}

export const BleScaleReader: React.FC<BleScaleReaderProps> = ({
  scaleId,
  scaleHardwareUuid = '0000ffe0-0000-1000-8000-00805f9b34fb',
  weightKg,
  isTared,
  batteryPct,
  commodityName = 'Old Corrugated Cardboard (ভঙা কাৰ্ডব’ৰ্ড)',
  unitRate = 14.0,
  onTare,
  onLockWeight,
  onSimulateWeight,
}) => {
  const estimatedGross = Math.round(weightKg * unitRate * 100) / 100;

  return (
    <View style={styles.container}>
      {/* Header with Paired Scale HW UUID & Battery */}
      <View style={styles.header}>
        <View>
          <Text style={styles.scaleTag}>🔵 BLE SCALE: {scaleId}</Text>
          <Text style={styles.uuidTag}>GATT UUID: {scaleHardwareUuid.substring(0, 18)}...</Text>
        </View>
        <View style={styles.batteryBadge}>
          <Text style={styles.battery}>🔋 {batteryPct}%</Text>
        </View>
      </View>

      {/* Commodity Header Banner */}
      <View style={styles.commodityBanner}>
        <Text style={styles.commodityName}>{commodityName}</Text>
        <Text style={styles.commodityRate}>Floor Rate: ₹{unitRate.toFixed(2)}/kg</Text>
      </View>

      {/* Strict Zero-Tare Warning / Confirmation Badge */}
      {!isTared ? (
        <View style={styles.tareAlert}>
          <Text style={styles.tareAlertText}>⚠️ ZERO TARE REQUIRED (শূন্য কৰক - 0.000 kg)</Text>
          <Text style={styles.tareSubtext}>Must register 0.000 kg tare before accepting scrap</Text>
        </View>
      ) : weightKg === 0 ? (
        <View style={styles.taredOk}>
          <Text style={styles.taredOkText}>✓ ZERO TARE CONFIRMED (0.000 kg)</Text>
          <Text style={styles.taredSubtext}>বস্তুটো স্কেলত তুলক (Place scrap on scale)</Text>
        </View>
      ) : (
        <View style={styles.readyOk}>
          <Text style={styles.readyOkText}>✓ ওজন গ্ৰহণযোগ্য (WEIGHT RECORDED)</Text>
        </View>
      )}

      {/* Digital Weight Readout - Strictly Hardware Telemetry Stream (No Text Inputs) */}
      <View style={styles.weightBox}>
        <View style={styles.weightRow}>
          <Text style={styles.weightValue}>{weightKg.toFixed(2)}</Text>
          <Text style={styles.unit}>kg</Text>
        </View>
        {weightKg > 0 && (
          <Text style={styles.payoutPreview}>
            গ্ৰাহকৰ মূল্য (Gross Value): ₹{estimatedGross.toFixed(2)}
          </Text>
        )}
      </View>

      {/* Test / Field Hardware Stream Simulation Controls (No editable text field) */}
      {onSimulateWeight && (
        <View style={styles.simContainer}>
          <Text style={styles.simHeader}>📡 BLE STREAM TELEMETRY INGESTION (HARDWARE):</Text>
          <View style={styles.simButtonsRow}>
            <TouchableOpacity
              style={styles.simBtn}
              onPress={() => onSimulateWeight(14.5)}
              activeOpacity={0.7}
            >
              <Text style={styles.simBtnText}>📦 +14.5 kg Cardboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.simBtn}
              onPress={() => onSimulateWeight(5.2)}
              activeOpacity={0.7}
            >
              <Text style={styles.simBtnText}>🍾 +5.2 kg PET</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Core Action Row: TARE (Amber) & LOCK (Emerald Green) */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.tareButton, { backgroundColor: partnerTheme.colors.caution }]}
          onPress={onTare}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>⚖️</Text>
          <Text style={styles.actionText}>TARE (শূন্য কৰক)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.lockButton,
            {
              backgroundColor:
                isTared && weightKg > 0
                  ? partnerTheme.colors.affirmation
                  : '#374151',
            },
          ]}
          onPress={onLockWeight}
          disabled={!isTared || weightKg <= 0}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>🔒</Text>
          <Text style={styles.actionText}>
            {isTared && weightKg > 0 ? 'LOCK WEIGHT (লক কৰক)' : 'TARE FIRST (প্ৰথমে শূন্য)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: partnerTheme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: partnerTheme.colors.border,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scaleTag: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  uuidTag: {
    color: partnerTheme.colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  batteryBadge: {
    backgroundColor: partnerTheme.colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  battery: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  commodityBanner: {
    backgroundColor: partnerTheme.colors.surfaceElevated,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: partnerTheme.colors.border,
  },
  commodityName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  commodityRate: {
    color: partnerTheme.colors.caution,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  tareAlert: {
    backgroundColor: '#7f1d1d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: partnerTheme.colors.alert,
  },
  tareAlertText: {
    color: '#fee2e2',
    fontSize: 13,
    fontWeight: '900',
  },
  tareSubtext: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  taredOk: {
    backgroundColor: '#064e3b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: partnerTheme.colors.affirmation,
  },
  taredOkText: {
    color: '#d1fae5',
    fontSize: 13,
    fontWeight: '900',
  },
  taredSubtext: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  readyOk: {
    backgroundColor: '#065f46',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  readyOkText: {
    color: '#ecfdf5',
    fontSize: 12,
    fontWeight: '800',
  },
  weightBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#000000',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: partnerTheme.colors.affirmation,
    marginBottom: 12,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weightValue: {
    color: '#ffffff',
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 1,
  },
  unit: {
    color: partnerTheme.colors.textMuted,
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 8,
  },
  payoutPreview: {
    color: partnerTheme.colors.affirmation,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  simContainer: {
    backgroundColor: partnerTheme.colors.surfaceElevated,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  simHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: partnerTheme.colors.textMuted,
    marginBottom: 6,
    textAlign: 'center',
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  simBtn: {
    backgroundColor: '#1f2937',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: partnerTheme.colors.border,
  },
  simBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tareButton: {
    flex: 1,
    minHeight: partnerTheme.touch.minHeight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  lockButton: {
    flex: 1.6,
    minHeight: partnerTheme.touch.minHeight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
});
