import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors.js';
import { typography } from '../theme/typography.js';
import { apiClient, WardData } from '../services/apiClient.js';

export interface PickupSlot {
  id: string;
  start: string;
  end: string;
  label: string;
  displayLabel?: string;
}

export const PICKUP_SLOTS: PickupSlot[] = [
  {
    id: '10-12',
    start: '10:00 AM',
    end: '12:00 PM',
    label: '10:00 AM – 12:00 PM',
    displayLabel: 'Today, 10:00 AM – 12:00 PM',
  },
  {
    id: '12-14',
    start: '12:00 PM',
    end: '02:00 PM',
    label: '12:00 PM – 02:00 PM',
    displayLabel: 'Today, 12:00 PM – 02:00 PM',
  },
  {
    id: '14-16',
    start: '02:00 PM',
    end: '04:00 PM',
    label: '02:00 PM – 04:00 PM',
    displayLabel: 'Today, 02:00 PM – 04:00 PM',
  },
  {
    id: '16-18',
    start: '09:00 AM',
    end: '11:00 AM',
    label: '04:00 PM – 06:00 PM',
    displayLabel: 'Tomorrow, 09:00 AM – 11:00 AM',
  },
];

export const DEFAULT_GUWAHATI_WARDS: WardData[] = [
  { id: 'WARD_BELTOLA_28', wardNumber: 28, wardName: 'Beltola', isMonsoonSuspended: false },
  { id: 'WARD_JAYANAGAR_24', wardNumber: 24, wardName: 'Jayanagar', isMonsoonSuspended: false },
  { id: 'WARD_GANESHGURI_29', wardNumber: 29, wardName: 'Ganeshguri', isMonsoonSuspended: false },
  { id: 'WARD_NOONMATI_15', wardNumber: 15, wardName: 'Noonmati', isMonsoonSuspended: false },
  { id: 'WARD_WIRELESS_30', wardNumber: 30, wardName: 'Wireless / Hatigaon', isMonsoonSuspended: true },
];

