import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { partnerTheme } from '../theme/partnerTheme.js';
import { SahaayakEmergencyFab } from './SahaayakEmergencyFab.js';

export interface WaypointTransitProps {
  customerName: string;
  addressText: string;
  distanceMeters: number;
  navigationInstruction?: string;
  gatePhotoUrl?: string;
  onMaskedCall: () => void;
  onGateArrival: () => void;
  onEmergencySos?: () => void;
}

export const WaypointTransit: React.FC<WaypointTransitProps> = ({
  customerName,
  addressText,
  distanceMeters,
  navigationInstruction = '↑ 150m straight, turn right at temple',
  gatePhotoUrl,
  onMaskedCall,
  onGateArrival,
  onEmergencySos,
}) => {
  return (
    <View testID="waypoint-transit-screen" style={styles.container}>
      {/* 1. Landmark & Oversized Vector Navigation Instruction */}
      <View style={styles.navCard}>
        <View style={styles.arrowRow}>
          <View style={styles.arrowBox}>
            <Text style={styles.arrowIcon}>⬆️</Text>
          </View>
          <View style={styles.navTextCol}>
            <Text style={styles.navHeader}>ৰাস্তাৰ নিৰ্দেশনা (ROUTE GUIDANCE)</Text>
            <Text testID="nav-instruction-text" style={styles.navInstruction}>
              {navigationInstruction}
            </Text>
            <Text style={styles.navSubtext}>
              {distanceMeters}m remaining • SLA Target: Arrive within 15 min
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Customer Geo-Tagged Gate Photo Container */}
      <View style={styles.gatePhotoCard}>
        <View style={styles.gateHeaderRow}>
          <Text style={styles.gateTag}>📸 GEO-TAGGED RESIDENTIAL GATE</Text>
          <Text style={styles.gateVisualPill}>Visual Identification</Text>
        </View>

        {/* Visual Simulated Gate Preview Box */}
        <View testID="customer-gate-photo-box" style={styles.gatePhotoPlaceholder}>
          <Text style={styles.gateEmoji}>🚪🏡</Text>
          <Text style={styles.gatePhotoCaption}>
            {gatePhotoUrl
              ? '✓ Gate Photo Verified on Record'
              : 'Black iron gate with green banana tree on left'}
          </Text>
          <Text style={styles.gateAddressCaption}>{addressText}</Text>
        </View>

        <Text style={styles.customerNameBadge}>Customer: {customerName}</Text>
      </View>

      {/* 3. Action Buttons (WCAG AAA Touch Targets) */}
      <View style={styles.actionButtonsCol}>
        {/* Royal Blue Button: Masked Voice Call (#1D4ED8) */}
        <TouchableOpacity
          testID="masked-call-action"
          style={styles.callButton}
          onPress={onMaskedCall}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>📞</Text>
          <View style={styles.btnTextCol}>
            <Text style={styles.btnPrimaryLabel}>গ্ৰাহকলৈ ফোন (MASKED VOICE CALL)</Text>
            <Text style={styles.btnSubLabel}>
              Privacy Proxy Bridge • Resident number protected
            </Text>
          </View>
        </TouchableOpacity>

        {/* Amber Yellow Button: Tap Upon Gate Arrival (#D97706) */}
        <TouchableOpacity
          testID="gate-arrival-action"
          style={styles.arrivalButton}
          onPress={onGateArrival}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>📍</Text>
          <View style={styles.btnTextCol}>
            <Text style={styles.btnPrimaryLabel}>মই উপস্থিত হৈছোঁ (TAP UPON GATE ARRIVAL)</Text>
            <Text style={styles.btnSubLabel}>
              Unlocks certified BLE hanging scale for doorstep weighment
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 4. Emergency Sahaayak Supervisor SOS Trigger */}
      <SahaayakEmergencyFab onEmergencyTriggered={onEmergencySos} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: partnerTheme.colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: partnerTheme.colors.border,
    marginVertical: 6,
  },
  navCard: {
    backgroundColor: '#030806',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: partnerTheme.colors.telemetryCyan,
    marginBottom: 12,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  arrowBox: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: 'rgba(85, 243, 207, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: partnerTheme.colors.telemetryCyan,
  },
  arrowIcon: {
    fontSize: 28,
  },
  navTextCol: {
    flex: 1,
  },
  navHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: partnerTheme.colors.telemetryCyan,
    letterSpacing: 0.6,
  },
  navInstruction: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
    lineHeight: 20,
  },
  navSubtext: {
    fontSize: 11,
    color: partnerTheme.colors.textMuted,
    marginTop: 2,
  },
  gatePhotoCard: {
    backgroundColor: partnerTheme.colors.surfaceElevated,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: partnerTheme.colors.border,
  },
  gateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gateTag: {
    fontSize: 11,
    fontWeight: '900',
    color: partnerTheme.colors.caution,
  },
  gateVisualPill: {
    fontSize: 9,
    fontWeight: '800',
    color: partnerTheme.colors.textMuted,
    backgroundColor: '#07110E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gatePhotoPlaceholder: {
    backgroundColor: '#07110E',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  gateEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  gatePhotoCaption: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  gateAddressCaption: {
    fontSize: 11,
    color: partnerTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  customerNameBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: partnerTheme.colors.textMuted,
  },
  actionButtonsCol: {
    gap: 12,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    backgroundColor: partnerTheme.colors.financial,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    elevation: 4,
  },
  arrivalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    backgroundColor: partnerTheme.colors.caution,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    elevation: 4,
  },
  btnIcon: {
    fontSize: 24,
  },
  btnTextCol: {
    flex: 1,
  },
  btnPrimaryLabel: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  btnSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});
