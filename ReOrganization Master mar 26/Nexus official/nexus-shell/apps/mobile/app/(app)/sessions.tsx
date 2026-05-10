/**
 * Sessions Screen — Terminal session management.
 * Lists active sessions, allows create/attach/terminate.
 */

import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SessionList from '../../components/SessionList';
import { useSessionStore } from '../../stores/sessionStore';
import type { SessionRecord } from '@nexus-shell/shared-types';

export default function SessionsScreen() {
  const router = useRouter();
  const {
    sessions,
    activeSessionId,
    isLoading,
    fetchSessions,
    createSession,
    terminateSession,
    attachSession,
  } = useSessionStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleAttach = useCallback(
    (session: SessionRecord) => {
      attachSession(session.id);
      router.push('/(app)/terminal');
    },
    [attachSession, router],
  );

  const handleTerminate = useCallback(
    async (session: SessionRecord) => {
      await terminateSession(session.id);
    },
    [terminateSession],
  );

  const handleCreate = useCallback(async () => {
    const session = await createSession('Terminal', 'default');
    if (session) {
      router.push('/(app)/terminal');
    }
  }, [createSession, router]);

  return (
    <View style={styles.container}>
      <SessionList
        sessions={sessions}
        activeSessionId={activeSessionId}
        loading={isLoading}
        onAttach={handleAttach}
        onTerminate={handleTerminate}
        onCreate={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
});
