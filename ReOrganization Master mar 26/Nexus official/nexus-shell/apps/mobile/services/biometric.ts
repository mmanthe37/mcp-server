/**
 * Biometric Authentication Service — Face ID / fingerprint wrapper.
 * Cross-platform biometric auth using expo-local-authentication.
 */

type LocalAuth = {
  hasHardwareAsync: () => Promise<boolean>;
  isEnrolledAsync: () => Promise<boolean>;
  authenticateAsync: (options?: { promptMessage?: string; cancelLabel?: string; disableDeviceFallback?: boolean }) => Promise<{ success: boolean; error?: string }>;
  supportedAuthenticationTypesAsync: () => Promise<number[]>;
};

let _localAuth: LocalAuth | null = null;

async function getLocalAuth(): Promise<LocalAuth> {
  if (!_localAuth) {
    const mod = await import('expo-local-authentication');
    _localAuth = mod as unknown as LocalAuth;
  }
  return _localAuth;
}

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'none';

export interface BiometricCapability {
  available: boolean;
  enrolled: boolean;
  types: BiometricType[];
}

export async function checkBiometricCapability(): Promise<BiometricCapability> {
  try {
    const auth = await getLocalAuth();
    const available = await auth.hasHardwareAsync();
    const enrolled = available ? await auth.isEnrolledAsync() : false;
    const rawTypes = available ? await auth.supportedAuthenticationTypesAsync() : [];

    const types: BiometricType[] = rawTypes.map((t: number) => {
      switch (t) {
        case 1: return 'fingerprint';
        case 2: return 'face';
        case 3: return 'iris';
        default: return 'none';
      }
    }).filter((t): t is BiometricType => t !== 'none');

    return { available, enrolled, types };
  } catch {
    return { available: false, enrolled: false, types: [] };
  }
}

export async function authenticateWithBiometric(
  promptMessage = 'Authenticate to NexusShell',
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getLocalAuth();
    const result = await auth.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return { success: result.success, error: result.error };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function requireBiometricAuth(
  promptMessage?: string,
): Promise<void> {
  const capability = await checkBiometricCapability();
  if (!capability.available || !capability.enrolled) {
    throw new Error('Biometric authentication not available');
  }

  const result = await authenticateWithBiometric(promptMessage);
  if (!result.success) {
    throw new Error(result.error || 'Biometric authentication failed');
  }
}
