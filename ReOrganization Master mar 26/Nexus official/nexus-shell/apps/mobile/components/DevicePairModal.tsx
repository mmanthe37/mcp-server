/**
 * Device Pair Modal — QR code scanning + verification for device pairing.
 * Zero-trust enrollment with visual verification code.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

interface DevicePairModalProps {
  visible: boolean;
  onClose: () => void;
  onPairComplete: (deviceId: string) => void;
  serverUrl: string;
  authToken: string;
}

type PairStep = 'input' | 'verifying' | 'success' | 'error';

export default function DevicePairModal({
  visible,
  onClose,
  onPairComplete,
  serverUrl,
  authToken,
}: DevicePairModalProps) {
  const [step, setStep] = useState<PairStep>('input');
  const [pairingCode, setPairingCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pairedDeviceId, setPairedDeviceId] = useState('');

  const handlePair = useCallback(async () => {
    if (!pairingCode || pairingCode.length !== 6) {
      setErrorMsg('Enter a 6-digit pairing code');
      return;
    }

    setStep('verifying');
    setErrorMsg('');

    try {
      const res = await fetch(`${serverUrl}/api/v1/devices/pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          pairingCode,
          deviceName: deviceName || 'My Device',
          platform: 'react-native',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Pairing failed' }));
        throw new Error((err as { message?: string }).message || 'Pairing failed');
      }

      const data = (await res.json()) as { deviceId: string };
      setPairedDeviceId(data.deviceId);
      setStep('success');
    } catch (err) {
      setErrorMsg(String(err));
      setStep('error');
    }
  }, [pairingCode, deviceName, serverUrl, authToken]);

  const handleDone = useCallback(() => {
    onPairComplete(pairedDeviceId);
    setPairingCode('');
    setDeviceName('');
    setStep('input');
    onClose();
  }, [pairedDeviceId, onPairComplete, onClose]);

  const handleReset = useCallback(() => {
    setPairingCode('');
    setErrorMsg('');
    setStep('input');
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {step === 'input' && (
            <>
              <Text style={styles.title}>Pair New Device</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code shown on your computer
              </Text>

              <TextInput
                style={styles.codeInput}
                value={pairingCode}
                onChangeText={setPairingCode}
                placeholder="000000"
                placeholderTextColor="#48484A"
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />

              <TextInput
                style={styles.nameInput}
                value={deviceName}
                onChangeText={setDeviceName}
                placeholder="Device name (optional)"
                placeholderTextColor="#48484A"
              />

              {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

              <TouchableOpacity
                style={[styles.pairBtn, pairingCode.length !== 6 && styles.pairBtnDisabled]}
                onPress={handlePair}
                disabled={pairingCode.length !== 6}
              >
                <Text style={styles.pairBtnText}>Pair Device</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'verifying' && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#0A84FF" />
              <Text style={styles.subtitle}>Verifying pairing code...</Text>
            </View>
          )}

          {step === 'success' && (
            <View style={styles.center}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.title}>Device Paired</Text>
              <Text style={styles.subtitle}>
                Your device has been securely enrolled
              </Text>
              <TouchableOpacity style={styles.pairBtn} onPress={handleDone}>
                <Text style={styles.pairBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'error' && (
            <View style={styles.center}>
              <Text style={styles.errorIcon}>✗</Text>
              <Text style={styles.title}>Pairing Failed</Text>
              <Text style={styles.error}>{errorMsg}</Text>
              <TouchableOpacity style={styles.pairBtn} onPress={handleReset}>
                <Text style={styles.pairBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 48,
    minHeight: 360,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#48484A',
    alignSelf: 'center',
    marginBottom: 20,
  },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 20 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#8E8E93', fontSize: 15, textAlign: 'center', marginBottom: 24 },
  codeInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    fontSize: 28,
    fontFamily: 'monospace',
    color: '#FFFFFF',
    letterSpacing: 12,
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  error: { color: '#FF3B30', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  pairBtn: {
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  pairBtnDisabled: { opacity: 0.4 },
  pairBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  cancelText: { color: '#8E8E93', fontSize: 16 },
  successIcon: { fontSize: 48, color: '#34C759', marginBottom: 12 },
  errorIcon: { fontSize: 48, color: '#FF3B30', marginBottom: 12 },
});
