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
import { PickupRequestForm } from './src/components/PickupRequestForm.js';
import { BLEScaleStream } from './src/components/BLEScaleStream.js';
import { OtpRevealModal } from './src/components/OtpRevealModal.js';
import { EsgImpactSlip } from './src/components/EsgImpactSlip.js';
import { CreatedOrderData, OrderScaleStream } from './src/services/apiClient.js';
import { colors } from './src/theme/colors.js';

type OrderWorkflowStage = 'BOOKING' | 'WEIGHING' | 'OTP_REVEAL' | 'COMPLETED';

export default function App() {
  const [stage, setStage] = useState<OrderWorkflowStage>('BOOKING');
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
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* App Header */}
      <View style={styles.navBar}>
        <View>
          <Text style={styles.brandTitle}>KachraCash</Text>
          <Text style={styles.brandSub}>কচৰা ক্যাশ • Guwahati Circular Tech</Text>
        </View>
        <View style={styles.wardPill}>
          <Text style={styles.wardText}>
            {activeOrder?.wardId ? `📍 ${activeOrder.wardId}` : '📍 Beltola / Guwahati'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stage 1: Quick-Commerce Booking */}
        {stage === 'BOOKING' && (
          <View>
            <View style={styles.banner}>
              <Text style={styles.bannerEmoji}>⚡</Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Schedule → Weigh Transparently → Get Paid Instantly</Text>
                <Text style={styles.bannerSubtitle}>
                  পঞ্জীয়ন কৰক → স্বচ্ছ ওজন → প্ৰত্যক্ষ UPI জমা • Guaranteed Floor Rates • Zero Bidding
                </Text>
              </View>
            </View>

            <PickupRequestForm onOrderCreated={handleOrderCreated} />
          </View>
        )}

        {/* Stage 2: Doorstep BLE Scale Mirroring */}
        {stage === 'WEIGHING' && (
          <View>
            <View style={styles.stageHeader}>
              <Text style={styles.stageTitle}>COLLECTOR AT DOORSTEP</Text>
              <Text style={styles.stageSubtitle}>
                Live BLE telemetry stream from collector's certified digital scale
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
              style={[styles.actionButton, { backgroundColor: colors.affirmation }]}
              onPress={handleApproveWeighment}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>✓ APPROVE WEIGHMENT — REVEAL OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stage 3: Secure OTP Handshake */}
        {stage === 'OTP_REVEAL' && (
          <View>
            <View style={styles.stageHeader}>
              <Text style={styles.stageTitle}>DOORSTEP SETTLEMENT HANDSHAKE</Text>
              <Text style={styles.stageSubtitle}>
                Collector must enter this OTP on their terminal to disburse your UPI payout
              </Text>
            </View>

            <OtpRevealModal
              otp={activeOrder?.otp || '4821'}
              orderId={activeOrder?.orderId || 'ORD_DEFAULT'}
              onOrderCompleted={handleOtpVerified}
            />

            <TouchableOpacity
              testID="simulate-collector-settle-button"
              style={[styles.actionButton, { backgroundColor: colors.financial }]}
              onPress={handleOtpVerified}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>⚡ SIMULATE COLLECTOR VERIFIED OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stage 4: Post-Settlement Digital Receipt & ESG Impact */}
        {stage === 'COMPLETED' && (
          <View>
            <EsgImpactSlip
              receiptId={activeOrder?.orderId || 'KC-2026-GUW'}
              wardName="Beltola (Ward 28)"
              netPayout={netPayout}
              weightKg={liveScaleStream.weightKg}
              categoryName="Old Corrugated Cardboard (কাৰ্ডব’ৰ্ড)"
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
              style={[styles.actionButton, { backgroundColor: colors.textPrimary }]}
              onPress={handleReset}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>← BOOK ANOTHER DOORSTEP PICKUP</Text>
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
    backgroundColor: colors.background,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#ffffff',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.affirmation,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  wardPill: {
    backgroundColor: colors.affirmationLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  wardText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.affirmation,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: colors.financialLight,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.financial,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  stageHeader: {
    marginBottom: 10,
  },
  stageTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.6,
  },
  stageSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
