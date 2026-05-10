import { useCallback } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { TerminalView, TerminalInput } from '../../components/terminal';
import { useTerminalSession } from '../../hooks/useTerminalSession';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';

export default function TerminalScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fontSize = useSettingsStore((s) => s.terminal.fontSize);
  const token = useAuthStore((s) => s.token);

  const {
    cells,
    cursorRow,
    cursorCol,
    cols,
    rows,
    connectionState,
    latency,
    sendInput,
    resize,
    disconnect,
  } = useTerminalSession({
    sessionId: sessionId ?? '',
    serverUrl: 'ws://localhost:3000',
    token: token ?? '',
    cols: 80,
    rows: 24,
  });

  const isConnected = connectionState === 'connected';

  const handleCommand = useCallback(
    (text: string) => {
      sendInput(text + '\n');
    },
    [sendInput],
  );

  const handleSpecialKey = useCallback(
    (key: string) => {
      const keyMap: Record<string, string> = {
        tab: '\t', escape: '\x1b', 'ctrl-c': '\x03',
        'ctrl-d': '\x04', 'ctrl-z': '\x1a', 'ctrl-l': '\x0c',
        up: '\x1b[A', down: '\x1b[B', left: '\x1b[D', right: '\x1b[C',
      };
      const seq = keyMap[key];
      if (seq) sendInput(seq);
    },
    [sendInput],
  );

  const handleDisconnect = useCallback(() => {
    disconnect();
    router.back();
  }, [disconnect]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a1a' : '#1a1a2e' }]}>
      <StatusBar barStyle="light-content" />

      {/* Header bar with session info */}
      <View style={styles.header}>
        <Pressable onPress={handleDisconnect} style={styles.backBtn}>
          <Text style={styles.backText}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {sessionId ?? 'Terminal'}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? '#00ff88' : '#ff4444' }]} />
        {latency > 0 && <Text style={styles.latencyText}>{latency}ms</Text>}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 20}
      >
        {/* Phase 2 SGR-aware terminal display */}
        <TerminalView
          cells={cells}
          cursorRow={cursorRow}
          cursorCol={cursorCol}
          rows={rows}
          cols={cols}
          fontSize={fontSize}
        />

        {/* Phase 2 contextual input bar with AI suggestions */}
        <TerminalInput
          onSubmit={handleCommand}
          connected={isConnected}
        />

        {/* Quick-access special keys */}
        <View style={styles.specialKeys}>
          {['tab', 'ctrl-c', 'ctrl-d', 'esc', '↑', '↓'].map((label) => {
            const key = label === 'esc' ? 'escape' : label === '↑' ? 'up' : label === '↓' ? 'down' : label;
            return (
              <Pressable
                key={label}
                onPress={() => handleSpecialKey(key)}
                style={({ pressed }) => [styles.skBtn, pressed && styles.skPressed]}
              >
                <Text style={styles.skLabel}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 54 : 12,
    paddingBottom: 8,
    backgroundColor: '#0d0d1f',
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a4a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { color: '#ff6666', fontSize: 14, fontWeight: '700' },
  headerTitle: {
    flex: 1,
    color: '#e0e0ff',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  latencyText: {
    color: '#88889a',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  specialKeys: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#0d0d1f',
  },
  skBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2a2a4a',
    borderRadius: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  skPressed: { opacity: 0.6 },
  skLabel: {
    color: '#00d4ff',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
});
