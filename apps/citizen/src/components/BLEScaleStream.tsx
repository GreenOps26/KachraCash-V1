import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors.js';
import { calculatePayout } from '@kachracash/types';
import { apiClient, OrderStatusData } from '../services/apiClient.js';

interface BLEScaleStreamProps {
  scaleId: string;
  weightKg: number;
  isTared: boolean;
  batteryPct: number;
  unitRate: number;
  orderId?: string;
  pollIntervalMs?: number;
  onScaleUpdate?: (stream: NonNullable<OrderStatusData['scaleStream']>) => void;
}

export const BLEScaleStream: React.FC<BLEScaleStreamProps> = ({
  scaleId: initialScaleId,
  weightKg: initialWeightKg,
  isTared: initialIsTared,
  batteryPct: initialBatteryPct,
  unitRate: initialUnitRate,
  orderId,
  pollIntervalMs = 2000,
  onScaleUpdate,
}) => {
  const [scaleId, setScaleId] = useState<string>(initialScaleId);
  const [weightKg, setWeightKg] = useState<number>(initialWeightKg);
  const [isTared, setIsTared] = useState<boolean>(initialIsTared);
  const [batteryPct, setBatteryPct] = useState<number>(initialBatteryPct);
  const [unitRate, setUnitRate] = useState<number>(initialUnitRate);

  // Sync with props if updated externally
  useEffect(() => {
    setScaleId(initialScaleId);
    setWeightKg(initialWeightKg);
    setIsTared(initialIsTared);
    setBatteryPct(initialBatteryPct);
    setUnitRate(initialUnitRate);
  }, [initialScaleId, initialWeightKg, initialIsTared, initialBatteryPct, initialUnitRate]);

  // Polling order status stream if orderId is provided
  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.getOrderStatus(orderId);
        if (res.success && res.data.scaleStream) {
          const stream = res.data.scaleStream;
          setScaleId(stream.scaleId);
          setWeightKg(stream.weightKg);
          setIsTared(stream.isTared);
          setBatteryPct(stream.batteryPct);
          setUnitRate(stream.unitRate);
          if (onScaleUpdate) {
            onScaleUpdate(stream);
          }
        }
      } catch {
        // Continue quietly on transient network jitter
      }
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [orderId, pollIntervalMs, onScaleUpdate]);

  // Deterministic Floor Rate & 92% Payout Calculation
  const { grossAmount, platformFee, citizenPayout } = calculatePayout(weightKg, unitRate);

  return (
    <View testID="ble-scale-stream-container" style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.scaleName}>⚖️ LIVE BLE SCALE: {scaleId}</Text>
        <Text style={styles.battery}>🔋 {batteryPct}%</Text>
      </View>

      {/* Mandatory Zero-Tare Visual Check */}
      <View style={styles.tareRow}>
        {isTared ? (
          <View testID="tare-status-success" style={[styles.tareBadge, { backgroundColor: '#1F4D3C' }]}>
            <Text style={[styles.tareText, { color: '#C7FF3D' }]}>
              ✓ ZERO-TARED (0.000 kg BASELINE VERIFIED)
            </Text>
          </View>
        ) : (
          <View testID="tare-status-warning" style={[styles.tareBadge, { backgroundColor: colors.alertLight }]}>
            <Text style={[styles.tareText, { color: colors.alert }]}>
              ⚠️ TARE REQUIRED BEFORE WEIGHING (NO ZERO-TARE DETECTED)
            </Text>
          </View>
        )}
      </View>

      {/* Primary Weight Meter: Dark LCD Scale Mirror Panel */}
      <View style={styles.weightDisplay}>
        <Text testID="scale-weight-display" style={styles.weightNumber}>
          {weightKg.toFixed(3)}
        </Text>
        <Text style={styles.weightUnit}>kg</Text>
      </View>

      {/* Itemized Line-Item Math & 92% Citizen Payout */}
      <View style={styles.calcBox}>
        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>Commodity Floor Rate:</Text>
          <Text testID="unit-rate-display" style={styles.calcValue}>
            ₹{unitRate.toFixed(2)} / kg
          </Text>
        </View>

        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>Gross Value ({weightKg.toFixed(2)} kg × ₹{unitRate.toFixed(2)}):</Text>
          <Text testID="gross-amount-display" style={styles.calcValue}>
            ₹{grossAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>Platform Fee (8% Take-Rate):</Text>
          <Text testID="platform-fee-display" style={[styles.calcValue, { color: colors.alert }]}>
            -₹{platformFee.toFixed(2)}
          </Text>
        </View>

        <View style={[styles.calcRow, styles.payoutRow]}>
          <View>
            <Text style={styles.payoutLabel}>Net Instant UPI Payout (92%):</Text>
            <Text style={styles.payoutSub}>Zero doorstep cash • Direct Bank Transfer</Text>
          </View>
          <Text testID="citizen-payout-display" style={styles.payoutValue}>
            ₹{citizenPayout.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginVertical: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scaleName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  battery: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tareRow: {
    marginBottom: 12,
  },
  tareBadge: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  tareText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 8,
  },
  weightNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  weightUnit: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  calcBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  calcLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  payoutRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 6,
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.financial,
  },
  payoutSub: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  payoutValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.financial,
  },
});
