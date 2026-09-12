import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { partnerTheme } from '../theme/partnerTheme.js';
import { speakAssamesePrompt } from '../audio/assamesePrompts.js';

export interface BleScaleReaderProps {
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
  scaleId = 'AS-BLE-09',
  scaleHardwareUuid = '0000ffe0-0000-1000-8000-00805f9b34fb',
  weightKg,
  isTared,
  batteryPct = 92,
  commodityName = 'Old Corrugated Cardboard (ভঙা কাৰ্ডব’ৰ্ড)',
  unitRate = 14.0,
  onTare,
  onLockWeight,
  onSimulateWeight,
}) => {
  const estimatedGross = Math.round(weightKg * unitRate * 100) / 100;

  // Automated voice telemetry announcement when weight stabilizes
  useEffect(() => {
    if (!isTared) {
      speakAssamesePrompt('tarePending');
    } else if (weightKg > 0) {
      speakAssamesePrompt('weighing', weightKg);
    }
  }, [isTared, weightKg]);

  return (
    <View testID="ble-scale-reader-container" style={styles.container}>
      {/* 1. Hardware Status Header: Glowing Cyan Bluetooth indicator */}
      <View style={styles.hardwareHeader}>
        <View style={styles.statusRow}>
          <View style={styles.glowingDot} />
          <Text style={styles.statusText}>
            ● Hanging Scale #{scaleId} Paired
          </Text>
        </View>
        <Text style={styles.batteryText}>🔋 {batteryPct}%</Text>
      </View>

      {/* GATT UUID Telemetry Header */}
      <View style={styles.gattHeaderRow}>
        <Text style={styles.gattUuid}>
          GATT: {scaleHardwareUuid.substring(0, 24)}...
        </Text>
        <Text style={styles.commodityLabel}>{commodityName}</Text>
      </View>

      {/* 2. Mandatory Zero-Tare Interlock */}
      {!isTared ? (
        <View testID="zero-tare-required-banner" style={styles.tareAlertBox}>
          <Text style={styles.tareAlertTitle}>
            ⚠️ SCALE MUST BE EMPTY (0.000 KG)
          </Text>
          <Text style={styles.tareAlertSubtext}>
            প্ৰথমে স্কেলটো শূন্য কৰক। সেউজীয়া লাইট নজ্বলালৈকে বস্তু নুতুলিব।
          </Text>
        </View>
      ) : weightKg === 0 ? (
        <View testID="zero-tare-confirmed-banner" style={styles.tareConfirmedBox}>
          <Text style={styles.tareConfirmedTitle}>
            ✓ ZERO-TARE CONFIRMED (0.000 KG)
          </Text>
          <Text style={styles.tareConfirmedSubtext}>
            স্কেলত বস্তু তুলক (Place scrap on load cell)
          </Text>
        </View>
      ) : (
        <View style={styles.weightLockedNotice}>
          <Text style={styles.weightLockedText}>
            ✓ MASS STABILIZED • GATT TELEMETRY STREAMING
          </Text>
        </View>
      )}

      {/* 3. Large Digital Readout: Black LCD Container (#030806) with Cyan Glowing Digits */}
      <View testID="digital-lcd-scale" style={styles.lcdContainer}>
        <View style={styles.lcdHeader}>
          <Text style={styles.lcdModel}>CERTIFIED LOAD CELL • 0–100 KG</Text>
          <Text style={styles.lcdFloorRate}>Floor Rate: ₹{unitRate.toFixed(2)}/kg</Text>
        </View>

        <View style={styles.lcdReadoutRow}>
          <Text testID="ble-mass-readout" style={styles.lcdDigits}>
            {weightKg.toFixed(2)}
          </Text>
          <Text style={styles.lcdUnit}>kg</Text>
        </View>

        {weightKg > 0 && (
          <View style={styles.lcdCalculation}>
            <Text style={styles.calcMathText}>
              {weightKg.toFixed(2)} kg × ₹{unitRate.toFixed(2)}/kg = ₹{estimatedGross.toFixed(2)}
            </Text>
            <Text style={styles.calcSubText}>গ্ৰাহকৰ মুঠ প্ৰদেয় (Gross Payout)</Text>
          </View>
        )}
      </View>

      {/* Hardware Telemetry Simulation Controls (Development & Field testing) */}
      {onSimulateWeight && (
        <View style={styles.simBox}>
          <Text style={styles.simLabel}>
            📡 BLE LOAD CELL BYTE SIMULATION (HARDWARE):
          </Text>
          <View style={styles.simButtonsRow}>
            <TouchableOpacity
              testID="sim-14-5-kg-btn"
              style={styles.simBtn}
              onPress={() => onSimulateWeight(14.5)}
              activeOpacity={0.7}
            >
              <Text style={styles.simBtnText}>📦 Stream 14.50 kg OCC</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="sim-5-2-kg-btn"
              style={styles.simBtn}
              onPress={() => onSimulateWeight(5.2)}
              activeOpacity={0.7}
            >
              <Text style={styles.simBtnText}>🍾 Stream 5.20 kg PET</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 4. Action Controls: TARE (Amber) & Full-width Emerald Green LOCK Button */}
      <View style={styles.controlsCol}>
        <TouchableOpacity
          testID="tare-scale-button"
          style={styles.tareBtn}
          onPress={onTare}
          activeOpacity={0.8}
        >
          <Text style={styles.tareIcon}>⚖️</Text>
          <Text style={styles.tareBtnText}>TARE (শূন্য কৰক 0.000 kg)</Text>
        </TouchableOpacity>

        {/* Primary Action: Emerald Green (#059669) LOCK Button */}
        {/* Strictly disabled until GATT payload emits verified 0.000 kg tare */}
        <TouchableOpacity
          testID="lock-weight-button"
          disabled={!isTared || weightKg <= 0}
          style={[
            styles.lockBtn,
            (!isTared || weightKg <= 0) && styles.lockBtnDisabled,
          ]}
          onPress={onLockWeight}
          activeOpacity={0.85}
        >
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockBtnText}>
            {isTared && weightKg > 0
              ? `🔒 লক কৰক (Lock ${weightKg.toFixed(2)} kg OCC)`
              : '🔒 লক কৰক (Awaiting Zero-Tare & Scrap)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: partnerTheme.colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: partnerTheme.colors.border,
    marginVertical: 6,
  },
  hardwareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glowingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: partnerTheme.colors.telemetryCyan,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '900',
    color: partnerTheme.colors.telemetryCyan,
    letterSpacing: 0.4,
  },
  batteryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  gattHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gattUuid: {
    fontFamily: partnerTheme.typography.fontMono,
    fontSize: 10,
    color: partnerTheme.colors.textMuted,
  },
  commodityLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: partnerTheme.colors.caution,
  },
  tareAlertBox: {
    backgroundColor: '#7f1d1d',
    borderWidth: 2,
    borderColor: partnerTheme.colors.alert,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  tareAlertTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#fee2e2',
    letterSpacing: 0.5,
  },
  tareAlertSubtext: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fca5a5',
    marginTop: 3,
    textAlign: 'center',
  },
  tareConfirmedBox: {
    backgroundColor: '#064e3b',
    borderWidth: 2,
    borderColor: partnerTheme.colors.affirmation,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  tareConfirmedTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#d1fae5',
    letterSpacing: 0.5,
  },
  tareConfirmedSubtext: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a7f3d0',
    marginTop: 2,
  },
  weightLockedNotice: {
    backgroundColor: '#065f46',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  weightLockedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ecfdf5',
  },
  lcdContainer: {
    backgroundColor: '#030806',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: partnerTheme.colors.telemetryCyan,
    marginBottom: 14,
  },
  lcdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  lcdModel: {
    fontFamily: partnerTheme.typography.fontMono,
    fontSize: 9.5,
    color: partnerTheme.colors.textMuted,
    fontWeight: '700',
  },
  lcdFloorRate: {
    fontSize: 11,
    fontWeight: '800',
    color: partnerTheme.colors.caution,
  },
  lcdReadoutRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  lcdDigits: {
    fontFamily: partnerTheme.typography.fontMono,
    fontSize: 48,
    fontWeight: '900',
    color: partnerTheme.colors.telemetryCyan,
    letterSpacing: -1,
  },
  lcdUnit: {
    fontSize: 24,
    fontWeight: '800',
    color: partnerTheme.colors.textMuted,
    marginLeft: 8,
  },
  lcdCalculation: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  calcMathText: {
    fontFamily: partnerTheme.typography.fontMono,
    fontSize: 13,
    fontWeight: '800',
    color: partnerTheme.colors.affirmation,
  },
  calcSubText: {
    fontSize: 10,
    color: partnerTheme.colors.textMuted,
    marginTop: 1,
  },
  simBox: {
    backgroundColor: partnerTheme.colors.surfaceElevated,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  simLabel: {
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
  controlsCol: {
    gap: 10,
  },
  tareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: partnerTheme.colors.caution,
    borderRadius: 14,
    minHeight: 56,
    paddingHorizontal: 16,
    gap: 8,
  },
  tareIcon: {
    fontSize: 20,
  },
  tareBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: partnerTheme.colors.affirmation,
    borderRadius: 14,
    minHeight: 64,
    paddingHorizontal: 16,
    gap: 8,
    elevation: 4,
  },
  lockBtnDisabled: {
    backgroundColor: '#374151',
    opacity: 0.6,
  },
  lockIcon: {
    fontSize: 20,
  },
  lockBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});
