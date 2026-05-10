import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface SessionCardProps {
  id: string;
  machineName: string;
  status: 'active' | 'idle' | 'disconnected' | 'terminated';
  lastActivity: string;
  shellType: string;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
}

const STATUS_COLORS: Record<SessionCardProps['status'], string> = {
  active: '#9ece6a',
  idle: '#e0af68',
  disconnected: '#f7768e',
  terminated: '#565f89',
};

export default function SessionCard({
  id,
  machineName,
  status,
  lastActivity,
  shellType,
  onPress,
  onLongPress,
}: SessionCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(id)}
      onLongPress={() => onLongPress?.(id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Session on ${machineName}, status ${status}`}
      accessibilityHint="Tap to open this terminal session"
    >
      <View style={styles.header}>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
        <Text style={styles.machineName} numberOfLines={1}>
          {machineName}
        </Text>
        <Text style={styles.shellBadge}>{shellType}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.statusText}>{status}</Text>
        <Text style={styles.timestamp}>{lastActivity}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1b26',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#292e42',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  machineName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#c0caf5',
  },
  shellBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7aa2f7',
    backgroundColor: '#7aa2f722',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    color: '#565f89',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: '#565f89',
  },
});
