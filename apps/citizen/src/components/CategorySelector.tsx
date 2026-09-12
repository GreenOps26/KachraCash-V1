import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { VisualTier } from '@kachracash/types';
import { colors } from '../theme/colors.js';
import { typography } from '../theme/typography.js';
import { apiClient, TierRate } from '../services/apiClient.js';

export interface CategorySelectorProps {
  selectedTier: VisualTier;
  onSelectTier: (tier: VisualTier) => void;
  tierRates?: TierRate[];
  estimatedWeightBucket?: string;
  onSelectWeightBucket?: (bucket: string) => void;
  photoUrl?: string | null;
  onTogglePhoto?: () => void;
}

interface TierDisplayInfo {
  id: VisualTier;
  emoji: string;
  title: string;
  items: string;
  subtitle: string;
  defaultMin: number;
  defaultMax: number;
  defaultFloor: number;
}

export const WEIGHT_BUCKETS = ['5–10 kg', '10–25 kg', '25+ kg'];

const DEFAULT_TIERS: TierDisplayInfo[] = [
  {
    id: 'RIGID_CONTAINERS',
    emoji: '🍾',
    title: 'Rigid Containers (বটল আৰু কেন)',
    items: 'PET bottles, HDPE jars, tin cans',
    subtitle: 'Guaranteed Floor Rate ₹18.00–₹24.00/kg',
    defaultMin: 18.0,
    defaultMax: 24.0,
    defaultFloor: 21.0,
  },
  {
    id: 'SOFT_FILMS',
    emoji: '📦',
    title: 'Soft Film & Paper (কাৰ্ডব’ৰ্ড আৰু কাগজ)',
    items: 'Corrugated e-commerce cartons, newspapers, packaging film',
    subtitle: 'Guaranteed Floor Rate ₹12.00–₹16.00/kg',
    defaultMin: 12.0,
    defaultMax: 16.0,
    defaultFloor: 14.0,
  },
  {
    id: 'MIXED_BULKY',
    emoji: '⚙️',
    title: 'Bulky Metals & Appliances (লোহা আৰু ডাঙৰ সামগ্ৰী)',
    items: 'Scrap iron, metal utensils, copper wire, appliances',
    subtitle: 'Guaranteed Floor Rate ₹28.00–₹35.00/kg',
    defaultMin: 28.0,
    defaultMax: 35.0,
    defaultFloor: 32.0,
  },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedTier,
  onSelectTier,
  tierRates: externalTierRates,
  estimatedWeightBucket = '10–25 kg',
  onSelectWeightBucket,
  photoUrl,
  onTogglePhoto,
}) => {
  const [rates, setRates] = useState<TierRate[]>(externalTierRates || []);
  const [loading, setLoading] = useState<boolean>(!externalTierRates);
  const [localWeightBucket, setLocalWeightBucket] = useState<string>(estimatedWeightBucket);
  const [localPhotoAttached, setLocalPhotoAttached] = useState<boolean>(Boolean(photoUrl));

  useEffect(() => {
    if (externalTierRates && externalTierRates.length > 0) {
      setRates(externalTierRates);
      setLoading(false);
      return;
    }

    let isMounted = true;
    apiClient
      .getRateCard()
      .then((res) => {
        if (isMounted && res.success && res.data?.tiers) {
          setRates(res.data.tiers);
        }
      })
      .catch(() => {
        // Fallback to default tiers
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [externalTierRates]);

  const handleWeightBucketPress = (bucket: string) => {
    setLocalWeightBucket(bucket);
    if (onSelectWeightBucket) {
      onSelectWeightBucket(bucket);
    }
  };

  const handlePhotoPress = () => {
    if (onTogglePhoto) {
      onTogglePhoto();
    } else {
      setLocalPhotoAttached((prev) => !prev);
    }
  };

  const isPhotoActive = photoUrl !== undefined ? Boolean(photoUrl) : localPhotoAttached;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.headerTitle}>1. SELECT SCRAP CATEGORY</Text>
        {loading && <ActivityIndicator size="small" color={colors.banyanGreen} />}
      </View>

      {/* 3 Large Visual Intake Cards */}
      <View style={styles.grid}>
        {DEFAULT_TIERS.map((tierInfo) => {
          const isSelected = selectedTier === tierInfo.id;
          const dynamicRate = rates.find((r) => r.id === tierInfo.id);

          const minRate = dynamicRate ? dynamicRate.minRate : tierInfo.defaultMin;
          const maxRate = dynamicRate ? dynamicRate.maxRate : tierInfo.defaultMax;
          const floorRate = dynamicRate ? dynamicRate.floorRate : tierInfo.defaultFloor;

          const isBulky = tierInfo.id === 'MIXED_BULKY';
          const cardBg = isSelected
            ? isBulky
              ? colors.marigoldSoft
              : colors.banyanSoft
            : colors.surface;
          const borderColor = isSelected
            ? isBulky
              ? colors.marigold
              : colors.banyanGreen
            : colors.structuralLine;

          return (
            <TouchableOpacity
              key={tierInfo.id}
              testID={`tier-card-${tierInfo.id}`}
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor },
                isSelected && styles.cardSelectedBorder,
              ]}
              onPress={() => onSelectTier(tierInfo.id)}
              activeOpacity={0.82}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.emojiContainer}>
                  <Text style={styles.emoji}>{tierInfo.emoji}</Text>
                </View>
                {isSelected ? (
                  <View
                    style={[
                      styles.selectedPill,
                      isBulky && { backgroundColor: colors.marigold },
                    ]}
                  >
                    <Text style={styles.selectedPillText}>✓ ACTIVE INTAKE</Text>
                  </View>
                ) : (
                  <Text style={styles.guaranteedPill}>Guaranteed Floor</Text>
                )}
              </View>

              <Text style={styles.tierTitle}>{tierInfo.title}</Text>
              <Text style={styles.tierItems}>{tierInfo.items}</Text>

              <View style={styles.rateRow}>
                <View style={styles.rateBadge}>
                  <Text
                    style={[
                      styles.rateText,
                      isBulky && { color: colors.marigold },
                    ]}
                  >
                    ₹{minRate.toFixed(2)} – ₹{maxRate.toFixed(2)} / kg
                  </Text>
                </View>
                <Text style={styles.floorRateText}>
                  Floor: ₹{floorRate.toFixed(2)}/kg
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Weight Estimator Pill Selector */}
      <View style={styles.weightEstimatorSection}>
        <Text style={styles.sectionLabel}>ESTIMATED BATCH WEIGHT</Text>
        <View style={styles.bucketRow}>
          {WEIGHT_BUCKETS.map((bucket) => {
            const isBucketSelected =
              (estimatedWeightBucket || localWeightBucket) === bucket;
            return (
              <TouchableOpacity
                key={bucket}
                testID={`weight-bucket-${bucket.replace(/\s+/g, '-')}`}
                style={[
                  styles.bucketPill,
                  isBucketSelected && styles.bucketPillSelected,
                ]}
                onPress={() => handleWeightBucketPress(bucket)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.bucketText,
                    isBucketSelected && styles.bucketTextSelected,
                  ]}
                >
                  {bucket}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Dispute Baseline Photo Box */}
      <View style={styles.photoBoxContainer}>
        <TouchableOpacity
          testID="photo-upload-button"
          style={[
            styles.photoUploadBox,
            isPhotoActive && styles.photoUploadBoxActive,
          ]}
          onPress={handlePhotoPress}
          activeOpacity={0.8}
        >
          <Text style={styles.photoIcon}>{isPhotoActive ? '✓' : '📷'}</Text>
          <Text style={styles.photoTitle}>
            {isPhotoActive
              ? '✓ Photo Baseline Attached for Price Protection'
              : 'Add scrap photo for price protection (optional)'}
          </Text>
          <Text style={styles.photoSubtext}>
            Locks a visual baseline against doorstep grade disputes. Not an automated AI scanner.
          </Text>
          {isPhotoActive && (
            <Text style={styles.photoTapToRemove}>Tap to replace or remove photo</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    ...typography.label,
    color: colors.inkSoft,
    letterSpacing: 0.8,
  },
  grid: {
    gap: 10,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
  },
  cardSelectedBorder: {
    borderWidth: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  emojiContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.pureWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.structuralLine,
  },
  emoji: {
    fontSize: 22,
  },
  selectedPill: {
    backgroundColor: colors.banyanGreen,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  selectedPillText: {
    ...typography.label,
    fontSize: 10,
    fontWeight: '800',
    color: colors.pureWhite,
    letterSpacing: 0.5,
  },
  guaranteedPill: {
    ...typography.label,
    fontSize: 10,
    color: colors.inkSoft,
    backgroundColor: colors.paper,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.structuralLine,
  },
  tierTitle: {
    ...typography.heading,
    fontSize: 15,
    color: colors.inkDeep,
    marginBottom: 2,
  },
  tierItems: {
    ...typography.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 8,
    lineHeight: 16,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  rateBadge: {
    backgroundColor: colors.pureWhite,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.structuralLine,
  },
  rateText: {
    ...typography.bodyBold,
    fontSize: 11,
    color: colors.banyanGreen,
  },
  floorRateText: {
    ...typography.bodyMedium,
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  weightEstimatorSection: {
    marginTop: 14,
    marginBottom: 10,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  bucketRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bucketPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.structuralLine,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bucketPillSelected: {
    backgroundColor: colors.banyanSoft,
    borderColor: colors.banyanGreen,
  },
  bucketText: {
    ...typography.bodyBold,
    fontSize: 12,
    color: colors.inkDeep,
  },
  bucketTextSelected: {
    color: colors.banyanGreen,
    fontWeight: '700',
  },
  photoBoxContainer: {
    marginTop: 4,
  },
  photoUploadBox: {
    borderWidth: 1.5,
    borderColor: colors.strongBorder,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  photoUploadBoxActive: {
    borderColor: colors.banyanGreen,
    borderStyle: 'solid',
    backgroundColor: colors.banyanSoft,
  },
  photoIcon: {
    fontSize: 22,
    marginBottom: 4,
    color: colors.banyanGreen,
  },
  photoTitle: {
    ...typography.bodyBold,
    fontSize: 12,
    color: colors.inkDeep,
    textAlign: 'center',
  },
  photoSubtext: {
    ...typography.bodyMedium,
    fontSize: 10.5,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 14,
  },
  photoTapToRemove: {
    ...typography.bodyBold,
    fontSize: 10,
    color: colors.banyanGreen,
    marginTop: 4,
  },
});
