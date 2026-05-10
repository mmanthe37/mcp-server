import React, { type ReactNode } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

export interface NexusCardProps {
  title?: string;
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  style?: ViewStyle;
}

export function NexusCard({ title, children, variant = 'default', style }: NexusCardProps) {
  const variantStyle = variant === 'elevated' ? styles.elevated
    : variant === 'outlined' ? styles.outlined
    : styles.default;

  return (
    <View style={[styles.base, variantStyle, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  default: {},
  elevated: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  outlined: { borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: spacing.sm },
});
