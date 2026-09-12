import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { VisualTier } from '@kachracash/types';
import { CategorySelector } from './CategorySelector.js';
import { SlotPicker, PICKUP_SLOTS, DEFAULT_GUWAHATI_WARDS } from './SlotPicker.js';
import { apiClient, CreatedOrderData, WardData, TierRate } from '../services/apiClient.js';
import { colors } from '../theme/colors.js';
import { typography } from '../theme/typography.js';

interface PickupRequestFormProps {
  onOrderCreated: (order: CreatedOrderData) => void;
  tierRates?: TierRate[];
  wards?: WardData[];
  selectedWard?: string;
  onSelectWard?: (wardId: string) => void;
}

export const PickupRequestForm: React.FC<PickupRequestFormProps> = ({
  onOrderCreated,
  tierRates,
  wards = DEFAULT_GUWAHATI_WARDS,
  selectedWard: externalSelectedWard,
  onSelectWard: externalOnSelectWard,
}) => {
  const [selectedTier, setSelectedTier] = useState<VisualTier>('SOFT_FILMS');
  const [internalWard, setInternalWard] = useState<string>('WARD_BELTOLA_28');
  const [selectedSlot, setSelectedSlot] = useState<string>('10-12');
  const [weightBucket, setWeightBucket] = useState<string>('10–25 kg');
  const [locationCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 26.1344,
    lng: 91.7878,
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedWard = externalSelectedWard || internalWard;
  const handleSelectWard = (wId: string) => {
    if (externalOnSelectWard) {
      externalOnSelectWard(wId);
    } else {
      setInternalWard(wId);
    }
  };

  const activeWard = wards.find((w) => w.id === selectedWard) || wards[0];
  const isWardSuspended = Boolean(activeWard?.isMonsoonSuspended);

  const handleTogglePhoto = () => {
    if (photoUrl) {
      setPhotoUrl(null);
    } else {
      setPhotoUrl('https://kachracash.in/uploads/scrap_sample_occ.jpg');
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (isWardSuspended) {
      const err = `WARD_TEMPORARILY_SUSPENDED: Pickup requests in ${activeWard?.wardName} are suspended due to flash flooding.`;
      setErrorMessage(err);
      Alert.alert('Pickup Suspended', err);
      return;
    }

    const slotObj = PICKUP_SLOTS.find((s) => s.id === selectedSlot) || PICKUP_SLOTS[0];

    setIsSubmitting(true);
    try {
      const res = await apiClient.createPickupRequest({
        citizenId: 'CITIZEN_GUW_8829',
        wardId: selectedWard,
        visualTier: selectedTier,
        slotStart: slotObj?.start || '10:00 AM',
        slotEnd: slotObj?.end || '12:00 PM',
        pickupLocation: locationCoordinates,
        photoUrl,
      });

      if (res.success && res.data) {
        onOrderCreated(res.data);
      } else {
        setErrorMessage(res.message || 'Failed to create order');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Category Selector & Weight Estimator & Dispute Photo Box */}
      <CategorySelector
        selectedTier={selectedTier}
        onSelectTier={setSelectedTier}
        tierRates={tierRates}
        estimatedWeightBucket={weightBucket}
        onSelectWeightBucket={setWeightBucket}
        photoUrl={photoUrl}
        onTogglePhoto={handleTogglePhoto}
      />

      {/* 2. Slot & Window Picker */}
      <SlotPicker
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        selectedWard={selectedWard}
        onSelectWard={handleSelectWard}
        wards={wards}
      />

      {/* 3. Real-Time PostGIS GPS Grid Details */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📍 PICKUP GPS COORDINATES</Text>
          <View style={styles.activeGpsPill}>
            <Text style={styles.activeGpsText}>● GPS Locked</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.coordLabel}>Guwahati Municipal Ward Grid:</Text>
          <Text style={styles.coordValue}>
            {locationCoordinates.lat.toFixed(4)}° N, {locationCoordinates.lng.toFixed(4)}° E
          </Text>
        </View>
        <Text style={styles.locationSub}>
          Auto-detected via device GPS • Matched to nearest collector with float ≥ ₹2,000 via PostGIS ST_DistanceSphere.
        </Text>
      </View>

      {/* Error Display Banner */}
      {errorMessage && (
        <View testID="form-error-banner" style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* Primary CTA Button: Full-width Banyan Green */}
      <TouchableOpacity
        testID="submit-pickup-button"
        disabled={isSubmitting || isWardSuspended}
        style={[
          styles.submitButton,
          (isSubmitting || isWardSuspended) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        activeOpacity={0.85}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.pureWhite} />
        ) : (
          <Text style={styles.submitButtonText}>
            {isWardSuspended
              ? '🚫 WARD SUSPENDED (FLOODING)'
              : 'Schedule Pickup (Guaranteed Floor Price)'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.structuralLine,
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.inkSoft,
    letterSpacing: 0.6,
  },
  activeGpsPill: {
    backgroundColor: colors.banyanSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeGpsText: {
    ...typography.bodyBold,
    fontSize: 10,
    color: colors.banyanGreen,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  coordLabel: {
    ...typography.bodyBold,
    fontSize: 12,
    color: colors.inkDeep,
  },
  coordValue: {
    ...typography.telemetryMedium,
    fontSize: 12,
    color: colors.banyanGreen,
  },
  locationSub: {
    ...typography.bodyMedium,
    fontSize: 10.5,
    color: colors.inkSoft,
    marginTop: 4,
    lineHeight: 14,
  },
  errorBox: {
    backgroundColor: colors.rustSoft,
    borderColor: colors.rustRed,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
  },
  errorText: {
    ...typography.bodyBold,
    fontSize: 12,
    color: colors.rustRed,
  },
  submitButton: {
    backgroundColor: colors.banyanGreen,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: colors.banyanGreen,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitButtonDisabled: {
    backgroundColor: colors.inkSoft,
    opacity: 0.5,
    shadowOpacity: 0,
  },
  submitButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.pureWhite,
    letterSpacing: 0.5,
  },
});
