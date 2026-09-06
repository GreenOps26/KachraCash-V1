import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme/colors.js';
import { apiClient, WardData } from '../services/apiClient.js';

export interface PickupSlot {
  id: string;
  start: string;
  end: string;
  label: string;
}

export const PICKUP_SLOTS: PickupSlot[] = [
  { id: '10-12', start: '10:00 AM', end: '12:00 PM', label: '10:00 AM – 12:00 PM' },
  { id: '12-14', start: '12:00 PM', end: '02:00 PM', label: '12:00 PM – 02:00 PM' },
  { id: '14-16', start: '02:00 PM', end: '04:00 PM', label: '02:00 PM – 04:00 PM' },
  { id: '16-18', start: '04:00 PM', end: '06:00 PM', label: '04:00 PM – 06:00 PM' },
];

export const DEFAULT_GUWAHATI_WARDS: WardData[] = [
  { id: 'WARD_BELTOLA_28', wardNumber: 28, wardName: 'Beltola', isMonsoonSuspended: false },
  { id: 'WARD_JAYANAGAR_24', wardNumber: 24, wardName: 'Jayanagar', isMonsoonSuspended: false },
  { id: 'WARD_GANESHGURI_29', wardNumber: 29, wardName: 'Ganeshguri', isMonsoonSuspended: false },
  { id: 'WARD_NOONMATI_15', wardNumber: 15, wardName: 'Noonmati', isMonsoonSuspended: false },
  { id: 'WARD_WIRELESS_30', wardNumber: 30, wardName: 'Wireless / Hatigaon', isMonsoonSuspended: true },
];

interface SlotPickerProps {
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  selectedWard?: string;
  onSelectWard?: (wardId: string) => void;
  wards?: WardData[];
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  selectedSlot,
  onSelectSlot,
  selectedWard = 'WARD_BELTOLA_28',
  onSelectWard,
  wards: externalWards,
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
      .catch((_err) => {
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
      {/* Ward Selection Row */}
      {onSelectWard && (
        <View style={styles.wardSection}>
          <Text style={styles.label}>SELECT GUWAHATI MUNICIPAL WARD</Text>
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

      {/* Slot Window Selector */}
      <View style={styles.slotSection}>
        <Text style={styles.label}>SELECT 2-HOUR PICKUP WINDOW</Text>
        <View style={styles.slotRow}>
          {PICKUP_SLOTS.map((slot) => {
            const isSelected = selectedSlot === slot.id;
            return (
              <TouchableOpacity
                key={slot.id}
                testID={`slot-button-${slot.id}`}
                disabled={isSuspended}
                style={[
                  styles.slotButton,
                  isSelected && !isSuspended && styles.slotButtonActive,
                  isSuspended && styles.slotButtonDisabled,
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
                  {slot.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  wardSection: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  wardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wardChip: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  wardChipSelected: {
    borderColor: colors.financial,
    backgroundColor: colors.financialLight,
  },
  wardChipSuspended: {
    borderColor: colors.alert,
    backgroundColor: colors.alertLight,
  },
  wardChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  wardChipTextSelected: {
    color: colors.financial,
    fontWeight: '700',
  },
  wardChipTextSuspended: {
    color: colors.alert,
  },
  monsoonAlert: {
    flexDirection: 'row',
    backgroundColor: colors.alertLight,
    borderWidth: 1.5,
    borderColor: colors.alert,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.alert,
    letterSpacing: 0.5,
  },
  alertDesc: {
    fontSize: 11,
    color: colors.textPrimary,
    marginTop: 2,
    lineHeight: 16,
  },
  slotSection: {},
  slotRow: {
    gap: 8,
  },
  slotButton: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  slotButtonActive: {
    borderColor: colors.financial,
    backgroundColor: colors.financialLight,
  },
  slotButtonDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },
  slotText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  slotTextActive: {
    color: colors.financial,
  },
  slotTextDisabled: {
    color: '#94a3b8',
  },
});
