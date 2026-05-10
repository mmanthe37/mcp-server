import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYCHAIN_SERVICE = 'com.nexusshell.app';

export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async delete(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  async setJSON<T>(key: string, value: T): Promise<void> {
    await secureStorage.set(key, JSON.stringify(value));
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await secureStorage.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /** Store device identity certificates and private keys */
  async storeDeviceIdentity(deviceId: string, certificate: string, privateKey: string): Promise<void> {
    await secureStorage.set(`device-cert-${deviceId}`, certificate);
    await secureStorage.set(`device-key-${deviceId}`, privateKey);
  },

  async getDeviceIdentity(deviceId: string): Promise<{ certificate: string; privateKey: string } | null> {
    const certificate = await secureStorage.get(`device-cert-${deviceId}`);
    const privateKey = await secureStorage.get(`device-key-${deviceId}`);
    if (!certificate || !privateKey) return null;
    return { certificate, privateKey };
  },

  async clearDeviceIdentity(deviceId: string): Promise<void> {
    await secureStorage.delete(`device-cert-${deviceId}`);
    await secureStorage.delete(`device-key-${deviceId}`);
  },

  /** Check biometric availability (iOS Face ID/Touch ID, Android BiometricPrompt) */
  async isBiometricAvailable(): Promise<boolean> {
    // expo-local-authentication check
    try {
      const LocalAuth = require('expo-local-authentication');
      const compatible = await LocalAuth.hasHardwareAsync();
      const enrolled = await LocalAuth.isEnrolledAsync();
      return compatible && enrolled;
    } catch {
      return false;
    }
  },

  async authenticateWithBiometric(promptMessage = 'Authenticate to NexusShell'): Promise<boolean> {
    try {
      const LocalAuth = require('expo-local-authentication');
      const result = await LocalAuth.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    }
  },
};
