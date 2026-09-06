import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { partnerTheme } from '../theme/partnerTheme.js';
import { speakAssamesePrompt } from '../audio/assamesePrompts.js';

interface SahaayakEmergencyFabProps {
  onEmergencyTriggered?: () => void;
}

export const SahaayakEmergencyFab: React.FC<SahaayakEmergencyFabProps> = ({
  onEmergencyTriggered,
}) => {
  const [holding, setHolding] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePressIn = () => {
    setHolding(true);
    timerRef.current = setTimeout(() => {
      setHolding(false);
      speakAssamesePrompt('emergency');
      Alert.alert(
        '🚨 SAHAAYAK SOS CONNECTED',
        'Guwahati Logistics Desk has been notified of your location. Dispatch officer is calling you now.',
      );
      if (onEmergencyTriggered) onEmergencyTriggered();
    }, 3000); // 3-second continuous press contract
  };

  const handlePressOut = () => {
    setHolding(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <View style={styles.fabContainer}>
      <TouchableOpacity
        style={[styles.fab, holding && styles.fabHolding]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Text style={styles.sosIcon}>🆘</Text>
        <Text style={styles.fabLabel}>{holding ? 'HOLD 3s' : 'SOS'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 999,
  },
  fab: {
    width: partnerTheme.touch.fabSize,
    height: partnerTheme.touch.fabSize,
    borderRadius: partnerTheme.touch.fabSize / 2,
    backgroundColor: partnerTheme.colors.alert,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabHolding: {
    backgroundColor: '#7f1d1d',
    transform: [{ scale: 1.1 }],
  },
  sosIcon: {
    fontSize: 24,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
});
