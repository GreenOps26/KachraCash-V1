import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors.js';
import { apiClient } from '../services/apiClient.js';

interface OtpRevealModalProps {
  otp: string;
  orderId: string;
  onOrderCompleted?: () => void;
  pollIntervalMs?: number;
}

export const OtpRevealModal: React.FC<OtpRevealModalProps> = ({
  otp,
  orderId,
  onOrderCompleted,
  pollIntervalMs = 2000,
}) => {
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.getOrderStatus(orderId);
        if (isMounted && res.success && res.data.status === 'COMPLETED') {
          setIsCompleted(true);
          clearInterval(interval);
          if (onOrderCompleted) {
            onOrderCompleted();
          }
        }
      } catch {
        // Transient network errors during polling
      }
    }, pollIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId, pollIntervalMs, onOrderCompleted]);

  return (
    <View testID="otp-reveal-modal-container" style={styles.container}>
      <Text testID="order-id-label" style={styles.orderLabel}>ORDER #{orderId}</Text>
      <Text style={styles.title}>COLLECTOR VERIFICATION PIN</Text>
      <Text style={styles.subtitle}>
        Share this 4-digit code with the collector ONLY after you have visually confirmed the zero-tare
        and scrap weighment on their scale.
      </Text>

      {/* 4-Digit OTP Pin Boxes */}
      <View testID="otp-digits-row" style={styles.pinRow}>
        {otp.split('').map((digit, idx) => (
          <View key={idx} testID={`otp-digit-${idx}`} style={styles.pinBox}>
            <Text style={styles.pinDigit}>{digit}</Text>
          </View>
        ))}
      </View>

      {/* Polling & Verification Status */}
      <View style={styles.statusBox}>
        {isCompleted ? (
          <View testID="otp-status-completed" style={styles.statusCompleted}>
            <Text style={styles.statusTextCompleted}>✓ OTP VERIFIED & SETTLEMENT COMPLETED</Text>
          </View>
        ) : (
          <View testID="otp-status-pending" style={styles.statusPending}>
            <ActivityIndicator size="small" color={colors.financial} style={styles.spinner} />
            <Text style={styles.statusTextPending}>
              Waiting for collector to enter PIN on terminal...
            </Text>
          </View>
        )}
      </View>

      {/* Zero Cash Anti-Fraud Guarantee */}
      <View style={styles.securityBadge}>
        <Text style={styles.securityText}>
          🔒 Triggers instant UPI payout directly to your bank account. Doorstep cash is strictly prohibited.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    marginVertical: 12,
  },
  orderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pinBox: {
    width: 56,
    height: 62,
    borderRadius: 10,
    backgroundColor: colors.affirmationLight,
    borderWidth: 2,
    borderColor: colors.affirmation,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDigit: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.affirmation,
  },
  statusBox: {
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  statusPending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.financialLight,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  spinner: {
    marginRight: 8,
  },
  statusTextPending: {
    fontSize: 12,
    color: colors.financial,
    fontWeight: '600',
  },
  statusCompleted: {
    backgroundColor: colors.affirmationLight,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  statusTextCompleted: {
    fontSize: 12,
    color: colors.affirmation,
    fontWeight: '800',
  },
  securityBadge: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  securityText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
});
