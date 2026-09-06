import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { partnerTheme } from '../theme/partnerTheme.js';

interface ScrapSummary {
  commodityName: string;
  weightKg: number;
  unitRate: number;
  grossAmount: number;
}

interface OtpKeypadProps {
  onOtpComplete: (otp: string) => void;
  isLoading?: boolean;
  summary?: ScrapSummary;
  errorMessage?: string | null;
}

export const OtpKeypad: React.FC<OtpKeypadProps> = ({
  onOtpComplete,
  isLoading = false,
  summary,
  errorMessage,
}) => {
  const [pin, setPin] = useState<string>('');

  const handlePress = (digit: string) => {
    if (isLoading) return;
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        onOtpComplete(newPin);
      }
    }
  };

  const handleClear = () => {
    if (isLoading) return;
    setPin('');
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'];

  return (
    <View style={styles.container}>
      {/* Locked Scrap Settlement Summary */}
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>পৰিশোধৰ হিচাপ (SETTLEMENT DUE)</Text>
          <Text style={styles.summaryItem}>{summary.commodityName}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ওজন (Weight): {summary.weightKg.toFixed(2)} kg</Text>
            <Text style={styles.summaryLabel}>দৰ (Rate): ₹{summary.unitRate.toFixed(2)}/kg</Text>
          </View>
          <View style={styles.payoutBadge}>
            <Text style={styles.payoutText}>গ্ৰাহকক প্ৰদেয় (UPI Payout): ₹{summary.grossAmount.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <Text style={styles.header}>গ্ৰাহকৰ ৪-টা অংকৰ ক’ড দিয়ক</Text>
      <Text style={styles.subHeader}>ASK CITIZEN FOR 4-DIGIT COMPLETION OTP</Text>

      {/* Error Message Display */}
      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* 4-Digit Display Slot */}
      <View style={styles.pinDisplay}>
        {[0, 1, 2, 3].map((idx) => (
          <View
            key={idx}
            style={[
              styles.pinSlot,
              pin.length === idx && styles.pinSlotActive,
              pin[idx] ? styles.pinSlotFilled : null,
            ]}
          >
            <Text style={styles.pinChar}>{pin[idx] || '—'}</Text>
          </View>
        ))}
      </View>

      {/* Loading state indicator */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={partnerTheme.colors.affirmation} />
          <Text style={styles.loadingText}>OTP নিশ্চিত কৰি থকা হৈছে...</Text>
          <Text style={styles.loadingSubtext}>Verifying UPI Settlement with Bank rails</Text>
        </View>
      ) : (
        /* Numeric Keypad Grid */
        <View style={styles.grid}>
          {keys.map((key) => {
            const isAction = key === 'C' || key === '✓';
            const isClear = key === 'C';
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.key,
                  isAction && {
                    backgroundColor: isClear
                      ? partnerTheme.colors.alert
                      : partnerTheme.colors.affirmation,
                  },
                ]}
                onPress={() => {
                  if (key === 'C') handleClear();
                  else if (key === '✓') {
                    if (pin.length === 4) onOtpComplete(pin);
                  } else handlePress(key);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.keyText}>{key}</Text>
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
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: partnerTheme.colors.border,
    marginVertical: 10,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: partnerTheme.colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: partnerTheme.colors.border,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: partnerTheme.colors.caution,
    marginBottom: 4,
  },
  summaryItem: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: partnerTheme.colors.textMuted,
    fontWeight: '600',
  },
  payoutBadge: {
    backgroundColor: '#064e3b',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  payoutText: {
    color: '#d1fae5',
    fontSize: 14,
    fontWeight: '900',
  },
  header: {
    color: partnerTheme.colors.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  subHeader: {
    color: partnerTheme.colors.textMuted,
    fontSize: 11,
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
    fontWeight: '700',
    textAlign: 'center',
  },
  pinDisplay: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pinSlot: {
    width: 56,
    height: 60,
    borderRadius: 12,
    backgroundColor: partnerTheme.colors.surfaceElevated,
    borderWidth: 2,
    borderColor: partnerTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSlotActive: {
    borderColor: partnerTheme.colors.affirmation,
  },
  pinSlotFilled: {
    borderColor: partnerTheme.colors.financial,
    backgroundColor: '#1e293b',
  },
  pinChar: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  loadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  loadingSubtext: {
    color: partnerTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 270,
    justifyContent: 'space-between',
    gap: 10,
  },
  key: {
    width: 80,
    height: 64,
    borderRadius: 14,
    backgroundColor: partnerTheme.colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: partnerTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
});
