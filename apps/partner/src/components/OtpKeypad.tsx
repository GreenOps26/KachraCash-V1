import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { partnerTheme } from '../theme/partnerTheme.js';
import { speakAssamesePrompt } from '../audio/assamesePrompts.js';

export interface ScrapSummary {
  commodityName: string;
  weightKg: number;
  unitRate: number;
  grossAmount: number;
  platformFee?: number;
}

export interface OtpKeypadProps {
  onOtpComplete: (otp: string) => void;
  isLoading?: boolean;
  summary?: ScrapSummary;
  errorMessage?: string | null;
  isCompleted?: boolean;
  onNextJob?: () => void;
}

export const OtpKeypad: React.FC<OtpKeypadProps> = ({
  onOtpComplete,
  isLoading = false,
  summary,
  errorMessage,
  isCompleted = false,
  onNextJob,
}) => {
  const [pin, setPin] = useState<string>('');

  const grossAmount = summary ? summary.grossAmount : 203.0;
  const partnerMargin = summary?.platformFee !== undefined
    ? summary.platformFee
    : Math.round(grossAmount * 0.08 * 100) / 100; // 8% partner margin

  // Voice announcement on completion
  useEffect(() => {
    if (isCompleted) {
      speakAssamesePrompt('otpSuccess', partnerMargin);
    }
  }, [isCompleted, partnerMargin]);

  const handleDigitPress = (digit: string) => {
    if (isLoading || isCompleted) return;
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        onOtpComplete(newPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isLoading || isCompleted) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmitPress = () => {
    if (isLoading || isCompleted) return;
    if (pin.length === 4) {
      onOtpComplete(pin);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];

  // Completion State Screen (Full-Screen Green Checkmark & Voice Announcement)
  if (isCompleted) {
    return (
      <View testID="settlement-success-card" style={styles.successContainer}>
        <View style={styles.successIconCircle}>
          <Text style={styles.successCheckmark}>✔</Text>
        </View>

        <Text style={styles.successTitle}>পৰিশোধ সম্পূৰ্ণ হ’ল</Text>
        <Text style={styles.successSubTitle}>
          SETTLEMENT COMPLETE • DISBURSED TO UPI
        </Text>

        {/* Financial Margin Card */}
        <View style={styles.marginCardSuccess}>
          <View style={styles.marginRow}>
            <Text style={styles.marginLabel}>গ্ৰাহকৰ পৰিশোধ (Customer UPI):</Text>
            <Text style={styles.marginVal}>₹{grossAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.marginRow}>
            <Text style={styles.marginLabel}>আপোনাৰ লাভ (Partner Margin):</Text>
            <Text style={styles.marginProfit}>
              +₹{partnerMargin.toFixed(2)} Net Profit
            </Text>
          </View>
        </View>

        <View style={styles.voiceAnnouncementCard}>
          <Text style={styles.voiceTitle}>🎙️ অসমীয়া বাৰ্তা (Voice Engine):</Text>
          <Text style={styles.voiceText}>
            "গ্ৰাহকৰ পৰিশোধ সম্পূৰ্ণ হ'ল। আপোনাৰ লাভ {partnerMargin.toFixed(2)} টকা ৱালেটত জমা হৈছে।"
          </Text>
        </View>

        {onNextJob && (
          <TouchableOpacity
            testID="next-job-success-btn"
            style={styles.nextJobBtn}
            onPress={onNextJob}
            activeOpacity={0.85}
          >
            <Text style={styles.nextJobText}>🚀 পৰৱৰ্তী কাম (NEXT PICKUP)</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View testID="otp-keypad-container" style={styles.container}>
      {/* 1. Financial Margin Card */}
      <View style={styles.financialMarginCard}>
        <View style={styles.marginHeader}>
          <Text style={styles.marginTag}>পৰিশোধ আৰু লাভ (MARGIN BREAKDOWN)</Text>
          <Text style={styles.escrowTag}>Auto-Escrow Disbursal</Text>
        </View>

        <View style={styles.marginRow}>
          <Text style={styles.marginLabel}>Customer UPI Payout:</Text>
          <Text style={styles.customerPayoutVal}>₹{grossAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.marginRow}>
          <Text style={styles.marginLabel}>Net Partner Margin Earned:</Text>
          <Text testID="net-partner-margin" style={styles.limeProfitVal}>
            +₹{partnerMargin.toFixed(2)} Net Profit
          </Text>
        </View>
      </View>

      <Text style={styles.header}>গ্ৰাহকৰ ৪-টা অংকৰ ক’ড দিয়ক</Text>
      <Text style={styles.subHeader}>ASK CITIZEN FOR 4-DIGIT COMPLETION OTP</Text>

      {/* Error Banner */}
      {errorMessage && (
        <View testID="otp-error-box" style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* 2. Tactile Keypad: 4 Circular PIN Slot Bubbles at Top */}
      <View testID="pin-bubbles-row" style={styles.bubblesRow}>
        {[0, 1, 2, 3].map((idx) => {
          const isFilled = pin.length > idx;
          const isActive = pin.length === idx;
          return (
            <View
              key={idx}
              testID={`pin-bubble-${idx}`}
              style={[
                styles.bubble,
                isActive && styles.bubbleActive,
                isFilled && styles.bubbleFilled,
              ]}
            >
              {isFilled ? (
                <Text style={styles.bubbleChar}>{pin[idx]}</Text>
              ) : (
                <View style={styles.bubbleDot} />
              )}
            </View>
          );
        })}
      </View>

      {/* Loading state indicator during settlement */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={partnerTheme.colors.affirmation} />
          <Text style={styles.loadingText}>UPI পৰিশোধ নিশ্চিত কৰা হৈছে...</Text>
          <Text style={styles.loadingSubtext}>Disbursing customer payout via UPI rails</Text>
        </View>
      ) : (
        /* 3. 12 Oversized Circular Tactile Buttons (Min 64x64px touch targets) */
        <View style={styles.keypadGrid}>
          {keys.map((key) => {
            const isBackspace = key === '⌫';
            const isSubmit = key === '✓';

            return (
              <TouchableOpacity
                key={key}
                testID={`keypad-btn-${key}`}
                style={[
                  styles.tactileKey,
                  isBackspace && styles.backspaceKey,
                  isSubmit && styles.submitKey,
                ]}
                onPress={() => {
                  if (isBackspace) handleBackspace();
                  else if (isSubmit) handleSubmitPress();
                  else handleDigitPress(key);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.keyText,
                    isBackspace && styles.actionKeyText,
                    isSubmit && styles.actionKeyText,
                  ]}
                >
                  {key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: partnerTheme.colors.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: partnerTheme.colors.border,
    marginVertical: 6,
  },
  financialMarginCard: {
    width: '100%',
    backgroundColor: '#030806',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  marginHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  marginTag: {
    fontSize: 10,
    fontWeight: '900',
    color: partnerTheme.colors.caution,
    letterSpacing: 0.5,
  },
  escrowTag: {
    fontSize: 9,
    fontWeight: '700',
    color: partnerTheme.colors.telemetryCyan,
    backgroundColor: 'rgba(85, 243, 207, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  marginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  marginLabel: {
    fontSize: 12,
    color: partnerTheme.colors.textMuted,
    fontWeight: '600',
  },
  customerPayoutVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  limeProfitVal: {
    fontSize: 14,
    fontWeight: '900',
    color: partnerTheme.colors.brandLime,
  },
  header: {
    color: partnerTheme.colors.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  subHeader: {
    color: partnerTheme.colors.textMuted,
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  errorText: {
    color: '#fee2e2',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  bubblesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
  },
  bubble: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: partnerTheme.colors.surfaceElevated,
    borderWidth: 2.5,
    borderColor: partnerTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleActive: {
    borderColor: partnerTheme.colors.caution,
    backgroundColor: '#07110E',
  },
  bubbleFilled: {
    borderColor: partnerTheme.colors.affirmation,
    backgroundColor: '#064e3b',
  },
  bubbleChar: {
    fontFamily: partnerTheme.typography.fontMono,
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
  },
  bubbleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },
  loadingSubtext: {
    color: partnerTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    justifyContent: 'space-between',
    gap: 12,
  },
  tactileKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: partnerTheme.colors.surfaceElevated,
    borderWidth: 2,
    borderColor: partnerTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  backspaceKey: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  submitKey: {
    backgroundColor: partnerTheme.colors.affirmation,
    borderColor: '#047857',
  },
  keyText: {
    fontFamily: partnerTheme.typography.fontBody,
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  actionKeyText: {
    fontSize: 22,
    fontWeight: '900',
  },
  successContainer: {
    backgroundColor: partnerTheme.colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: partnerTheme.colors.affirmation,
    marginVertical: 6,
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: partnerTheme.colors.affirmation,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 6,
  },
  successCheckmark: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  successSubTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: partnerTheme.colors.affirmation,
    letterSpacing: 0.5,
    marginTop: 2,
    marginBottom: 14,
  },
  marginCardSuccess: {
    width: '100%',
    backgroundColor: '#030806',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: partnerTheme.colors.affirmation,
  },
  marginVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  marginProfit: {
    fontSize: 15,
    fontWeight: '900',
    color: partnerTheme.colors.brandLime,
  },
  voiceAnnouncementCard: {
    backgroundColor: '#07110E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(85, 243, 207, 0.4)',
    width: '100%',
  },
  voiceTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: partnerTheme.colors.telemetryCyan,
    marginBottom: 4,
  },
  voiceText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  nextJobBtn: {
    backgroundColor: partnerTheme.colors.affirmation,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    elevation: 4,
  },
  nextJobText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
