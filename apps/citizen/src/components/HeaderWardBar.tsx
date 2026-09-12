import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors.js';
import { typography } from '../theme/typography.js';
import { apiClient, WardData } from '../services/apiClient.js';
import { DEFAULT_GUWAHATI_WARDS } from './SlotPicker.js';

interface HeaderWardBarProps {
  selectedWard: string;
  onSelectWard: (wardId: string) => void;
  wards?: WardData[];
}

export const HeaderWardBar: React.FC<HeaderWardBarProps> = ({
  selectedWard,
  onSelectWard,
  wards: externalWards,
}) => {
  const [wards, setWards] = useState<WardData[]>(externalWards || DEFAULT_GUWAHATI_WARDS);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

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
        // Fallback to default Guwahati wards
      });

    return () => {
      isMounted = false;
    };
  }, [externalWards]);

  const activeWard = wards.find((w) => w.id === selectedWard) || wards[0];
  const isMonsoonSuspended = Boolean(activeWard?.isMonsoonSuspended);

  return (
    <View style={styles.headerContainer}>
      {/* Top App Brand & Location Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandBox}>
          <Text style={styles.brandTitle}>KachraCash</Text>
          <Text style={styles.brandSub}>কচৰা ক্যাশ • Guwahati</Text>
        </View>

        {/* Location Selector Pill */}
        <TouchableOpacity
          testID="location-selector-pill"
          style={[
            styles.wardPill,
            isMonsoonSuspended && styles.wardPillSuspended,
          ]}
          onPress={() => setIsDropdownOpen(true)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.wardPillText,
              isMonsoonSuspended && styles.wardPillTextSuspended,
            ]}
          >
            📍 {activeWard?.wardName || 'Jayanagar'}, Ward {activeWard?.wardNumber || 24} {isMonsoonSuspended ? '⚠️' : '▾'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ward Dropdown Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Guwahati Ward</Text>
              <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.wardList}>
              {wards.map((w) => {
                const isSelected = w.id === selectedWard;
                return (
                  <TouchableOpacity
                    key={w.id}
                    testID={`ward-dropdown-item-${w.id}`}
                    style={[
                      styles.wardItem,
                      isSelected && styles.wardItemSelected,
                      w.isMonsoonSuspended && styles.wardItemSuspended,
                    ]}
                    onPress={() => {
                      onSelectWard(w.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <View>
                      <Text
                        style={[
                          styles.wardItemName,
                          isSelected && styles.wardItemNameSelected,
                        ]}
                      >
                        {w.wardName} (Ward {w.wardNumber})
                      </Text>
                      <Text style={styles.wardItemSub}>
                        {w.isMonsoonSuspended
                          ? '⚠️ Monsoon Waterlogged • Pickups Paused'
                          : '✓ Operational • 2-Hour Dispatch Active'}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Ward Monsoon Safety Banner (Conditional Amber Alert) */}
      {isMonsoonSuspended && (
        <View testID="monsoon-alert-banner" style={styles.monsoonAlertCard}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={styles.alertTextWrapper}>
            <Text style={styles.alertHeading}>WARD PICKUP TEMPORARILY PAUSED</Text>
            <Text style={styles.alertBody}>
              Pickups in this ward are temporarily paused due to street waterlogging. Earliest available slots reopen tomorrow 08:00 AM.
            </Text>
          </View>
        </View>
      )}

      {/* 3-Step Value Proposition Strip */}
      <View style={styles.valueStrip}>
        <View style={styles.stepBox}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>Schedule</Text>
        </View>
        <Text style={styles.stepArrow}>→</Text>
        <View style={styles.stepBox}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>Transparent BLE Weighing</Text>
        </View>
        <Text style={styles.stepArrow}>→</Text>
        <View style={styles.stepBox}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>Instant Bank Payout</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.structuralLine,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandBox: {
    justifyContent: 'center',
  },
  brandTitle: {
    ...typography.heading,
    color: colors.banyanGreen,
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  brandSub: {
    ...typography.bodyMedium,
    color: colors.inkSoft,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  wardPill: {
    backgroundColor: colors.banyanSoft,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.structuralLine,
  },
  wardPillSuspended: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.amber,
  },
  wardPillText: {
    ...typography.bodyBold,
    fontSize: 11,
    color: colors.banyanGreen,
  },
  wardPillTextSuspended: {
    color: colors.amber,
  },
  monsoonAlertCard: {
    flexDirection: 'row',
    backgroundColor: colors.amberSoft,
    borderWidth: 1.5,
    borderColor: colors.amber,
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  alertTextWrapper: {
    flex: 1,
  },
  alertHeading: {
    ...typography.bodyBold,
    fontSize: 11,
    color: colors.amber,
    letterSpacing: 0.5,
  },
  alertBody: {
    ...typography.bodyMedium,
    fontSize: 11,
    color: colors.inkDeep,
    marginTop: 2,
    lineHeight: 15,
  },
  valueStrip: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.structuralLine,
    marginTop: 4,
  },
  stepBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    backgroundColor: colors.banyanGreen,
    color: colors.pureWhite,
    fontSize: 9,
    fontWeight: '800',
    width: 15,
    height: 15,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 15,
    marginRight: 4,
  },
  stepText: {
    ...typography.bodyBold,
    fontSize: 9.5,
    color: colors.inkDeep,
  },
  stepArrow: {
    fontSize: 10,
    color: colors.inkSoft,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 360,
    maxHeight: 420,
    borderWidth: 1.5,
    borderColor: colors.strongBorder,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.structuralLine,
  },
  modalTitle: {
    ...typography.heading,
    fontSize: 16,
    color: colors.inkDeep,
  },
  closeBtn: {
    fontSize: 18,
    color: colors.inkSoft,
    padding: 4,
  },
  wardList: {
    marginTop: 8,
  },
  wardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.structuralLine,
    marginVertical: 4,
    backgroundColor: colors.pureWhite,
  },
  wardItemSelected: {
    borderColor: colors.banyanGreen,
    backgroundColor: colors.banyanSoft,
  },
  wardItemSuspended: {
    borderColor: colors.amber,
    backgroundColor: colors.amberSoft,
  },
  wardItemName: {
    ...typography.bodyBold,
    fontSize: 13,
    color: colors.inkDeep,
  },
  wardItemNameSelected: {
    color: colors.banyanGreen,
  },
  wardItemSub: {
    ...typography.bodyMedium,
    fontSize: 10,
    color: colors.inkSoft,
    marginTop: 2,
  },
  checkIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.banyanGreen,
  },
});
