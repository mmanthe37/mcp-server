/**
 * HapticButton — Button with haptic feedback for terminal interactions.
 * Provides tactile response for key presses and actions.
 */

import React, { useCallback, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

interface HapticButtonProps {
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
  hapticStyle?: HapticStyle;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// Haptic feedback (real impl uses expo-haptics)
async function triggerHaptic(style: HapticStyle): Promise<void> {
  try {
    const Haptics = await import('expo-haptics');
    switch (style) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // Haptics not available (simulator, Android without support)
  }
}

export default function HapticButton({
  label,
  onPress,
  onLongPress,
  hapticStyle = 'light',
  variant = 'default',
  size = 'medium',
  icon,
  disabled = false,
  style,
  textStyle,
}: HapticButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    void triggerHaptic(hapticStyle);
    onPress();
  }, [disabled, hapticStyle, onPress]);

  const handleLongPress = useCallback(() => {
    if (disabled || !onLongPress) return;
    void triggerHaptic('heavy');
    onLongPress();
  }, [disabled, onLongPress]);

  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const disabledStyle = disabled ? styles.disabled : undefined;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.base, variantStyle.container, sizeStyle.container, disabledStyle, style]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {icon && <Text style={[sizeStyle.icon, variantStyle.text]}>{icon}</Text>}
        <Text style={[variantStyle.text, sizeStyle.text, textStyle]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  disabled: {
    opacity: 0.4,
  },
});

const variantStyles = {
  default: StyleSheet.create({
    container: { backgroundColor: '#2C2C2E', borderRadius: 10 },
    text: { color: '#FFFFFF', fontWeight: '500' as const },
  }),
  primary: StyleSheet.create({
    container: { backgroundColor: '#0A84FF', borderRadius: 10 },
    text: { color: '#FFFFFF', fontWeight: '600' as const },
  }),
  danger: StyleSheet.create({
    container: { backgroundColor: '#FF453A', borderRadius: 10 },
    text: { color: '#FFFFFF', fontWeight: '600' as const },
  }),
  ghost: StyleSheet.create({
    container: { backgroundColor: 'transparent' },
    text: { color: '#0A84FF', fontWeight: '500' as const },
  }),
};

const sizeStyles = {
  small: StyleSheet.create({
    container: { paddingHorizontal: 10, paddingVertical: 6 },
    text: { fontSize: 13 },
    icon: { fontSize: 14 },
  }),
  medium: StyleSheet.create({
    container: { paddingHorizontal: 16, paddingVertical: 10 },
    text: { fontSize: 15 },
    icon: { fontSize: 16 },
  }),
  large: StyleSheet.create({
    container: { paddingHorizontal: 20, paddingVertical: 14 },
    text: { fontSize: 17 },
    icon: { fontSize: 20 },
  }),
};
