import { useEffect, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import DeviceCard from '../../components/DeviceCard';
import { useDeviceStore } from '../../stores/deviceStore';
import { apiClient } from '../../services/api';
import type { DeviceRecord } from '@nexus-shell/shared-types';

export default function DevicesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { devices, setDevices, currentDeviceId } = useDeviceStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await apiClient.get<{ devices: DeviceRecord[] }>('/api/devices');
      setDevices(res.devices);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch devices');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDevices().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  }, []);

  const handleRevoke = useCallback(async (deviceId: string) => {
    Alert.alert('Revoke Device', 'This device will lose access. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/devices/${deviceId}`);
            await fetchDevices();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to revoke device');
          }
        },
      },
    ]);
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#0a0a1a' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a1a' : '#f5f5f5' }]}>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DeviceCard
            id={item.id}
            name={item.nickname}
            platform={item.platform as any}
            trusted={item.trusted}
            lastSeen={item.lastSeenAt ?? 'Unknown'}
            isCurrentDevice={item.id === currentDeviceId}
            onPress={() => {}}
            onRevoke={() => handleRevoke(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: isDark ? '#888' : '#666' }]}>
              No paired devices
            </Text>
          </View>
        }
      />
      <Pressable
        style={({ pressed }) => [styles.pairBtn, pressed && { opacity: 0.7 }]}
        onPress={() => Alert.alert('Pair Device', 'QR code pairing coming soon')}
      >
        <Text style={styles.pairBtnText}>+ Pair New Device</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 80 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16 },
  pairBtn: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#00d4ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  pairBtnText: { color: '#0a0a1a', fontSize: 16, fontWeight: '700' },
});
