import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

export type BadgeStatus = 'online' | 'offline' | 'warning' | 'error' | 'info';

export interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  style?: ViewStyle;
}

const statusColors: Record<BadgeStatus, string> = {
  online: colors.success,
  offline: colors.textSecondary,
  warning: colors.warning,
  error: colors.error,
  info: colors.primary,
};

export function StatusBadge({ status, label, style }: StatusBadgeProps) {
  const bg = statusColors[status];
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.dot, { backgroundColor: bg }]} />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: borderRadius.full },
  label: { color: colors.textPrimary, fontSize: 12, marginLeft: spacing.xs },
});
