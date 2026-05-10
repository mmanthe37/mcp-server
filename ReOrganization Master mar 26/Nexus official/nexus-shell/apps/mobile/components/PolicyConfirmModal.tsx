/**
 * PolicyConfirmModal — Confirmation gate for elevated/dangerous commands.
 * Shows risk assessment and requires explicit user approval.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import type { PolicyCheckResult } from '../services/policy-service';

interface PolicyConfirmModalProps {
  visible: boolean;
  command: string;
  policyResult: PolicyCheckResult;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PolicyConfirmModal({
  visible,
  command,
  policyResult,
  onConfirm,
  onCancel,
}: PolicyConfirmModalProps) {
  const isDangerous = policyResult.riskLevel === 'dangerous';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, isDangerous ? styles.headerDanger : styles.headerWarning]}>
            <Text style={styles.headerIcon}>{isDangerous ? '🛑' : '⚠️'}</Text>
            <Text style={styles.headerTitle}>
              {isDangerous ? 'Dangerous Command' : 'Elevated Command'}
            </Text>
          </View>

          {/* Command preview */}
          <View style={styles.commandBox}>
            <Text style={styles.commandText} numberOfLines={3}>
              {command}
            </Text>
          </View>

          {/* Risk message */}
          <Text style={styles.riskMessage}>{policyResult.message}</Text>

          {/* Alternatives */}
          {policyResult.alternatives && policyResult.alternatives.length > 0 && (
            <View style={styles.alternatives}>
              <Text style={styles.altTitle}>Suggestions:</Text>
              {policyResult.alternatives.map((alt, i) => (
                <Text key={i} style={styles.altText}>• {alt}</Text>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, isDangerous ? styles.confirmDanger : styles.confirmWarning]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>
                {isDangerous ? 'Execute Anyway' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  headerDanger: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  headerWarning: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  commandBox: {
    backgroundColor: '#000000',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
  },
  commandText: {
    color: '#FF453A',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  riskMessage: {
    color: '#EBEBF5',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  alternatives: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  altTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  altText: {
    color: '#EBEBF5',
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  confirmDanger: {
    backgroundColor: '#FF453A',
  },
  confirmWarning: {
    backgroundColor: '#FF9500',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
