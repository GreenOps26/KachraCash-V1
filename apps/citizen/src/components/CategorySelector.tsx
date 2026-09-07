import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { VisualTier } from '@kachracash/types';
import { colors } from '../theme/colors.js';
import { apiClient, TierRate } from '../services/apiClient.js';

interface CategorySelectorProps {
  selectedTier: VisualTier;
  onSelectTier: (tier: VisualTier) => void;
  tierRates?: TierRate[];
}

interface TierDisplayInfo {
  id: VisualTier;
  emoji: string;
  title: string;
  items: string;
  defaultMin: number;
  defaultMax: number;
  defaultFloor: number;
}

const DEFAULT_TIERS: TierDisplayInfo[] = [
  {
    id: 'RIGID_CONTAINERS',
    emoji: '🍾',
    title: 'Rigid Containers (বটল আৰু কেন)',
    items: 'PET Bottles, HDPE Jars, Tin Cans',
    defaultMin: 16.0,
    defaultMax: 88.0,
    defaultFloor: 30.59,
  },
  {
    id: 'SOFT_FILMS',
    emoji: '📦',
    title: 'Soft Film & Paper (কাৰ্ডব’ৰ্ড আৰু কাগজ)',
    items: 'Cardboard (OCC), Newspaper, LDPE Film',
    defaultMin: 10.0,
    defaultMax: 17.0,
    defaultFloor: 14.0,
  },
  {
    id: 'MIXED_BULKY',
    emoji: '⚙️',
    title: 'Bulky & Metals (লোহা আৰু ডাঙৰ সামগ্ৰী)',
    items: 'Appliances, Iron, Steel, Copper, Brass',
    defaultMin: 25.0,
    defaultMax: 380.0,
    defaultFloor: 32.0,
  },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedTier,
  onSelectTier,
  tierRates: externalTierRates,
}) => {
  const [rates, setRates] = useState<TierRate[]>(externalTierRates || []);
  const [loading, setLoading] = useState<boolean>(!externalTierRates);

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
      .catch((_err) => {
        // Fallback gracefully to default floor values if offline or mock
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [externalTierRates]);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.headerTitle}>SELECT SCRAP CATEGORY</Text>
        {loading && <ActivityIndicator size="small" color={colors.affirmation} />}
      </View>

      <View style={styles.grid}>
        {DEFAULT_TIERS.map((tierInfo) => {
          const isSelected = selectedTier === tierInfo.id;
          const dynamicRate = rates.find((r) => r.id === tierInfo.id);

          const minRate = dynamicRate ? dynamicRate.minRate : tierInfo.defaultMin;
          const maxRate = dynamicRate ? dynamicRate.maxRate : tierInfo.defaultMax;
          const floorRate = dynamicRate ? dynamicRate.floorRate : tierInfo.defaultFloor;

          const tierBgColor = tierInfo.id === 'MIXED_BULKY'
            ? (isSelected ? '#F4E3CD' : colors.card)
            : (isSelected ? colors.affirmationLight : colors.card);

          return (
            <TouchableOpacity
              key={tierInfo.id}
              testID={`tier-card-${tierInfo.id}`}
              style={[
                styles.card,
                { backgroundColor: tierBgColor },
                isSelected && (tierInfo.id === 'MIXED_BULKY' ? styles.cardSelectedMarigold : styles.cardSelected),
              ]}
              onPress={() => onSelectTier(tierInfo.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.emoji}>{tierInfo.emoji}</Text>
                {isSelected && (
                  <View style={[styles.selectedPill, tierInfo.id === 'MIXED_BULKY' && { backgroundColor: '#C97A2B' }]}>
                    <Text style={styles.selectedPillText}>SELECTED</Text>
                  </View>
                )}
              </View>

              <Text style={styles.tierTitle}>{tierInfo.title}</Text>
              <Text style={styles.tierItems}>{tierInfo.items}</Text>

              <View style={styles.rateRow}>
                <View style={styles.rateBadge}>
                  <Text style={[styles.rateText, tierInfo.id === 'MIXED_BULKY' && { color: '#C97A2B' }]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  grid: {
    gap: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.affirmation,
    backgroundColor: colors.affirmationLight,
  },
  cardSelectedMarigold: {
    borderColor: '#C97A2B',
    backgroundColor: '#F4E3CD',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  emoji: {
    fontSize: 24,
  },
  selectedPill: {
    backgroundColor: colors.affirmation,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  selectedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  tierTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tierItems: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 4,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  rateBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rateText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.affirmation,
  },
  floorRateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
