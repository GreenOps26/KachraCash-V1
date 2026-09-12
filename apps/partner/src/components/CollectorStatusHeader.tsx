import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { partnerTheme } from '../theme/partnerTheme.js';
import { speakAssamesePrompt } from '../audio/assamesePrompts.js';

export interface CollectorStatusHeaderProps {
  floatBalance: number;
  isOnline: boolean;
  onToggleOnline: () => void;
  onTopUpPress: () => void;
  isOfflineMode?: boolean;
  pendingOfflineCount?: number;
  onSyncPress?: () => void;
}

export const CollectorStatusHeader: React.FC<CollectorStatusHeaderProps> = ({
  floatBalance,
  isOnline,
  onToggleOnline,
  onTopUpPress,
  isOfflineMode = false,
  pendingOfflineCount = 0,
  onSyncPress,
}) => {
  const isFloatCritical = floatBalance < 2000.0;

  useEffect(() => {
    if (isFloatCritical) {
      speakAssamesePrompt('lowFloat');
    }
  }, [isFloatCritical]);

  const handleTogglePress = () => {
    if (isFloatCritical) {
      speakAssamesePrompt('lowFloat');
      Alert.alert(
        'কম ফ্ল’ট (CRITICAL FROZEN)',
        'আপোনাৰ ৱালেট ফ্ল’ট ₹২,০০০ তকৈ কম। নূন্যতম ₹২,০০০ প্ৰয়োজন। অনুগ্ৰহ কৰি ৰিজাৰ্ভ টপ-আপ কৰক।',
        [
          { text: 'বাতিল (Cancel)', style: 'cancel' },
          { text: 'টপ-আপ কৰক (+ Add Float)', onPress: onTopUpPress },
        ]
      );
      return;
    }
    onToggleOnline();
  };

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.topRow}>
        {/* Left: Wallet Float Balance in Fraunces 20px Bold */}
        <View style={styles.floatContainer}>
          <Text style={styles.floatLabel}>ৱালেট ফ্ল’ট (FLOAT)</Text>
          <Text
            style={[
              styles.floatValue,
              isFloatCritical && styles.floatValueCritical,
            ]}
          >
            ₹{floatBalance.toFixed(2)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              isFloatCritical
                ? styles.statusBadgeCritical
                : styles.statusBadgeHealthy,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isFloatCritical
                  ? styles.statusBadgeTextCritical
                  : styles.statusBadgeTextHealthy,
              ]}
            >
              {isFloatCritical ? 'CRITICAL_FROZEN' : 'HEALTHY_FLOAT'}
            </Text>
          </View>
        </View>

        {/* Center-Right: Quick Top-Up Button (+ Add Float in Royal Blue #1D4ED8) */}
        <TouchableOpacity
          testID="quick-topup-button"
          style={styles.topUpButton}
          onPress={onTopUpPress}
          activeOpacity={0.8}
        >
          <Text style={styles.topUpIcon}>💳</Text>
          <Text style={styles.topUpText}>+ Add Float</Text>
        </TouchableOpacity>

        {/* Right: Network Status Indicator */}
        <View style={styles.networkStatusContainer}>
          <Text
            style={[
              styles.networkStatusText,
              isOfflineMode
                ? styles.networkOfflineText
                : styles.networkOnlineText,
            ]}
          >
            {isOfflineMode ? 'OFFLINE SQLITE' : '● ONLINE'}
          </Text>
        </View>
      </View>

      {/* Float Gate Circuit Breaker Alert Banner if float < ₹2,000 */}
      {isFloatCritical && (
        <TouchableOpacity
          testID="critical-frozen-banner"
          style={styles.criticalBanner}
          onPress={onTopUpPress}
          activeOpacity={0.85}
        >
          <Text style={styles.criticalIcon}>⚠️</Text>
          <View style={styles.criticalTextCol}>
            <Text style={styles.criticalTitle}>
              কম ফ্ল’ট: নূন্যতম ₹২,০০০ প্ৰয়োজন
            </Text>
            <Text style={styles.criticalSubtitle}>
              Low Float: Min ₹2,000 required to take dispatches. Tap to top-up via UPI.
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Online / Offline Status Toggle Bar */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>ডিচপেচ গ্ৰহণ স্থিতি (DUTY STATUS):</Text>
        <TouchableOpacity
          testID="duty-status-toggle"
          style={[
            styles.togglePill,
            isFloatCritical
              ? styles.togglePillFrozen
              : isOnline
              ? styles.togglePillOnline
              : styles.togglePillOffline,
          ]}
          onPress={handleTogglePress}
          activeOpacity={0.8}
        >
          <Text style={styles.togglePillText}>
            {isFloatCritical
              ? '🚫 LOCKED (LOW FLOAT)'
              : isOnline
              ? '✓ ONLINE (READY FOR DISPATCH)'
              : 'OFFLINE (ON BREAK)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline SQLite Queue Alert Indicator if any pending */}
      {pendingOfflineCount > 0 && onSyncPress && (
        <View style={styles.offlineQueueStrip}>
          <Text style={styles.offlineQueueText}>
            📶 {pendingOfflineCount} TX QUEUED IN SQLITE
          </Text>
          <TouchableOpacity
            testID="sync-offline-queue-btn"
            style={styles.syncBtn}
            onPress={onSyncPress}
            activeOpacity={0.8}
          >
            <Text style={styles.syncBtnText}>ছিংক কৰক (SYNC)</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: partnerTheme.colors.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: partnerTheme.colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatContainer: {
    flex: 1.2,
  },
  floatLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: partnerTheme.colors.textMuted,
    letterSpacing: 0.5,
  },
  floatValue: {
    fontFamily: partnerTheme.typography.fontDisplay,
    fontSize: 20,
    fontWeight: '800',
    color: partnerTheme.colors.affirmation,
    marginTop: 1,
  },
  floatValueCritical: {
    color: partnerTheme.colors.alert,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  statusBadgeHealthy: {
    backgroundColor: '#064e3b',
  },
  statusBadgeCritical: {
    backgroundColor: '#7f1d1d',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadgeTextHealthy: {
    color: '#a7f3d0',
  },
  statusBadgeTextCritical: {
    color: '#fca5a5',
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: partnerTheme.colors.financial,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 44,
    gap: 6,
  },
  topUpIcon: {
    fontSize: 14,
  },
  topUpText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  networkStatusContainer: {
    paddingLeft: 8,
  },
  networkStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  networkOnlineText: {
    color: partnerTheme.colors.telemetryCyan,
  },
  networkOfflineText: {
    color: partnerTheme.colors.caution,
  },
  criticalBanner: {
    flexDirection: 'row',
    backgroundColor: '#7f1d1d',
    borderWidth: 1.5,
    borderColor: partnerTheme.colors.alert,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  criticalIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  criticalTextCol: {
    flex: 1,
  },
  criticalTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fee2e2',
  },
  criticalSubtitle: {
    fontSize: 10,
    color: '#fca5a5',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  toggleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: partnerTheme.colors.textMuted,
  },
  togglePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  togglePillOnline: {
    backgroundColor: partnerTheme.colors.affirmation,
  },
  togglePillOffline: {
    backgroundColor: '#374151',
  },
  togglePillFrozen: {
    backgroundColor: partnerTheme.colors.alert,
  },
  togglePillText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  offlineQueueStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#b45309',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  offlineQueueText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  syncBtn: {
    backgroundColor: '#000000',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  syncBtnText: {
    color: '#fef3c7',
    fontSize: 10,
    fontWeight: '900',
  },
});