export interface SlotPickerProps {
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  selectedWard?: string;
  onSelectWard?: (wardId: string) => void;
  wards?: WardData[];
  upiId?: string;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  selectedSlot,
  onSelectSlot,
  selectedWard = 'WARD_BELTOLA_28',
  onSelectWard,
  wards: externalWards,
  upiId = 'ananya@okhdfcbank',
  onSubmit,
  isSubmitting = false,
}) => {
  const [wards, setWards] = useState<WardData[]>(externalWards || DEFAULT_GUWAHATI_WARDS);

  useEffect(() => {
    if (externalWards && externalWards.length > 0) {
      setWards(externalWards);
      return;
    }

    let isMounted = true;
    apiClient
      .getRateCard()
      .then((res) => {
        if (isMounted && res.success && res.data?.wards) {
          setWards(res.data.wards);
        }
      })
      .catch(() => {
        // Keep DEFAULT_GUWAHATI_WARDS
      });

    return () => {
      isMounted = false;
    };
  }, [externalWards]);

  const activeWard = wards.find((w) => w.id === selectedWard) || wards[0];
  const isSuspended = Boolean(activeWard?.isMonsoonSuspended);

  const handleSlotPress = (slotId: string) => {
    if (isSuspended) {
      Alert.alert(
        'Ward Temporarily Suspended',
        `Pickups in ${activeWard?.wardName || 'this ward'} are temporarily suspended due to flash flooding. Please select another ward or check back later.`
      );
      return;
    }
    onSelectSlot(slotId);
  };

  return (
    <View style={styles.container}>
      {/* Ward Selection Chips (when provided) */}
      {onSelectWard && (
        <View style={styles.wardSection}>
          <Text style={styles.label}>GUWAHATI MUNICIPAL WARD</Text>
          <View style={styles.wardRow}>
            {wards.map((ward) => {
              const isWardSelected = selectedWard === ward.id;
              return (
                <TouchableOpacity
                  key={ward.id}
                  testID={`ward-chip-${ward.id}`}
                  style={[
                    styles.wardChip,
                    isWardSelected && styles.wardChipSelected,
                    ward.isMonsoonSuspended && styles.wardChipSuspended,
                  ]}
                  onPress={() => onSelectWard(ward.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.wardChipText,
                      isWardSelected && styles.wardChipTextSelected,
                      ward.isMonsoonSuspended && styles.wardChipTextSuspended,
                    ]}
                  >
                    {ward.wardName} (W{ward.wardNumber})
                    {ward.isMonsoonSuspended ? ' ⚠️' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Monsoon Suspension Warning Banner */}
      {isSuspended && (
        <View testID="monsoon-alert-banner" style={styles.monsoonAlert}>
          <Text style={styles.alertIcon}>🌊</Text>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>MONSOON FLOOD ALERT — PICKUPS SUSPENDED</Text>
            <Text style={styles.alertDesc}>
              Logistics in {activeWard?.wardName} (Ward {activeWard?.wardNumber}) are halted due
              to severe waterlogging. Rescheduling and dispatch notifications will be sent via SMS.
            </Text>
          </View>
        </View>
      )}

      {/* 2-Hour Scheduling Chips (Horizontal Scroll) */}
      <View style={styles.slotSection}>
        <Text style={styles.label}>2. SELECT 2-HOUR PICKUP WINDOW</Text>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slotScroll}
        >
          {PICKUP_SLOTS.map((slot) => {
            const isSelected = selectedSlot === slot.id;
            return (
              <TouchableOpacity
                key={slot.id}
                testID={`slot-button-${slot.id}`}
                disabled={isSuspended}
                style={[
                  styles.slotChip,
                  isSelected && !isSuspended && styles.slotChipActive,
                  isSuspended && styles.slotChipDisabled,
                ]}
                onPress={() => handleSlotPress(slot.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.slotText,
                    isSelected && !isSuspended && styles.slotTextActive,
                    isSuspended && styles.slotTextDisabled,
                  ]}
                >
                  {slot.displayLabel || slot.label}
                </Text>
                {isSelected && !isSuspended && (
                  <View style={styles.chipCheck}>
                    <Text style={styles.chipCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Linked UPI Payout Card */}
      <View style={styles.upiCard}>
        <View style={styles.upiHeader}>
          <View style={styles.upiIconBox}>
            <Text style={styles.upiCheck}>✓</Text>
          </View>
          <View style={styles.upiTextContainer}>
            <Text style={styles.upiTitle}>
              Direct Bank Transfer via UPI: <Text style={styles.upiHighlight}>{upiId}</Text>
            </Text>
            <Text style={styles.upiSubtext}>
              Payout transfers automatically upon entering completion OTP at doorstep.
            </Text>
          </View>
        </View>
      </View>

      {/* Primary CTA Button (if onSubmit supplied) */}
      {onSubmit && (
        <TouchableOpacity
          testID="submit-pickup-button"
          disabled={isSubmitting || isSuspended}
          style={[
            styles.ctaButton,
            (isSubmitting || isSuspended) && styles.ctaButtonDisabled,
          ]}
          onPress={onSubmit}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.pureWhite} />
          ) : (
            <Text style={styles.ctaButtonText}>
              {isSuspended
                ? '🚫 WARD SUSPENDED (WATERLOGGING)'
                : 'Schedule Pickup (Guaranteed Floor Price)'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  wardSection: {
    marginBottom: 12,
  },
  label: {
    ...typography.label,
    color: colors.inkSoft,
    marginBottom: 8,
  },
  wardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wardChip: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.structuralLine,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  wardChipSelected: {
    borderColor: colors.banyanGreen,
    backgroundColor: colors.banyanSoft,
  },
  wardChipSuspended: {
    borderColor: colors.amber,
    backgroundColor: colors.amberSoft,
  },
  wardChipText: {
    ...typography.bodyBold,
    fontSize: 12,
    color: colors.inkDeep,
  },
  wardChipTextSelected: {
    color: colors.banyanGreen,
  },
  wardChipTextSuspended: {
    color: colors.amber,
  },
  monsoonAlert: {
    flexDirection: 'row',
    backgroundColor: colors.amberSoft,
    borderWidth: 1.5,
    borderColor: colors.amber,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...typography.bodyBold,
    fontSize: 11,
    color: colors.amber,
    letterSpacing: 0.5,
  },
  alertDesc: {
    ...typography.bodyMedium,
    fontSize: 11,
    color: colors.inkDeep,
    marginTop: 2,
    lineHeight: 15,
  },
  slotSection: {
    marginBottom: 12,
  },
  slotScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.structuralLine,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  slotChipActive: {
    borderColor: colors.banyanGreen,
    backgroundColor: colors.banyanSoft,
  },
  slotChipDisabled: {
    backgroundColor: colors.paper,
    borderColor: colors.structuralLine,
    opacity: 0.5,
  },
  slotText: {
    ...typography.bodyBold,
    fontSize: 12.5,
    color: colors.inkDeep,
  },
  slotTextActive: {
    color: colors.banyanGreen,
    fontWeight: '700',
  },
  slotTextDisabled: {
    color: colors.inkSoft,
  },
  chipCheck: {
    marginLeft: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.banyanGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCheckText: {
    color: colors.pureWhite,
    fontSize: 10,
    fontWeight: '900',
  },
  upiCard: {
    backgroundColor: colors.royalBlueSoft,
    borderWidth: 1.5,
    borderColor: colors.royalBlue,
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  upiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upiIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.royalBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  upiCheck: {
    color: colors.pureWhite,
    fontSize: 12,
    fontWeight: '900',
  },
  upiTextContainer: {
    flex: 1,
  },
  upiTitle: {
    ...typography.bodyBold,
    fontSize: 12,
    color: colors.inkDeep,
  },
  upiHighlight: {
    color: colors.royalBlue,
    fontWeight: '700',
  },
  upiSubtext: {
    ...typography.bodyMedium,
    fontSize: 10.5,
    color: colors.inkSoft,
    marginTop: 2,
    lineHeight: 14,
  },
  ctaButton: {
    backgroundColor: colors.banyanGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: colors.banyanGreen,
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  ctaButtonDisabled: {
    backgroundColor: colors.inkSoft,
    opacity: 0.5,
    shadowOpacity: 0,
  },
  ctaButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.pureWhite,
    letterSpacing: 0.5,
  },
});
