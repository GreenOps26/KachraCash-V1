import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors.js';
import { typography } from '../theme/typography.js';
import { calculatePayout } from '@kachracash/types';
import { apiClient, OrderStatusData } from '../services/apiClient.js';

export interface CollectorInfo {
  name: string;
  rating: string;
  chassisPlate: string;
  avatarEmoji?: string;
  maskedPhone?: string;
}

export interface BLEScaleStreamProps {
  scaleId: string;
  weightKg: number;
  isTared: boolean;
  batteryPct: number;
  unitRate: number;
  orderId?: string;
  collector?: CollectorInfo;
  pollIntervalMs?: number;
  onScaleUpdate?: (stream: NonNullable<OrderStatusData['scaleStream']>) => void;
}

const DEFAULT_COLLECTOR: CollectorInfo = {
  name: 'Babul Ali',
  rating: '4.9 ★',
  chassisPlate: 'AS-01-QC-402',
  avatarEmoji: '👨🏽‍🌾',
  maskedPhone: '+91 94350-XXXXX',
};

export const BLEScaleStream: React.FC<BLEScaleStreamProps> = ({
  scaleId: initialScaleId,
  weightKg: initialWeightKg,
  isTared: initialIsTared,
  batteryPct: initialBatteryPct,
  unitRate: initialUnitRate,
  orderId,
  collector = DEFAULT_COLLECTOR,
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

  // Deterministic line math
  const { grossAmount, platformFee, citizenPayout } = calculatePayout(weightKg, unitRate);

  const handleMaskedCall = () => {
    Alert.alert(
      'Masked Telephony Bridge',
      `Connecting to collector ${collector.name} via privacy-preserving telephony proxy (${collector.maskedPhone}).`
    );
  };

  return (
    <View testID="ble-scale-stream-container" style={styles.container}>
      {/* 1. Active Collector Card */}
      <View style={styles.collectorCard}>
        <View style={styles.collectorAvatarBox}>
          <Text style={styles.collectorEmoji}>{collector.avatarEmoji || '👨🏽‍🌾'}</Text>
        </View>

        <View style={styles.collectorDetails}>
          <View style={styles.collectorNameRow}>
            <Text style={styles.collectorName}>{collector.name}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{collector.rating}</Text>
            </View>
          </View>

          <Text style={styles.chassisText}>
            Cart Chassis: <Text style={styles.chassisPlate}>{collector.chassisPlate}</Text>
          </Text>
        </View>

        <TouchableOpacity
          testID="masked-call-button"
          style={styles.callButton}
          onPress={handleMaskedCall}
          activeOpacity={0.8}
        >
          <Text style={styles.callButtonIcon}>📞</Text>
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Embedded Dark Telemetry Box (#172E24) */}
      <View style={styles.telemetryBox}>
        {/* Telemetry Header */}
        <View style={styles.telemetryHeader}>
          <View style={styles.statusRow}>
            <View style={styles.glowingDot} />
            <Text style={styles.connectionStatus}>● BLE Scale Paired</Text>
          </View>
          <Text style={styles.telemetryScaleId}>{scaleId} • 🔋 {batteryPct}%</Text>
        </View>

        {/* Mandatory Zero-Tare Badge */}
        <View style={styles.tareRow}>
          {isTared ? (
            <View
              testID="tare-status-success"
              style={[styles.tareBadge, styles.tareBadgeConfirmed]}
            >
              <Text style={styles.tareTextConfirmed}>
                ✓ ZERO-TARED (0.000 kg BASELINE CONFIRMED)
              </Text>
            </View>
          ) : (
            <View
              testID="tare-status-warning"
              style={[styles.tareBadge, styles.tareBadgeWarning]}
            >
              <Text style={styles.tareTextWarning}>
                ⚠️ Awaiting 0.000 kg Zero-Tare
              </Text>
            </View>
          )}
        </View>

        {/* Digital Readout (Telemetry Cyan #55F3CF) */}
        <View style={styles.weightDisplay}>
          <Text testID="scale-weight-display" style={styles.weightNumber}>
            {weightKg.toFixed(2)}
          </Text>
          <Text style={styles.weightUnit}>kg</Text>
        </View>

        {/* Line Calculation Math in Dark Box */}
        <View style={styles.telemetryMathBox}>
          <View style={styles.mathRow}>
            <Text style={styles.mathLabel}>Commodity Floor Rate:</Text>
            <Text testID="unit-rate-display" style={styles.mathValue}>
              ₹{unitRate.toFixed(2)} / kg
            </Text>
          </View>

          <View style={styles.mathRow}>
            <Text style={styles.mathLabel}>
              Gross ({weightKg.toFixed(2)} kg × ₹{unitRate.toFixed(2)}):
            </Text>
            <Text testID="gross-amount-display" style={styles.mathValue}>
              ₹{grossAmount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.mathRow}>
            <Text style={styles.mathLabel}>Platform Take-Rate (8%):</Text>
            <Text
              testID="platform-fee-display"
              style={[styles.mathValue, { color: '#FCA5A5' }]}
            >
              -₹{platformFee.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Net Citizen Payout Banner */}
        <View style={styles.payoutBanner}>
          <View>
            <Text style={styles.payoutTitle}>Net Citizen Payout (Zero deductions)</Text>
            <Text style={styles.payoutSubtitle}>Direct UPI bank transfer upon OTP handshake</Text>
          </View>
          <Text testID="citizen-payout-display" style={styles.payoutNumber}>
            ₹{citizenPayout.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  collectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.structuralLine,
    marginBottom: 10,
  },
  collectorAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.structuralLine,
  },
  collectorEmoji: {
    fontSize: 24,
  },
  collectorDetails: {
    flex: 1,
  },
  collectorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collectorName: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.inkDeep,
  },
  ratingBadge: {
    backgroundColor: colors.marigoldSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.marigold,
  },
  ratingText: {
    ...typography.bodyBold,
    fontSize: 10.5,
    color: colors.marigold,
  },
  chassisText: {
    ...typography.bodyMedium,
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
  chassisPlate: {
    fontWeight: '700',
    color: colors.inkDeep,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.royalBlueSoft,
    borderWidth: 1,
    borderColor: colors.royalBlue,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  callButtonIcon: {
    fontSize: 12,
  },
  callButtonText: {
    ...typography.bodyBold,
    fontSize: 11,
    color: colors.royalBlue,
  },
  telemetryBox: {
    backgroundColor: colors.telemetryDark,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#244738',
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glowingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.telemetryCyan,
    marginRight: 6,
  },
  connectionStatus: {
    ...typography.bodyBold,
    fontSize: 11,
    color: colors.telemetryCyan,
    letterSpacing: 0.4,
  },
  telemetryScaleId: {
    ...typography.telemetryMedium,
    fontSize: 11,
    color: '#9EC5B2',
  },
  tareRow: {
    marginBottom: 10,
  },
  tareBadge: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  tareBadgeConfirmed: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: colors.emeraldLight,
  },
  tareBadgeWarning: {
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  tareTextConfirmed: {
    ...typography.bodyBold,
    fontSize: 11,
    color: colors.telemetryCyan,
    letterSpacing: 0.4,
  },
  tareTextWarning: {
    ...typography.bodyBold,
    fontSize: 11,
    color: colors.amber,
    letterSpacing: 0.4,
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 10,
  },
  weightNumber: {
    ...typography.telemetryLarge,
    fontSize: 48,
    color: colors.telemetryCyan,
    fontWeight: '800',
  },
  weightUnit: {
    ...typography.heading,
    fontSize: 22,
    color: '#9EC5B2',
    marginLeft: 8,
  },
  telemetryMathBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  mathLabel: {
    ...typography.bodyMedium,
    fontSize: 11.5,
    color: '#B6D1C4',
  },
  mathValue: {
    ...typography.telemetryMedium,
    fontSize: 12,
    color: colors.pureWhite,
  },
  payoutBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 12,
    marginTop: 12,
  },
  payoutTitle: {
    ...typography.bodyBold,
    fontSize: 12,
    color: colors.pureWhite,
  },
  payoutSubtitle: {
    ...typography.bodyMedium,
    fontSize: 9.5,
    color: '#8BA99B',
    marginTop: 1,
  },
  payoutNumber: {
    ...typography.displayMedium,
    fontSize: 22,
    fontWeight: '800',
    color: colors.telemetryCyan,
  },
});
