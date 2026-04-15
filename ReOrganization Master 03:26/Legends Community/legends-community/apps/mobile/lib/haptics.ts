import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptics = {
  light: () =>
    isNative
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Promise.resolve(),
  medium: () =>
    isNative
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      : Promise.resolve(),
  heavy: () =>
    isNative
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      : Promise.resolve(),
  success: () =>
    isNative
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Promise.resolve(),
  warning: () =>
    isNative
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      : Promise.resolve(),
  error: () =>
    isNative
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      : Promise.resolve(),
  selection: () =>
    isNative ? Haptics.selectionAsync() : Promise.resolve(),
};
