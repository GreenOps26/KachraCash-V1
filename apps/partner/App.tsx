import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { partnerTheme } from './src/theme/partnerTheme.js';
import { SemanticButton } from './src/components/SemanticButton.js';
import { BleScaleReader } from './src/components/BleScaleReader.js';
import { OtpKeypad } from './src/components/OtpKeypad.js';
import { SahaayakEmergencyFab } from './src/components/SahaayakEmergencyFab.js';
import { useBLEScale } from './src/hooks/useBLEScale.js';
import { speakAssamesePrompt } from './src/audio/assamesePrompts.js';
import { partnerApi, VerifyOtpResult } from './src/services/partnerApi.js';
import { offlineQueue } from './src/services/offlineQueue.js';

type PartnerStep = 'DISPATCH' | 'NAVIGATION' | 'WEIGHING' | 'OTP' | 'COMPLETED';

interface ActivePickupOrder {
  id: string;
  citizenName: string;
  phoneNumber: string;
  wardName: string;
  address: string;
  visualTier: string;
  commoditySku: string;
  commodityName: string;
  unitRate: number;
  timeSlot: string;
  distanceMeters: number;
}

const DEFAULT_COLLECTOR_ID = 'col_pranjal_saikia_01';

const INITIAL_ORDER: ActivePickupOrder = {
  id: 'REQ_BELTOLA_28_001',
  citizenName: 'Jatin Baruah (যতীন বৰুৱা)',
  phoneNumber: '+919864012345',
  wardName: 'Beltola, Ward 28',
  address: 'House #18, Near Beltola Tiniali, Guwahati',
  visualTier: 'SOFT_FILMS',
  commoditySku: 'CARDBOARD_OCC',
  commodityName: 'Old Corrugated Cardboard (ভঙা কাৰ্ডব’ৰ্ড)',
  unitRate: 14.0,
  timeSlot: '10:00 AM – 12:00 PM',
  distanceMeters: 137,
};

