import React from 'react';
import { TextInput, View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

export interface NexusInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  style?: ViewStyle;
}

export function NexusInput({
  value,
  onChangeText,
  placeholder,
  label,
  secureTextEntry,
  autoCapitalize = 'none',
  error,
  style,
}: NexusInputProps) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        style={[styles.input, error ? styles.inputError : undefined]}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { color: colors.textPrimary, fontSize: 14, marginBottom: spacing.xs, fontWeight: '500' },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: { borderColor: colors.error },
  error: { color: colors.error, fontSize: 12, marginTop: spacing.xs },
});
