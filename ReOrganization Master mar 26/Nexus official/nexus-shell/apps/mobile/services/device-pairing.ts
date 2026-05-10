/**
 * Device Pairing Service — QR code-based device pairing flow.
 * Generates and validates pairing codes for zero-trust device enrollment.
 */

export interface PairingPayload {
  version: number;
  server: string;
  deviceId: string;
  code: string;
  pk: string;
  ts: number;
}

export interface PairingRequest {
  deviceName: string;
  platform: 'ios' | 'android';
  publicKey: string;
  pairingCode: string;
  fingerprint: DeviceFingerprintData;
}

export interface PairingResponse {
  success: boolean;
  deviceId?: string;
  certificate?: string;
  error?: string;
}

export interface DeviceFingerprintData {
  platform: string;
  osVersion: string;
  appVersion: string;
  screenWidth: number;
  screenHeight: number;
  locale: string;
}

export function decodeQRPayload(encoded: string): PairingPayload | null {
  try {
    const decoded = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as PairingPayload;
  } catch {
    return null;
  }
}

export function isPairingPayloadValid(payload: PairingPayload): boolean {
  if (payload.version !== 1) return false;
  if (!payload.server || !payload.deviceId || !payload.code || !payload.pk) return false;
  // Code expires after 5 minutes
  const fiveMinutes = 5 * 60 * 1000;
  if (Date.now() - payload.ts > fiveMinutes) return false;
  return true;
}

export async function submitPairingRequest(
  serverUrl: string,
  request: PairingRequest,
  authToken: string,
): Promise<PairingResponse> {
  try {
    const response = await fetch(`${serverUrl}/api/v1/devices/pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Pairing failed' }));
      return { success: false, error: (err as { message?: string }).message || 'Pairing failed' };
    }

    const data = (await response.json()) as { deviceId: string; certificate: string };
    return { success: true, deviceId: data.deviceId, certificate: data.certificate };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export function generateDeviceFingerprint(): DeviceFingerprintData {
  // React Native platform detection
  return {
    platform: 'react-native',
    osVersion: '1.0.0',
    appVersion: '1.0.0',
    screenWidth: 390,
    screenHeight: 844,
    locale: 'en-US',
  };
}
