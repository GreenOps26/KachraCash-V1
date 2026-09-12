import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors.js';
import { typography } from '../theme/typography.js';
import { apiClient } from '../services/apiClient.js';

export interface OtpRevealModalProps {
  otp: string;
  orderId: string;
  collectorName?: string;
  onOrderCompleted?: () => void;
  pollIntervalMs?: number;
}

export const OtpRevealModal: React.FC<OtpRevealModalProps> = ({
  otp,
  orderId,
  collectorName = 'Babul Ali',
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
      <Text testID="order-id-label" style={styles.orderLabel}>
        ORDER #{orderId}
      </Text>
      <Text style={styles.title}>4-Digit Completion OTP</Text>
      
      {/* Required Notice */}
      <Text style={styles.noticeText}>
        Share this 4-digit PIN with collector {collectorName} only after verifying the weight above.
      </Text>

      {/* 4 Separate Bordered Digit Boxes in Fraunces 32px */}
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
            <Text style={styles.statusTextCompleted}>
              ✓ OTP VERIFIED & SETTLEMENT COMPLETED
            </Text>
          </View>
        ) : (
          <View testID="otp-status-pending" style={styles.statusPending}>
            <ActivityIndicator size="small" color={colors.banyanGreen} style={styles.spinner} />
            <Text style={styles.statusTextPending}>
              Waiting for collector {collectorName} to enter PIN on mobile terminal...
            </Text>
          </View>
        )}
      </View>

      {/* Zero Cash Anti-Fraud Security Guarantee */}
      <View style={styles.securityBadge}>
        <Text style={styles.securityText}>
          🔒 Automated Escrow: Payout transfers immediately to your verified UPI VPA. Doorstep cash handling is strictly prohibited.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.structuralLine,
    alignItems: 'center',
    marginVertical: 10,
  },
  orderLabel: {
    ...typography.label,
    color: colors.inkSoft,
    letterSpacing: 0.6,
  },
  title: {
    ...typography.heading,
    fontSize: 18,
    color: colors.inkDeep,
    marginTop: 4,
  },
  noticeText: {
    ...typography.bodyMedium,
    fontSize: 12.5,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pinBox: {
    width: 60,
    height: 68,
    borderRadius: 12,
    backgroundColor: colors.banyanSoft,
    borderWidth: 2,
    borderColor: colors.banyanGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.banyanGreen,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pinDigit: {
    ...typography.displayLarge,
    fontSize: 32,
    color: colors.banyanGreen,
    fontWeight: '800',
  },
  statusBox: {
    marginVertical: 6,
    width: '100%',
    alignItems: 'center',
  },
  statusPending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.structuralLine,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  spinner: {
    marginRight: 8,
  },
  statusTextPending: {
    ...typography.bodyMedium,
    fontSize: 11.5,
    color: colors.inkDeep,
    fontWeight: '600',
    flex: 1,
  },
  statusCompleted: {
    backgroundColor: colors.banyanSoft,
    borderWidth: 1.5,
    borderColor: colors.banyanGreen,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  statusTextCompleted: {
    ...typography.bodyBold,
    fontSize: 12,
    color: colors.banyanGreen,
  },
  securityBadge: {
    backgroundColor: colors.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.structuralLine,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  securityText: {
    ...typography.bodyMedium,
    fontSize: 10.5,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 14,
  },
});
