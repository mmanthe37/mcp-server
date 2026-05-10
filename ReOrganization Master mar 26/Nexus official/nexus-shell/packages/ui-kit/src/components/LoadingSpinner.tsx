import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  label?: string;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = 'small',
  color = colors.primary,
  label,
  style,
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  label: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.sm },
});
