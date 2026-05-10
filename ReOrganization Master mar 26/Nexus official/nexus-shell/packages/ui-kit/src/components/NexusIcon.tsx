import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { colors } from '../theme';

export interface NexusIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: TextStyle;
}

// Placeholder icon component — will be replaced with a proper icon library (e.g. @expo/vector-icons)
export function NexusIcon({ name, size = 24, color = colors.textPrimary, style }: NexusIconProps) {
  return (
    <Text style={[{ fontSize: size, color, textAlign: 'center' }, style]}>
      {iconMap[name] ?? '?'}
    </Text>
  );
}

const iconMap: Record<string, string> = {
  terminal: '⌘',
  settings: '⚙',
  lock: '🔒',
  unlock: '🔓',
  wifi: '📶',
  alert: '⚠',
  check: '✓',
  close: '✕',
  add: '+',
  search: '🔍',
  user: '👤',
  device: '💻',
  server: '🖥',
};
