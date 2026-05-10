import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

export interface NexusButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function NexusButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
}: NexusButtonProps) {
  const bg = variant === 'primary' ? colors.primary
    : variant === 'danger' ? colors.error
    : variant === 'secondary' ? colors.surface
    : 'transparent';

  const textColor = variant === 'ghost' || variant === 'secondary'
    ? colors.primary : colors.textPrimary;

  const paddingV = size === 'sm' ? spacing.xs : size === 'lg' ? spacing.lg : spacing.md;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        { backgroundColor: bg, paddingVertical: paddingV, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 16, fontWeight: '600' },
});
