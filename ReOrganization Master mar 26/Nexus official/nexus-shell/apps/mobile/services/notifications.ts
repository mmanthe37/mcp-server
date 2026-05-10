/**
 * Push Notifications — Session event notifications for NexusShell.
 * Handles registration, permission, and event routing.
 */

import { Platform } from 'react-native';

export type NotificationType =
  | 'session_disconnected'
  | 'session_reconnected'
  | 'command_completed'
  | 'error_detected'
  | 'device_paired'
  | 'security_alert';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

let pushToken: string | null = null;

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const Notifications = await import('expo-notifications');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('nexus-shell', {
        name: 'NexusShell',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0A84FF',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    pushToken = tokenData.data;
    return pushToken;
  } catch {
    return null;
  }
}

export function getPushToken(): string | null {
  return pushToken;
}

export async function scheduleLocalNotification(payload: NotificationPayload): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: { type: payload.type, ...payload.data },
        sound: true,
      },
      trigger: null, // immediate
    });
  } catch {
    // Notifications not available
  }
}

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'session_disconnected': return '🔴';
    case 'session_reconnected': return '🟢';
    case 'command_completed': return '✅';
    case 'error_detected': return '⚠️';
    case 'device_paired': return '🔗';
    case 'security_alert': return '🔒';
  }
}