export default function App() {
  const [step, setStep] = useState<PartnerStep>('DISPATCH');
  const [floatBalance, setFloatBalance] = useState<number>(3500.0);
  const [currentOrder, setCurrentOrder] = useState<ActivePickupOrder>(INITIAL_ORDER);
  const [lockedWeight, setLockedWeight] = useState<number>(14.5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [settlementResult, setSettlementResult] = useState<VerifyOtpResult | null>(null);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);
  const [showTopupModal, setShowTopupModal] = useState<boolean>(false);
  const [isTopupLoading, setIsTopupLoading] = useState<boolean>(false);

  // Initialize Hardware BLE Scale hook with anti-tamper validation
  const scale = useBLEScale('KACHRACASH_BLE_HW_SECRET_KEY_2026');

  // Refresh pending offline transactions count from local SQLite queue
  const refreshOfflineCount = useCallback(async () => {
    const count = await offlineQueue.countPending();
    setPendingOfflineCount(count);
  }, []);

  useEffect(() => {
    refreshOfflineCount();
  }, [refreshOfflineCount]);

  // Trigger colloquial Assamese audio prompts on operational state transitions
  useEffect(() => {
    if (step === 'DISPATCH') {
      speakAssamesePrompt('dispatch');
    } else if (step === 'NAVIGATION') {
      speakAssamesePrompt('navigation');
    } else if (step === 'WEIGHING') {
      if (!scale.isTared) {
        speakAssamesePrompt('tarePending');
      } else {
        speakAssamesePrompt('weighing', scale.currentWeightKg > 0 ? scale.currentWeightKg : 14.5);
      }
    }
  }, [step, scale.isTared, scale.currentWeightKg]);

  // Dispatch Matching: Fetch pending pickup from backend PostGIS matching engine
  const handleFetchNearbyDispatch = async () => {
    setIsSubmitting(true);
    const res = await partnerApi.matchDispatch(DEFAULT_COLLECTOR_ID, 1500);
    setIsSubmitting(false);

    if (res.success && res.data) {
      setCurrentOrder({
        ...INITIAL_ORDER,
        id: res.data.requestId,
        wardName: `${res.data.wardName}, Ward Active`,
        visualTier: res.data.visualTier,
        distanceMeters: res.data.distanceMeters,
      });
      speakAssamesePrompt('dispatch');
    } else {
      Alert.alert(
        'অনলাইন সংগ্ৰহ (DISPATCH)',
        res.message || 'No pending pickups within 1.5 km radius. Current order maintained.',
      );
    }
  };

  // Step 3 -> Step 4: Lock verified weight from BLE scale stream
  const handleLockWeight = () => {
    const finalWeight = scale.currentWeightKg > 0 ? scale.currentWeightKg : 14.5;
    setLockedWeight(finalWeight);
    setStep('OTP');
  };

  // Step 4: Verify citizen OTP and execute atomic settlement (or queue offline on network drop)
  const handleVerifyOtp = async (otpCode: string) => {
    setIsSubmitting(true);
    setOtpError(null);

    const grossScrap = Math.round(lockedWeight * currentOrder.unitRate * 100) / 100;
    const estimatedPlatformFee = Math.round(grossScrap * 0.08 * 100) / 100;
    const estimatedDebit = Math.round((grossScrap + estimatedPlatformFee) * 100) / 100;

    const res = await partnerApi.verifyOtp({
      requestId: currentOrder.id,
      collectorId: DEFAULT_COLLECTOR_ID,
      otp: otpCode,
      items: [
        {
          categoryId: 'c0a80101-0000-0000-0000-000000000001',
          weightKg: lockedWeight,
          unitRate: currentOrder.unitRate,
          scaleHardwareId: scale.scaleId,
        },
      ],
    });

    setIsSubmitting(false);

    if (!res.success) {
      setOtpError(res.error || 'OTP verification failed. Check code with citizen.');
      return;
    }

    setSettlementResult(res);

    // Update collector floating wallet balance display
    const debitAmount = res.data?.totalCollectorDebit || estimatedDebit;
    setFloatBalance((prev) => Math.max(0, Math.round((prev - debitAmount) * 100) / 100));

    // Handle offline queue vs instant online confirmation
    if (res.isOfflineQueued) {
      await refreshOfflineCount();
      speakAssamesePrompt('offlineQueued');
    } else {
      const payout = res.data?.citizenPayout || grossScrap;
      const profit = res.data?.platformFee || estimatedPlatformFee;
      speakAssamesePrompt('settlement', payout, profit);
    }

    setStep('COMPLETED');
  };

  // Mid-Route Float Topup via payment gateway
  const handleTopupWallet = async (amount: number) => {
    setIsTopupLoading(true);
    const idempotencyKey = `TOPUP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await partnerApi.topupWallet(
      {
        amount,
        paymentGatewayRef: `UPI_TOPUP_${Date.now()}`,
        idempotencyKey,
      },
      DEFAULT_COLLECTOR_ID,
    );
    setIsTopupLoading(false);

    if (res.success) {
      setFloatBalance((prev) => prev + amount);
      setShowTopupModal(false);
      Alert.alert('ৱালেট টপ-আপ (TOPUP SUCCESS)', `₹${amount.toFixed(2)} credited to your floating balance.`);
    } else {
      Alert.alert('টপ-আপ ব্যৰ্থ (TOPUP FAILED)', res.error || 'Payment gateway unreachable.');
    }
  };

  // Offline Sync: Process local SQLite queued transactions when data restores
  const handleSyncOffline = async () => {
    setIsSubmitting(true);
    const result = await partnerApi.syncOfflineQueue();
    setIsSubmitting(false);
    await refreshOfflineCount();

    if (result.synced > 0) {
      speakAssamesePrompt('syncSuccess', result.synced);
      Alert.alert(
        'ছিংক সম্পূৰ্ণ (SYNC SUCCESS)',
        `${result.synced} offline transaction(s) synced with server. Float balances reconciled.`,
      );
    } else if (result.failed > 0) {
      Alert.alert('ছিংক ব্যৰ্থ (SYNC PENDING)', 'Network server unavailable. Transactions remain saved locally.');
    } else {
      Alert.alert('ছিংক (SYNC)', 'All transactions are up to date.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Top Bar: Float Balance Monitor & Guwahati Municipal Ward Tag */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>KachraCash Partner</Text>
          <Text style={styles.subtitle}>কচৰা ক্যাশ সংগ্ৰাহক • Guwahati Hub</Text>
        </View>

        <View style={styles.headerActions}>
          {/* Float Balance Pill with Topup Trigger */}
          <View style={[styles.floatPill, floatBalance < 2000 && { borderColor: partnerTheme.colors.alert }]}>
            <Text style={styles.floatLabel}>ৱালেট জমা (FLOAT):</Text>
            <Text style={[styles.floatValue, floatBalance < 2000 && { color: partnerTheme.colors.alert }]}>
              ₹{floatBalance.toFixed(0)}
            </Text>
            {floatBalance < 2000 ? (
              <Text style={{ fontSize: 9, fontWeight: '800', color: partnerTheme.colors.alert, marginTop: 1 }}>
                ⚠️ কম ফ্ল’ট: নূন্যতম ₹২,০০০ প্ৰয়োজন
              </Text>
            ) : null}
            <Text
              style={styles.topupLink}
              onPress={() => setShowTopupModal(true)}
              accessibilityRole="button"
            >
              + TOPUP
            </Text>
          </View>
        </View>
      </View>

      {/* Persistent Offline Transactions Sync Alert Banner */}
      {pendingOfflineCount > 0 && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            📶 {pendingOfflineCount} OFFLINE TRANSACTION(S) QUEUED IN SQLITE
          </Text>
          <Text
            style={styles.syncBtnText}
            onPress={handleSyncOffline}
            accessibilityRole="button"
          >
            ছিংক কৰক (SYNC NOW)
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ==================================================================== */}
        {/* Step 1: DISPATCH - Zero-Text High-Contrast Order Acceptance         */}
        {/* ==================================================================== */}
        {step === 'DISPATCH' && (
          <View style={styles.stepContainer}>
            <View style={styles.card}>
              <View style={styles.cardBadgeRow}>
                <Text style={styles.cardHeader}>নতুন অনুৰোধ (NEW PICKUP)</Text>
                <Text style={styles.distanceBadge}>📍 {currentOrder.distanceMeters}m away</Text>
              </View>
              <Text style={styles.address}>{currentOrder.address}</Text>
              <Text style={styles.ward}>{currentOrder.wardName}</Text>
              <Text style={styles.detail}>Time Slot: {currentOrder.timeSlot}</Text>
              <Text style={styles.commodityHighlight}>
                📦 {currentOrder.commodityName} (₹{currentOrder.unitRate.toFixed(2)}/kg)
              </Text>
            </View>

            {/* Semantic Accept Button: Emerald Green (#059669) */}
            <SemanticButton
              variant="affirmation"
              label="গ্ৰহণ কৰক (ACCEPT PICKUP)"
              sublabel="Tap to lock pickup and start navigation"
              icon="✓"
              onPress={() => setStep('NAVIGATION')}
            />

            {/* Semantic Decline Button: Crimson Red (#DC2626) */}
            <SemanticButton
              variant="alert"
              label="প্ৰত্যাখ্যান (DECLINE)"
              sublabel="Pass request to next nearest collector"
              icon="✕"
              onPress={handleFetchNearbyDispatch}
              loading={isSubmitting}
            />

            {/* Financial Refresh Button: Royal Blue (#1D4ED8) */}
            <SemanticButton
              variant="financial"
              label="নতুন অনুৰোধ বিচৰা (FIND NEARBY)"
              sublabel="PostGIS 1.5 km Spatial Search"
              icon="🔄"
              onPress={handleFetchNearbyDispatch}
              loading={isSubmitting}
            />
          </View>
        )}

        {/* ==================================================================== */}
        {/* Step 2: NAVIGATION - Transit State with Telephony & Arrived Actions   */}
        {/* ==================================================================== */}
        {step === 'NAVIGATION' && (
          <View style={styles.stepContainer}>
            <View style={[styles.card, { borderColor: partnerTheme.colors.caution }]}>
              <Text style={[styles.cardHeader, { color: partnerTheme.colors.caution }]}>
                গ্ৰাহকৰ দিশে অগ্ৰসৰ (EN-ROUTE / IN TRANSIT)
              </Text>
              <Text style={styles.address}>{currentOrder.address}</Text>
              <Text style={styles.detail}>Customer: {currentOrder.citizenName}</Text>
              <Text style={styles.detail}>Proximity: {currentOrder.distanceMeters}m (Within 500m geofence)</Text>
              <Text style={styles.tierPill}>SLA TARGET: ARRIVE WITHIN 15 MIN</Text>
            </View>

            {/* Semantic Telephony / Masked Call: Royal Blue (#1D4ED8) */}
            <SemanticButton
              variant="financial"
              label="গ্ৰাহকলৈ ফোন কৰক (MASKED CALL)"
              sublabel="Connect securely via Cloud Telephony"
              icon="📞"
              onPress={() => {
                Alert.alert(
                  'টেলিফনী যোগাযোগ (CALL CITIZEN)',
                  `Dialing masked bridge for ${currentOrder.citizenName}...`,
                );
              }}
            />

            {/* Semantic Arrived Confirmation: Emerald Green (#059669) */}
            <SemanticButton
              variant="affirmation"
              label="মই উপস্থিত হৈছোঁ (ARRIVED AT DOORSTEP)"
              sublabel="Tap when parked at citizen's house"
              icon="📍"
              onPress={() => {
                scale.sendTareCommand();
                setStep('WEIGHING');
              }}
            />
          </View>
        )}

        {/* ==================================================================== */}
        {/* Step 3: WEIGHING - BLE Scale Stream & Anti-Tamper Zero-Tare Check    */}
        {/* ==================================================================== */}
        {step === 'WEIGHING' && (
          <View style={styles.stepContainer}>
            <BleScaleReader
              scaleId={scale.scaleId}
              scaleHardwareUuid={scale.scaleHardwareUuid}
              weightKg={scale.currentWeightKg > 0 ? scale.currentWeightKg : 14.5}
              isTared={scale.isTared}
              batteryPct={scale.batteryPct}
              commodityName={currentOrder.commodityName}
              unitRate={currentOrder.unitRate}
              onTare={() => scale.sendTareCommand()}
              onLockWeight={handleLockWeight}
              onSimulateWeight={(kg) => scale.simulateWeight(kg)}
            />
          </View>
        )}

        {/* ==================================================================== */}
        {/* Step 4: OTP KEYPAD - Citizen 4-Digit Doorstep Settlement Verification*/}
        {/* ==================================================================== */}
        {step === 'OTP' && (
          <View style={styles.stepContainer}>
            <OtpKeypad
              onOtpComplete={handleVerifyOtp}
              isLoading={isSubmitting}
              errorMessage={otpError}
              summary={{
                commodityName: currentOrder.commodityName,
                weightKg: lockedWeight,
                unitRate: currentOrder.unitRate,
                grossAmount: Math.round(lockedWeight * currentOrder.unitRate * 100) / 100,
              }}
            />
          </View>
        )}

        {/* ==================================================================== */}
        {/* Step 5: COMPLETED - Margin Credit Confirmation & Next Job Loop       */}
        {/* ==================================================================== */}
        {step === 'COMPLETED' && (
          <View style={styles.stepContainer}>
            <View style={[styles.card, { borderColor: partnerTheme.colors.affirmation }]}>
              <Text style={[styles.cardHeader, { color: partnerTheme.colors.affirmation }]}>
                ✓ কাৰ্য্য সম্পন্ন (SETTLEMENT COMPLETE)
              </Text>
              <Text style={styles.address}>
                {settlementResult?.isOfflineQueued
                  ? '📶 Offline Queue: Signed & Saved to SQLite'
                  : '⚡ Instant UPI Disbursement via Bank Rails: SUCCESS'}
              </Text>

              <View style={styles.breakdownBox}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>গ্ৰাহকৰ মুঠ ধন (Citizen Payout):</Text>
                  <Text style={styles.breakdownVal}>
                    ₹{(settlementResult?.data?.citizenPayout || (lockedWeight * currentOrder.unitRate)).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>সংগ্ৰাহকৰ লাভ (8% Profit Margin):</Text>
                  <Text style={[styles.breakdownVal, { color: partnerTheme.colors.affirmation }]}>
                    +₹{(settlementResult?.data?.platformFee || (lockedWeight * currentOrder.unitRate * 0.08)).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>মুঠ ৱালেট কৰ্তন (Float Debited):</Text>
                  <Text style={styles.breakdownVal}>
                    -₹{(settlementResult?.data?.totalCollectorDebit || (lockedWeight * currentOrder.unitRate * 1.08)).toFixed(2)}
                  </Text>
                </View>
              </View>

              {settlementResult?.isOfflineQueued && (
                <View style={styles.offlineNotice}>
                  <Text style={styles.offlineNoticeText}>
                    📝 Offline Ref: {settlementResult.queueId}
                  </Text>
                  <Text style={styles.offlineNoticeSubtext}>
                    Payload cryptographically signed with BLE scale key. Auto-syncs on cellular reconnect.
                  </Text>
                </View>
              )}
            </View>

            {/* Semantic Next Job Button: Emerald Green (#059669) */}
            <SemanticButton
              variant="affirmation"
              label="পৰৱৰ্তী কামলৈ যাওক (NEXT PICKUP)"
              sublabel="Return to Guwahati Dispatch Radar"
              icon="🚀"
              onPress={() => {
                scale.sendTareCommand();
                setSettlementResult(null);
                setStep('DISPATCH');
              }}
            />
          </View>
        )}
      </ScrollView>

      {/* Mid-Route Float Balance Topup Modal */}
      <Modal visible={showTopupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>ৱালেট জমা টপ-আপ (FLOAT TOPUP)</Text>
            <Text style={styles.modalSubtitle}>
              Ensure balance stays &gt;= ₹2,000 to receive auto-dispatches.
            </Text>

            <SemanticButton
              variant="financial"
              label="+ ₹1,000 TOPUP (UPI)"
              icon="💳"
              loading={isTopupLoading}
              onPress={() => handleTopupWallet(1000)}
            />

            <SemanticButton
              variant="financial"
              label="+ ₹2,000 TOPUP (UPI)"
              icon="💳"
              loading={isTopupLoading}
              onPress={() => handleTopupWallet(2000)}
            />

            <SemanticButton
              variant="alert"
              label="বাতিল কৰক (CANCEL)"
              icon="✕"
              onPress={() => setShowTopupModal(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Persistent Emergency Sahaayak SOS Button (3-Second Continuous Hold) */}
      <SahaayakEmergencyFab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: partnerTheme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: partnerTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: partnerTheme.colors.border,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: partnerTheme.colors.textMuted,
  },
  floatPill: {
    backgroundColor: '#143D2B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: '#22C55E',
    alignItems: 'flex-end',
  },
  floatLabel: {
    fontSize: 9,
    color: '#A7F3D0',
    fontWeight: '700',
  },
  floatValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4ADE80',
  },
  topupLink: {
    fontSize: 10,
    color: '#86EFAC',
    fontWeight: '900',
    marginTop: 2,
  },
  offlineBanner: {
    backgroundColor: '#b45309',
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineBannerText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
  },
  syncBtnText: {
    backgroundColor: '#000000',
    color: '#fef3c7',
    fontSize: 11,
    fontWeight: '900',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  scroll: {
    padding: 16,
    paddingBottom: 110,
  },
  stepContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#103322',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#1F573C',
  },
  cardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  distanceBadge: {
    backgroundColor: partnerTheme.colors.surfaceElevated,
    color: partnerTheme.colors.caution,
    fontSize: 12,
    fontWeight: '800',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  address: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  ward: {
    fontSize: 13,
    fontWeight: '700',
    color: partnerTheme.colors.caution,
    marginBottom: 6,
  },
  detail: {
    fontSize: 14,
    color: partnerTheme.colors.textMuted,
    marginBottom: 4,
  },
  commodityHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    backgroundColor: partnerTheme.colors.surfaceElevated,
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  tierPill: {
    alignSelf: 'flex-start',
    backgroundColor: partnerTheme.colors.surfaceElevated,
    color: partnerTheme.colors.caution,
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  breakdownBox: {
    backgroundColor: partnerTheme.colors.surfaceElevated,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 13,
    color: partnerTheme.colors.textMuted,
    fontWeight: '600',
  },
  breakdownVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  offlineNotice: {
    backgroundColor: '#374151',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  offlineNoticeText: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '800',
  },
  offlineNoticeSubtext: {
    color: '#d1d5db',
    fontSize: 10,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000bb',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: partnerTheme.colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: partnerTheme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: partnerTheme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
});
