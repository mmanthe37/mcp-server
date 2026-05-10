import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface DeviceCardProps {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'macos' | 'linux' | 'windows';
  trusted: boolean;
  lastSeen: string;
  isCurrentDevice: boolean;
  onPress: (id: string) => void;
  onRevoke?: (id: string) => void;
}

const PLATFORM_ICONS: Record<DeviceCardProps['platform'], string> = {
  ios: '📱',
  android: '🤖',
  macos: '💻',
  linux: '🐧',
  windows: '🪟',
};

export default function DeviceCard({
  id,
  name,
  platform,
  trusted,
  lastSeen,
  isCurrentDevice,
  onPress,
  onRevoke,
}: DeviceCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isCurrentDevice && styles.currentDevice]}
      onPress={() => onPress(id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${platform}, ${trusted ? 'trusted' : 'untrusted'}`}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{PLATFORM_ICONS[platform]}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {isCurrentDevice && <Text style={styles.currentBadge}>This Device</Text>}
        </View>
        <Text style={styles.meta}>
          {platform} · {trusted ? '✓ Trusted' : '⚠ Untrusted'} · {lastSeen}
        </Text>
      </View>
      {!isCurrentDevice && onRevoke && (
        <TouchableOpacity
          style={styles.revokeBtn}
          onPress={() => onRevoke(id)}
          accessibilityLabel="Revoke device trust"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.revokeText}>Revoke</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1b26',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#292e42',
  },
  currentDevice: {
    borderColor: '#7aa2f744',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#24283b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#c0caf5',
    marginRight: 8,
  },
  currentBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7aa2f7',
    backgroundColor: '#7aa2f722',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  meta: {
    fontSize: 12,
    color: '#565f89',
  },
  revokeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  revokeText: {
    fontSize: 13,
    color: '#f7768e',
    fontWeight: '600',
  },
});
