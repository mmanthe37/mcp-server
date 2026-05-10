/**
 * Session List Component — Displays active terminal sessions.
 * Supports session create, attach, and terminate actions.
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { SessionRecord, SessionStatus } from '@nexus-shell/shared-types';

interface SessionListProps {
  sessions: SessionRecord[];
  activeSessionId: string | null;
  loading: boolean;
  onAttach: (session: SessionRecord) => void;
  onTerminate: (session: SessionRecord) => void;
  onCreate: () => void;
}

function statusColor(status: SessionStatus): string {
  switch (status) {
    case 'active': return '#34C759';
    case 'suspended': return '#FF9500';
    case 'creating': return '#5AC8FA';
    case 'terminated': return '#FF3B30';
    default: return '#8E8E93';
  }
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SessionCard({
  session,
  isActive,
  onAttach,
  onTerminate,
}: {
  session: SessionRecord;
  isActive: boolean;
  onAttach: () => void;
  onTerminate: () => void;
}) {
  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      <View style={styles.cardHeader}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(session.status) }]} />
          <Text style={styles.sessionName}>{session.shell}</Text>
        </View>
        <Text style={styles.sessionTime}>{formatRelativeTime(session.startedAt)}</Text>
      </View>

      <View style={styles.sessionMeta}>
        <Text style={styles.metaText}>{session.cols}×{session.rows}</Text>
        <Text style={styles.metaText}>·</Text>
        <Text style={styles.metaText}>{session.status}</Text>
      </View>

      <View style={styles.cardActions}>
        {session.status !== 'terminated' && (
          <TouchableOpacity style={styles.btnAttach} onPress={onAttach}>
            <Text style={styles.btnText}>
              {isActive ? 'Active' : 'Attach'}
            </Text>
          </TouchableOpacity>
        )}
        {session.status !== 'terminated' && (
          <TouchableOpacity style={styles.btnTerminate} onPress={onTerminate}>
            <Text style={styles.btnTermText}>End</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function SessionList({
  sessions,
  activeSessionId,
  loading,
  onAttach,
  onTerminate,
  onCreate,
}: SessionListProps) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            isActive={item.id === activeSessionId}
            onAttach={() => onAttach(item)}
            onTerminate={() => onTerminate(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No active sessions</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity style={styles.fab} onPress={onCreate}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#8E8E93', fontSize: 16 },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  cardActive: { borderColor: '#0A84FF' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  sessionName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  sessionTime: { color: '#8E8E93', fontSize: 13 },
  sessionMeta: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  metaText: { color: '#8E8E93', fontSize: 13 },
  cardActions: { flexDirection: 'row', gap: 8 },
  btnAttach: {
    flex: 1,
    backgroundColor: '#0A84FF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnTerminate: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  btnTermText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
