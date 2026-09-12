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
import { CollectorStatusHeader } from './src/components/CollectorStatusHeader.js';
import { DispatchCard } from './src/components/DispatchCard.js';
import { WaypointTransit } from './src/components/WaypointTransit.js';
import { BleScaleReader } from './src/components/BleScaleReader.js';
import { OtpKeypad } from './src/components/OtpKeypad.js';
import { SahaayakEmergencyFab } from './src/components/SahaayakEmergencyFab.js';
import { SemanticButton } from './src/components/SemanticButton.js';
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
  locationText: string;
  visualTier: string;
  commoditySku: string;
  commodityName: string;
  unitRate: number;
  timeSlot: string;
  distanceMeters: number;
}

const DEFAULT_COLLECTOR_ID = 'col_babul_ali_01';

const INITIAL_ORDER: ActivePickupOrder = {
  id: 'REQ_JAYANAGAR_24_001',
  citizenName: 'Dr. Ananya Bordoloi',
  phoneNumber: '+919864012345',
  wardName: 'Jayanagar, Ward 24',
  address: 'House #42, Jayanagar Bye-Lane 3, Guwahati',
  locationText: 'Jayanagar Bye-Lane 3',
  visualTier: 'SOFT_FILMS',
  commoditySku: 'CARDBOARD_OCC',
  commodityName: 'Old Corrugated Cardboard (ভঙা কাৰ্ডব’ৰ্ড)',
  unitRate: 14.0,
  timeSlot: '02:00 PM – 04:00 PM',
  distanceMeters: 185,
};

export default function App() {
  const [step, setStep] = useState<PartnerStep>('DISPATCH');
  const [floatBalance, setFloatBalance] = useState<number>(2450.0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
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

  // Audio prompt on step transitions
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
        wardName: `${res.data.wardName}, Ward 24`,
        visualTier: res.data.visualTier,
        distanceMeters: res.data.distanceMeters,
      });
      speakAssamesePrompt('dispatch');
    } else {
      Alert.alert(
        'অনলাইন সংগ্ৰহ (DISPATCH)',
        res.message || 'No closer pickups within 1.5 km radius. Current order maintained.',
      );
    }
  };

  // Step 2 -> Step 3: Arrival at customer gate
  const handleGateArrival = () => {
    scale.sendTareCommand();
    setStep('WEIGHING');
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

    // Update collector floating wallet balance display:
    // e.g., ₹2,450.00 - ₹219.24 = ₹2,230.76
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
      speakAssamesePrompt('otpSuccess', profit);
    }

    setStep('COMPLETED');
  };

  // Mid-Route Float Topup via UPI payment gateway
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

  // Offline Sync: Process local SQLite queued transactions when network reconnects
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

  const grossAmount = Math.round(lockedWeight * currentOrder.unitRate * 100) / 100;
  const platformFee = Math.round(grossAmount * 0.08 * 100) / 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#07110E" />

      {/* Section A: Floating Wallet Header & Float-Gated Online Switch */}
      <CollectorStatusHeader
        floatBalance={floatBalance}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline((prev) => !prev)}
        onTopUpPress={() => setShowTopupModal(true)}
        pendingOfflineCount={pendingOfflineCount}
        onSyncPress={handleSyncOffline}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* State 1: DISPATCH - Zero-Text Dispatch Intake Alert */}
        {step === 'DISPATCH' && (
          <DispatchCard
            order={{
              id: currentOrder.id,
              citizenName: currentOrder.citizenName,
              distanceMeters: currentOrder.distanceMeters,
              locationText: currentOrder.locationText,
              visualTier: currentOrder.visualTier,
              commodityName: currentOrder.commodityName,
              unitRate: currentOrder.unitRate,
            }}
            onAccept={() => setStep('NAVIGATION')}
            onDecline={handleFetchNearbyDispatch}
            isSubmitting={isSubmitting}
          />
        )}

        {/* State 2: NAVIGATION - Waypoint Navigation & Customer Handshake */}
        {step === 'NAVIGATION' && (
          <WaypointTransit
            customerName={currentOrder.citizenName}
            addressText={currentOrder.address}
            distanceMeters={currentOrder.distanceMeters}
            navigationInstruction="↑ 150m straight, turn right at temple"
            onMaskedCall={() => {
              Alert.alert(
                'টেলিফনী যোগাযোগ (MASKED CALL)',
                `Dialing resident ${currentOrder.citizenName} through virtual privacy bridge (+91 98640-XXXXX)...`,
              );
            }}
            onGateArrival={handleGateArrival}
          />
        )}

        {/* State 3: WEIGHING - Hardware BLE Scale Telemetry Stream */}
        {step === 'WEIGHING' && (
          <BleScaleReader
            scaleId="AS-BLE-09"
            scaleHardwareUuid="0000ffe0-0000-1000-8000-00805f9b34fb"
            weightKg={scale.currentWeightKg > 0 ? scale.currentWeightKg : 14.5}
            isTared={scale.isTared}
            batteryPct={scale.batteryPct}
            commodityName={currentOrder.commodityName}
            unitRate={currentOrder.unitRate}
            onTare={() => scale.sendTareCommand()}
            onLockWeight={handleLockWeight}
            onSimulateWeight={(kg) => scale.simulateWeight(kg)}
          />
        )}

        {/* State 4: OTP KEYPAD - Doorstep Settlement & Tactile 4-Digit Dialpad */}
        {step === 'OTP' && (
          <OtpKeypad
            onOtpComplete={handleVerifyOtp}
            isLoading={isSubmitting}
            errorMessage={otpError}
            summary={{
              commodityName: currentOrder.commodityName,
              weightKg: lockedWeight,
              unitRate: currentOrder.unitRate,
              grossAmount,
              platformFee,
            }}
          />
        )}

        {/* State 5: COMPLETED - Full-Screen Settlement Confirmation & Margin Credit */}
        {step === 'COMPLETED' && (
          <OtpKeypad
            onOtpComplete={() => {}}
            isCompleted={true}
            summary={{
              commodityName: currentOrder.commodityName,
              weightKg: lockedWeight,
              unitRate: currentOrder.unitRate,
              grossAmount,
              platformFee,
            }}
            onNextJob={() => {
              scale.sendTareCommand();
              setSettlementResult(null);
              setStep('DISPATCH');
            }}
          />
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
  scroll: {
    padding: 14,
    paddingBottom: 110,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: partnerTheme.colors.surface,
    borderRadius: 20,
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
