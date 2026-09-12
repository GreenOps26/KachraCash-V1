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

export interface DispatchOrder {
  id: string;
  citizenName: string;
  distanceMeters: number;
  locationText: string;
  visualTier: string;
  commodityName: string;
  unitRate: number;
}

export interface DispatchCardProps {
  order: DispatchOrder;
  onAccept: () => void;
  onDecline: () => void;
  isSubmitting?: boolean;
}

export const DispatchCard: React.FC<DispatchCardProps> = ({
  order,
  onAccept,
  onDecline,
  isSubmitting = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(30);

  // 30-Second Countdown Timer
  useEffect(() => {
    speakAssamesePrompt('dispatch');

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDecline]);

  return (
    <View testID="dispatch-intake-card" style={styles.container}>
      {/* 1. Header with Circular 30-Second Timer Ring */}
      <View style={styles.timerHeader}>
        <View style={styles.incomingLabelBox}>
          <Text style={styles.incomingLabel}>🚨 নতুন অনুৰোধ (NEW INTAKE)</Text>
        </View>

        {/* Circular Countdown Timer Ring */}
        <View testID="countdown-ring" style={styles.countdownRing}>
          <Text style={styles.countdownNumber}>{secondsLeft}</Text>
          <Text style={styles.countdownSecLabel}>sec</Text>
        </View>
      </View>

      {/* 2. Visual Scrap Materials Card & Distance Badge */}
      <View style={styles.scrapVisualCard}>
        {/* Large Distance Badge */}
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>
            📍 {order.distanceMeters} METERS • {order.locationText}
          </Text>
        </View>

        {/* Visual Scrap Photographs & Commodity Info */}
        <View style={styles.visualScrapGrid}>
          <View style={styles.visualItem}>
            <Text style={styles.visualEmoji}>📦</Text>
            <Text style={styles.visualItemLabel}>কাৰ্ডব’ৰ্ড (Cardboard)</Text>
          </View>
          <View style={styles.visualItem}>
            <Text style={styles.visualEmoji}>🍾</Text>
            <Text style={styles.visualItemLabel}>বটল (Plastics)</Text>
          </View>
        </View>

        <View style={styles.commodityDetailRow}>
          <Text style={styles.commodityTitle}>{order.commodityName}</Text>
          <Text style={styles.rateHighlight}>
            Floor Rate: ₹{order.unitRate.toFixed(2)}/kg
          </Text>
        </View>
      </View>

      {/* 3. Assamese Voice Waveform Banner */}
      <View style={styles.voiceBanner}>
        <View style={styles.waveformRow}>
          <Text style={styles.waveformIcon}>🎙️ ılıılı</Text>
          <Text style={styles.voiceLangBadge}>Assamese (as-IN)</Text>
        </View>
        <Text style={styles.voiceTranscription}>
          "নতুন ভঙা-কুহিলা আহিছে। গ্ৰহণ কৰিবলৈ সেউজীয়া বোটামটো টিপক।"
        </Text>
      </View>

      {/* 4. Semantic Action Targets (Min 64x64px Touch Targets, WCAG AAA) */}
      <View style={styles.actionsRow}>
        {/* Left: Crimson Red (#DC2626) Decline Button */}
        <TouchableOpacity
          testID="decline-job-button"
          style={styles.declineButton}
          onPress={onDecline}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>✕</Text>
          <Text style={styles.actionLabel}>প্ৰত্যাখ্যান</Text>
          <Text style={styles.actionSubLabel}>DECLINE</Text>
        </TouchableOpacity>

        {/* Right: Emerald Green (#059669) Accept Button */}
        <TouchableOpacity
          testID="accept-job-button"
          style={styles.acceptButton}
          onPress={onAccept}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="large" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.actionIcon}>✔</Text>
              <Text style={styles.actionLabel}>গ্ৰহণ কৰক</Text>
              <Text style={styles.actionSubLabel}>ACCEPT JOB</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: partnerTheme.colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: partnerTheme.colors.border,
    marginVertical: 6,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  incomingLabelBox: {
    backgroundColor: partnerTheme.colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: partnerTheme.colors.caution,
  },
  incomingLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: partnerTheme.colors.caution,
    letterSpacing: 0.5,
  },
  countdownRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#030806',
    borderWidth: 3.5,
    borderColor: partnerTheme.colors.caution,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontFamily: partnerTheme.typography.fontMono,
    fontSize: 22,
    fontWeight: '900',
    color: partnerTheme.colors.telemetryCyan,
    lineHeight: 24,
  },
  countdownSecLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: partnerTheme.colors.textMuted,
  },
  scrapVisualCard: {
    backgroundColor: partnerTheme.colors.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: partnerTheme.colors.border,
  },
  distanceBadge: {
    backgroundColor: '#030806',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: partnerTheme.colors.caution,
  },
  distanceText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: partnerTheme.colors.caution,
    textAlign: 'center',
  },
  visualScrapGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginVertical: 6,
  },
  visualItem: {
    alignItems: 'center',
    backgroundColor: '#07110E',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  visualEmoji: {
    fontSize: 34,
    marginBottom: 4,
  },
  visualItemLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  commodityDetailRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commodityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
  },
  rateHighlight: {
    fontSize: 12,
    fontWeight: '900',
    color: partnerTheme.colors.affirmation,
  },
  voiceBanner: {
    backgroundColor: '#030806',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(85, 243, 207, 0.4)',
  },
  waveformRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  waveformIcon: {
    fontSize: 14,
    color: partnerTheme.colors.telemetryCyan,
    fontWeight: '900',
  },
  voiceLangBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: partnerTheme.colors.telemetryCyan,
    backgroundColor: 'rgba(85, 243, 207, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  voiceTranscription: {
    fontSize: 12.5,
    color: '#ffffff',
    fontWeight: '700',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    minHeight: 72,
    minWidth: 64,
    backgroundColor: partnerTheme.colors.alert,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    shadowColor: partnerTheme.colors.alert,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  acceptButton: {
    flex: 1.4,
    minHeight: 72,
    minWidth: 64,
    backgroundColor: partnerTheme.colors.affirmation,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    shadowColor: partnerTheme.colors.affirmation,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  actionIcon: {
    fontSize: 26,
    color: '#ffffff',
    fontWeight: '900',
    lineHeight: 28,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  actionSubLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
});
