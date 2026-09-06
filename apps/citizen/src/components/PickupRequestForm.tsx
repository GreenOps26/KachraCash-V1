import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { VisualTier } from '@kachracash/types';
import { CategorySelector } from './CategorySelector.js';
import { SlotPicker, PICKUP_SLOTS, DEFAULT_GUWAHATI_WARDS } from './SlotPicker.js';
import { apiClient, CreatedOrderData, WardData, TierRate } from '../services/apiClient.js';
import { colors } from '../theme/colors.js';

interface PickupRequestFormProps {
  onOrderCreated: (order: CreatedOrderData) => void;
  tierRates?: TierRate[];
  wards?: WardData[];
}

export const PickupRequestForm: React.FC<PickupRequestFormProps> = ({
  onOrderCreated,
  tierRates,
  wards = DEFAULT_GUWAHATI_WARDS,
}) => {
  const [selectedTier, setSelectedTier] = useState<VisualTier>('SOFT_FILMS');
  const [selectedWard, setSelectedWard] = useState<string>('WARD_BELTOLA_28');
  const [selectedSlot, setSelectedSlot] = useState<string>('10-12');
  const [locationCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 26.1344,
    lng: 91.7878,
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeWard = wards.find((w) => w.id === selectedWard) || wards[0];
  const isWardSuspended = Boolean(activeWard?.isMonsoonSuspended);

  const handleSimulatePhotoUpload = () => {
    // Simulates attaching a pre-grading scrap verification photo
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
      {/* Category Intake Selection */}
      <CategorySelector
        selectedTier={selectedTier}
        onSelectTier={setSelectedTier}
        tierRates={tierRates}
      />

      {/* Ward and 2-Hour Window Selection */}
      <SlotPicker
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        selectedWard={selectedWard}
        onSelectWard={setSelectedWard}
        wards={wards}
      />

      {/* Location Pin & Coordinates */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📍 PICKUP GPS COORDINATES</Text>
        <View style={styles.locationRow}>
          <Text style={styles.coordLabel}>Guwahati Municipal Grid:</Text>
          <Text style={styles.coordValue}>
            {locationCoordinates.lat.toFixed(4)}° N, {locationCoordinates.lng.toFixed(4)}° E
          </Text>
        </View>
        <Text style={styles.locationSub}>
          Auto-detected via device GPS • Assigned to nearest cluster aggregator
        </Text>
      </View>

      {/* Visual Pre-Grading Photo Upload */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📸 VISUAL GRADING BASELINE (OPTIONAL)</Text>
        <Text style={styles.photoHint}>
          Upload a clear photo of your scrap pile for collector pre-grading and bag sizing.
        </Text>
        <TouchableOpacity
          testID="photo-upload-button"
          style={[styles.photoButton, photoUrl ? styles.photoButtonActive : null]}
          onPress={handleSimulatePhotoUpload}
          activeOpacity={0.8}
        >
          <Text style={styles.photoButtonText}>
            {photoUrl ? '✓ Photo Attached (scrap_sample.jpg) — Remove' : '📷 Take / Attach Scrap Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {errorMessage && (
        <View testID="form-error-banner" style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* Submit Button */}
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
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isWardSuspended ? '🚫 WARD SUSPENDED (FLOODING)' : '🚀 SCHEDULE DOORSTEP PICKUP'}
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
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  coordLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  coordValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.financial,
  },
  locationSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  photoHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  photoButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  photoButtonActive: {
    borderColor: colors.affirmation,
    backgroundColor: colors.affirmationLight,
    borderStyle: 'solid',
  },
  photoButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorBox: {
    backgroundColor: colors.alertLight,
    borderColor: colors.alert,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.alert,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: colors.financial,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
});
