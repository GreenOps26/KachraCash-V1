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
      <StatusBar barStyle="dark-content" backgroundColor="#f4f7f5" />

      {/* Donezo Style App Header */}
      <View style={styles.navBar}>
        <View>
          <Text style={styles.brandTitle}>KachraCash 🌿</Text>
          <Text style={styles.brandSub}>কচৰা ক্যাশ • Guwahati Circular Tech</Text>
        </View>
        <View style={styles.wardPill}>
          <Text style={styles.wardText}>
            {activeOrder?.wardId ? `📍 ${activeOrder.wardId}` : '📍 Beltola, Ward 28'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stage 1: Quick-Commerce Booking with Coinest Wallet & Quick Actions */}
        {stage === 'BOOKING' && (
          <View style={{ gap: 16 }}>
            {/* Coinest Inspired Green Wallet Card */}
            <View style={styles.ecoWalletCard}>
              <View style={styles.ecoCardTop}>
                <View>
                  <Text style={styles.ecoWalletLabel}>CITIZEN ECO-WALLET</Text>
                  <Text style={styles.ecoBalanceText}>₹1,420.50</Text>
                </View>
                <Text style={{ fontSize: 24 }}>🌱</Text>
              </View>

              <View style={styles.ecoCardBottom}>
                <View style={styles.greenCoinsPill}>
                  <Text style={styles.greenCoinsText}>⭐ 4,780 GreenCoins</Text>
                </View>
                <View style={styles.upiBadge}>
                  <Text style={styles.upiBadgeText}>✓ Instant UPI Active</Text>
                </View>
              </View>
            </View>

            {/* Donezo Quick Action Pills Row */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={styles.quickActionBtn} activeOpacity={0.8}>
                <Text style={styles.actionIcon}>📅</Text>
                <Text style={styles.actionText}>Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionBtn} activeOpacity={0.8}>
                <Text style={styles.actionIcon}>📷</Text>
                <Text style={styles.actionText}>Scan Scale</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionBtn} activeOpacity={0.8}>
                <Text style={styles.actionIcon}>🏷️</Text>
                <Text style={styles.actionText}>Floor Rates</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionBtn} activeOpacity={0.8}>
                <Text style={styles.actionIcon}>🌳</Text>
                <Text style={styles.actionText}>ESG Impact</Text>
              </TouchableOpacity>
            </View>

            {/* Banner */}
            <View style={styles.banner}>
              <Text style={styles.bannerEmoji}>⚡</Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Guaranteed Floor Rates • Zero Bidding</Text>
                <Text style={styles.bannerSubtitle}>
                  পঞ্জীয়ন কৰক → স্বচ্ছ ওজন → প্ৰত্যক্ষ UPI জমা
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
              style={[styles.actionButton, { backgroundColor: colors.forest }]}
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
              otp={activeOrder?.otp || '7492'}
              orderId={activeOrder?.orderId || 'ORD_DEFAULT'}
              onOrderCompleted={handleOtpVerified}
            />

            <TouchableOpacity
              testID="simulate-collector-settle-button"
              style={[styles.actionButton, { backgroundColor: colors.forest }]}
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
              style={[styles.actionButton, { backgroundColor: colors.forest }]}
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
    backgroundColor: '#F4F7F5',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EBE5',
    backgroundColor: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#143D2B',
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#62776C',
    letterSpacing: 0.2,
  },
  wardPill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  wardText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  ecoWalletCard: {
    backgroundColor: '#143D2B',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#143D2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  ecoCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ecoWalletLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.6,
  },
  ecoBalanceText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  ecoCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  greenCoinsPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  greenCoinsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#86EFAC',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5EBE5',
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#143D2B',
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  bannerEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
    lineHeight: 16,
  },
  stageHeader: {
    marginBottom: 10,
  },
  stageTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14241C',
    letterSpacing: 0.6,
  },
  stageSubtitle: {
    fontSize: 11,
    color: '#62776C',
    marginTop: 2,
  },
  actionButton: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: '#143D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
