import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors.js';
import { typography } from '../theme/typography.js';

export interface ItemizedScrapItem {
  categoryName: string;
  weightKg: number;
  unitRate: number;
  grossAmount: number;
}

export interface EsgImpactSlipProps {
  receiptId: string;
  wardName: string;
  netPayout: number;
  weightKg: number;
  categoryName?: string;
  items?: ItemizedScrapItem[];
  onShareReceipt?: () => void;
}

export const EsgImpactSlip: React.FC<EsgImpactSlipProps> = ({
  receiptId,
  wardName,
  netPayout,
  weightKg,
  categoryName = 'Mixed Recyclables',
  items,
  onShareReceipt,
}) => {
  // ESG Calculations (Guwahati SWM Rules 2026 Baseline):
  // ~0.0027 m³ landfill volume saved per kg
  // ~1.2 kg CO₂e avoided per kg
  // 10 Green Credits per kg
  const volumeSaved = (weightKg * 0.0027).toFixed(3);
  const carbonAvoided = (weightKg * 1.2).toFixed(1);
  const credits = Math.round(weightKg * 10);

  const handleShareWhatsApp = async () => {
    const shareText =
      `🌿 *KachraCash Circular Economy Receipt*\n` +
      `Receipt ID: #${receiptId}\n` +
      `Ward: ${wardName}, Guwahati\n` +
      `Scrap Diverted from Boragaon: ${weightKg.toFixed(3)} kg\n` +
      `Net UPI Payout Received: ₹${netPayout.toFixed(2)}\n` +
      `Landfill Volume Saved: ${volumeSaved} m³\n` +
      `CO₂ Emissions Avoided: ${carbonAvoided} kg CO₂e\n` +
      `Green KC Credits Earned: +${credits} KC\n\n` +
      `Recycle with KachraCash: https://kachracash.in`;

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;

    try {
      await Linking.openURL(whatsappUrl);
    } catch {
      Alert.alert('Share Receipt', 'Unable to open WhatsApp automatically.');
    }

    if (onShareReceipt) {
      onShareReceipt();
    }
  };

  return (
    <View testID="esg-impact-slip-container" style={styles.container}>
      <View style={styles.celebrationBadge}>
        <Text style={styles.celebrationEmoji}>🎉</Text>
        <Text style={styles.celebrationText}>DOORSTEP SETTLEMENT COMPLETE</Text>
      </View>

      <View style={styles.receiptMeta}>
        <Text testID="receipt-id-text" style={styles.metaText}>
          RECEIPT #{receiptId}
        </Text>
        <Text testID="ward-name-text" style={styles.metaText}>
          📍 {wardName}, Guwahati
        </Text>
      </View>

      {/* Primary Payout Confirmation Banner */}
      <View style={styles.payoutHighlight}>
        <Text style={styles.payoutLabel}>INSTANT SETTLEMENT DISBURSED</Text>
        <Text testID="net-payout-text" style={styles.payoutAmount}>
          ✓ ₹{netPayout.toFixed(2)} Transferred to UPI
        </Text>
        <Text testID="diverted-weight-text" style={styles.divertedText}>
          {weightKg.toFixed(3)} kg Scrap Diverted from Boragaon Dumpsite
        </Text>
      </View>

      {/* Itemized Categories Summary */}
      <View style={styles.itemizedSection}>
        <Text style={styles.itemizedTitle}>CERTIFIED WEIGHMENT MANIFEST</Text>
        {items && items.length > 0 ? (
          items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.categoryName}</Text>
              <Text style={styles.itemDetail}>
                {item.weightKg.toFixed(2)} kg @ ₹{item.unitRate.toFixed(2)}/kg = ₹{item.grossAmount.toFixed(2)}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{categoryName}</Text>
            <Text style={styles.itemDetail}>{weightKg.toFixed(3)} kg certified weighment</Text>
          </View>
        )}
      </View>

      {/* SWM Rules 2026 Compliant Municipal ESG Impact Card */}
      <View testID="esg-metrics-card" style={styles.impactCard}>
        <Text style={styles.impactTitle}>🌍 YOUR MUNICIPAL IMPACT (SWM RULES 2026):</Text>
        <View style={styles.impactItem}>
          <Text style={styles.impactBullet}>•</Text>
          <Text style={styles.impactDesc}>
            Landfill Volume Saved at Boragaon:{' '}
            <Text testID="esg-volume-saved" style={styles.impactBold}>
              {volumeSaved} m³
            </Text>
          </Text>
        </View>
        <View style={styles.impactItem}>
          <Text style={styles.impactBullet}>•</Text>
          <Text style={styles.impactDesc}>
            CO₂ Emissions Avoided:{' '}
            <Text testID="esg-carbon-avoided" style={styles.impactBold}>
              {carbonAvoided} kg CO₂e
            </Text>
          </Text>
        </View>
        <View style={styles.impactItem}>
          <Text style={styles.impactBullet}>•</Text>
          <Text style={styles.impactDesc}>
            Green KC Credits Earned:{' '}
            <Text testID="esg-credits-earned" style={styles.impactBold}>
              +{credits} KC Points
            </Text>
          </Text>
        </View>
      </View>

      {/* Direct WhatsApp Action Button */}
      <TouchableOpacity
        testID="whatsapp-share-button"
        style={styles.shareButton}
        onPress={handleShareWhatsApp}
        activeOpacity={0.82}
      >
        <Text style={styles.shareText}>📲 Share Green Certificate to WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.banyanGreen,
    marginVertical: 10,
    shadowColor: colors.banyanGreen,
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  celebrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.banyanSoft,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 10,
  },
  celebrationEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  celebrationText: {
    ...typography.label,
    fontSize: 11,
    fontWeight: '800',
    color: colors.banyanGreen,
    letterSpacing: 0.6,
  },
  receiptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.structuralLine,
  },
  metaText: {
    ...typography.bodyMedium,
    fontSize: 11,
    color: colors.inkSoft,
    fontWeight: '600',
  },
  payoutHighlight: {
    alignItems: 'center',
    marginVertical: 14,
  },
  payoutLabel: {
    ...typography.label,
    fontSize: 10.5,
    color: colors.inkSoft,
    letterSpacing: 0.6,
  },
  payoutAmount: {
    ...typography.displayMedium,
    fontSize: 22,
    fontWeight: '800',
    color: colors.banyanGreen,
    marginVertical: 4,
    textAlign: 'center',
  },
  divertedText: {
    ...typography.bodyBold,
    fontSize: 12,
    color: colors.inkDeep,
    textAlign: 'center',
    marginTop: 2,
  },
  itemizedSection: {
    backgroundColor: colors.paper,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.structuralLine,
  },
  itemizedTitle: {
    ...typography.label,
    fontSize: 10,
    color: colors.inkSoft,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  itemName: {
    ...typography.bodyBold,
    fontSize: 12,
    color: colors.inkDeep,
  },
  itemDetail: {
    ...typography.bodyMedium,
    fontSize: 11,
    color: colors.inkSoft,
  },
  impactCard: {
    backgroundColor: colors.banyanSoft,
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.strongBorder,
  },
  impactTitle: {
    ...typography.bodyBold,
    fontSize: 11.5,
    color: colors.banyanGreen,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  impactItem: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  impactBullet: {
    fontSize: 12,
    color: colors.banyanGreen,
    marginRight: 6,
  },
  impactDesc: {
    ...typography.bodyMedium,
    fontSize: 11.5,
    color: colors.inkDeep,
  },
  impactBold: {
    fontWeight: '700',
    color: colors.banyanGreen,
  },
  shareButton: {
    backgroundColor: colors.banyanGreen,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.banyanGreen,
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  shareText: {
    ...typography.bodyBold,
    fontSize: 13.5,
    color: colors.pureWhite,
    letterSpacing: 0.5,
  },
});
