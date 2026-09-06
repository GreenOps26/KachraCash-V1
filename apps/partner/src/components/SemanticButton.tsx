import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { partnerTheme } from '../theme/partnerTheme.js';

interface SemanticButtonProps {
  variant: 'affirmation' | 'alert' | 'caution' | 'financial';
  label: string;
  sublabel?: string;
  icon?: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
}

export const SemanticButton: React.FC<SemanticButtonProps> = ({
  variant,
  label,
  sublabel,
  icon,
  onPress,
  style,
  disabled = false,
  loading = false,
}) => {
  const bgColor = disabled ? '#374151' : partnerTheme.colors[variant];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor },
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${sublabel || ''}`}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
          {sublabel ? (
            <Text style={[styles.sublabel, disabled && styles.sublabelDisabled]}>{sublabel}</Text>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: partnerTheme.touch.minHeight,
    minWidth: partnerTheme.touch.minWidth,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    borderWidth: 2,
    borderColor: '#ffffff33',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    borderColor: '#4b5563',
    elevation: 0,
    shadowOpacity: 0,
  },
  icon: {
    fontSize: 28,
    marginBottom: 4,
  },
  label: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  labelDisabled: {
    color: '#9ca3af',
  },
  sublabel: {
    color: '#ffffffcc',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  sublabelDisabled: {
    color: '#6b7280',
  },
});
