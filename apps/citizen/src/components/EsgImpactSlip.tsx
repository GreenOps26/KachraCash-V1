import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { colors } from '../theme/colors.js';

export interface ItemizedScrapItem {
  categoryName: string;
  weightKg: number;
  unitRate: number;
  grossAmount: number;
}

interface EsgImpactSlipProps {
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
      <Text style={styles.badge}>🌱 KACHRACASH ESG IMPACT SLIP</Text>

      <View style={styles.receiptMeta}>
        <Text testID="receipt-id-text" style={styles.metaText}>RECEIPT #{receiptId}</Text>
        <Text testID="ward-name-text" style={styles.metaText}>📍 {wardName}, Guwahati</Text>
      </View>

      {/* Payout & Weight Highlight */}
      <View style={styles.payoutHighlight}>
        <Text style={styles.payoutLabel}>NET UPI PAYOUT CREDITED</Text>
        <Text testID="net-payout-text" style={styles.payoutAmount}>
          ₹{netPayout.toFixed(2)}
        </Text>
        <Text testID="diverted-weight-text" style={styles.divertedText}>
          {weightKg.toFixed(3)} kg Scrap Diverted from Boragaon Dumpsite
        </Text>
      </View>

      {/* Itemized Categories */}
      <View style={styles.itemizedSection}>
        <Text style={styles.itemizedTitle}>ITEMIZED SCRAP SUMMARY</Text>
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
            <Text style={styles.itemDetail}>{weightKg.toFixed(3)} kg weighed</Text>
          </View>
        )}
      </View>

      {/* Municipal ESG Impact Card */}
      <View testID="esg-metrics-card" style={styles.impactCard}>
        <Text style={styles.impactTitle}>🌍 YOUR MUNICIPAL IMPACT (SWM RULES 2026):</Text>
        <View style={styles.impactItem}>
          <Text style={styles.impactBullet}>•</Text>
          <Text style={styles.impactDesc}>
            Boragaon Dumpsite Volume Saved:{' '}
            <Text testID="esg-volume-saved" style={styles.impactBold}>
              {volumeSaved} m³
            </Text>
          </Text>
        </View>
        <View style={styles.impactItem}>
          <Text style={styles.impactBullet}>•</Text>
          <Text style={styles.impactDesc}>
            Carbon Emissions Avoided:{' '}
            <Text testID="esg-carbon-avoided" style={styles.impactBold}>
              {carbonAvoided} kg CO₂e
            </Text>
          </Text>
        </View>
        <View style={styles.impactItem}>
          <Text style={styles.impactBullet}>•</Text>
          <Text style={styles.impactDesc}>
            Green Circular Credits Earned:{' '}
            <Text testID="esg-credits-earned" style={styles.impactBold}>
              +{credits} KC Points
            </Text>
          </Text>
        </View>
      </View>

      {/* WhatsApp Share Action Button */}
      <TouchableOpacity
        testID="whatsapp-share-button"
        style={styles.shareButton}
        onPress={handleShareWhatsApp}
        activeOpacity={0.8}
      >
        <Text style={styles.shareText}>📲 SHARE WHATSAPP ESG CERTIFICATE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.affirmation,
    marginVertical: 12,
  },
  badge: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.affirmation,
    textAlign: 'center',
    marginBottom: 8,
  },
  receiptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  payoutHighlight: {
    alignItems: 'center',
    marginVertical: 14,
  },
  payoutLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  payoutAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.affirmation,
    marginVertical: 2,
  },
  divertedText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemizedSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemizedTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemDetail: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  impactCard: {
    backgroundColor: colors.affirmationLight,
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
  },
  impactTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.affirmation,
    marginBottom: 6,
  },
  impactItem: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  impactBullet: {
    fontSize: 12,
    color: colors.affirmation,
    marginRight: 6,
  },
  impactDesc: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  impactBold: {
    fontWeight: '700',
  },
  shareButton: {
    backgroundColor: colors.affirmation,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  shareText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
