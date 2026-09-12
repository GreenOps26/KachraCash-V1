import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { HeaderWardBar } from './src/components/HeaderWardBar.js';
import { PickupRequestForm } from './src/components/PickupRequestForm.js';
import { BLEScaleStream } from './src/components/BLEScaleStream.js';
import { OtpRevealModal } from './src/components/OtpRevealModal.js';
import { EsgImpactSlip } from './src/components/EsgImpactSlip.js';
import { CreatedOrderData, OrderScaleStream } from './src/services/apiClient.js';
import { colors } from './src/theme/colors.js';
import { typography } from './src/theme/typography.js';

type OrderWorkflowStage = 'BOOKING' | 'WEIGHING' | 'OTP_REVEAL' | 'COMPLETED';

export default function App() {
  const [stage, setStage] = useState<OrderWorkflowStage>('BOOKING');
  const [selectedWard, setSelectedWard] = useState<string>('WARD_JAYANAGAR_24');
  const [activeOrder, setActiveOrder] = useState<CreatedOrderData | null>(null);

  // Live scale data mirrored during doorstep weighment
  const [liveScaleStream, setLiveScaleStream] = useState<OrderScaleStream>({
    scaleId: 'SCALE_01_GUW',
    weightKg: 14.5,
    isTared: true,
    batteryPct: 94,
    unitRate: 14.0,
  });

  const handleOrderCreated = (order: CreatedOrderData) => {
    setActiveOrder(order);
    if (order.wardId) {
      setSelectedWard(order.wardId);
    }
    setStage('WEIGHING');
  };

  const handleApproveWeighment = () => {
    setStage('OTP_REVEAL');
  };

  const handleOtpVerified = () => {
    setStage('COMPLETED');
  };

  const handleReset = () => {
    setActiveOrder(null);
    setStage('BOOKING');
  };

  // Payout math for final receipt
  const grossAmount = liveScaleStream.weightKg * liveScaleStream.unitRate;
  const netPayout = grossAmount * 0.92; // 92% net citizen payout (8% take-rate)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* 1. Sticky Header & Municipal Ward Guard Bar */}
      <HeaderWardBar
        selectedWard={selectedWard}
        onSelectWard={setSelectedWard}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stage 1: Quick-Commerce Booking */}
        {stage === 'BOOKING' && (
          <View style={styles.stageContainer}>
            <View style={styles.quickCommerceHero}>
              <Text style={styles.heroTitle}>Guwahati Circular Tech</Text>
              <Text style={styles.heroSubtitle}>
                Schedule doorstep pickup → Certified hardware weighment → 100% direct bank payout.
              </Text>
            </View>

            <PickupRequestForm
              onOrderCreated={handleOrderCreated}
              selectedWard={selectedWard}
              onSelectWard={setSelectedWard}
            />
          </View>
        )}

        {/* Stage 2: Doorstep BLE Scale Mirroring */}
        {stage === 'WEIGHING' && (
          <View style={styles.stageContainer}>
            <View style={styles.stageHeader}>
              <Text style={styles.stageBadge}>DOORSTEP WEIGHMENT STAGE</Text>
              <Text style={styles.stageTitle}>Certified Hardware Mirror</Text>
              <Text style={styles.stageSubtitle}>
                Consuming live BLE telemetry from collector load cell. Mandatory zero-tare verified.
              </Text>
            </View>

            <BLEScaleStream
              scaleId={liveScaleStream.scaleId}
              weightKg={liveScaleStream.weightKg}
              isTared={liveScaleStream.isTared}
              batteryPct={liveScaleStream.batteryPct}
              unitRate={liveScaleStream.unitRate}
              orderId={activeOrder?.orderId}
              onScaleUpdate={(s) => setLiveScaleStream(s)}
            />

            <TouchableOpacity
              testID="approve-weighment-button"
              style={styles.primaryActionButton}
              onPress={handleApproveWeighment}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>✓ APPROVE WEIGHMENT — REVEAL OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stage 3: Secure 4-Digit OTP Handshake */}
        {stage === 'OTP_REVEAL' && (
          <View style={styles.stageContainer}>
            <View style={styles.stageHeader}>
              <Text style={styles.stageBadge}>SECURITY VERIFICATION</Text>
              <Text style={styles.stageTitle}>Doorstep Settlement Handshake</Text>
              <Text style={styles.stageSubtitle}>
                Disburse your instant UPI transfer by sharing this one-time code with collector Babul Ali.
              </Text>
            </View>

            <OtpRevealModal
              otp={activeOrder?.otp || '7492'}
              orderId={activeOrder?.orderId || 'ORD_2026_GUW_01'}
              collectorName="Babul Ali"
              onOrderCompleted={handleOtpVerified}
            />

            <TouchableOpacity
              testID="simulate-collector-settle-button"
              style={[styles.primaryActionButton, { backgroundColor: colors.royalBlue }]}
              onPress={handleOtpVerified}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>⚡ SIMULATE COLLECTOR VERIFIED OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stage 4: Post-Settlement Digital Receipt & ESG Impact */}
        {stage === 'COMPLETED' && (
          <View style={styles.stageContainer}>
            <EsgImpactSlip
              receiptId={activeOrder?.orderId || 'KC-2026-99214'}
              wardName="Jayanagar (Ward 24)"
              netPayout={netPayout}
              weightKg={liveScaleStream.weightKg}
              categoryName="Old Corrugated Cardboard (OCC)"
              items={[
                {
                  categoryName: 'Old Corrugated Cardboard (OCC)',
                  weightKg: liveScaleStream.weightKg,
                  unitRate: liveScaleStream.unitRate,
                  grossAmount,
                },
              ]}
              onShareReceipt={() => {}}
            />

            <TouchableOpacity
              testID="book-another-pickup-button"
              style={[styles.primaryActionButton, styles.secondaryButton]}
              onPress={handleReset}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>← BOOK ANOTHER DOORSTEP PICKUP</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  stageContainer: {
    width: '100%',
  },
  quickCommerceHero: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.structuralLine,
    marginBottom: 8,
  },
  heroTitle: {
    ...typography.heading,
    fontSize: 17,
    color: colors.banyanGreen,
    fontWeight: '800',
  },
  heroSubtitle: {
    ...typography.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 3,
    lineHeight: 16,
  },
  stageHeader: {
    marginBottom: 8,
  },
  stageBadge: {
    ...typography.label,
    fontSize: 10,
    color: colors.banyanGreen,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  stageTitle: {
    ...typography.heading,
    fontSize: 18,
    color: colors.inkDeep,
    marginTop: 2,
  },
  stageSubtitle: {
    ...typography.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
    lineHeight: 16,
  },
  primaryActionButton: {
    backgroundColor: colors.banyanGreen,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: colors.banyanGreen,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  actionButtonText: {
    ...typography.bodyBold,
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.pureWhite,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.strongBorder,
    shadowOpacity: 0,
  },
  secondaryButtonText: {
    ...typography.bodyBold,
    fontSize: 13,
    color: colors.inkDeep,
    letterSpacing: 0.5,
  },
});
