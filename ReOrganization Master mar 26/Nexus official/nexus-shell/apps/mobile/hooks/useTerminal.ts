import { useState, useCallback, useRef, useEffect } from 'react';
import { NexusFlowWebSocket } from '../services/websocket';
import type { TerminalLine } from '../components/TerminalView';

let lineIdCounter = 0;
function nextLineId(): string {
  return `line-${++lineIdCounter}-${Date.now()}`;
}

export interface UseTerminalOptions {
  sessionId: string;
  serverUrl: string;
  token: string;
  onDisconnect?: () => void;
  onReconnect?: () => void;
}

export function useTerminal({ sessionId, serverUrl, token, onDisconnect, onReconnect }: UseTerminalOptions) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<NexusFlowWebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appendLine = useCallback((text: string, type: TerminalLine['type'] = 'stdout') => {
    const newLines = text.split('\n').map((t) => ({
      id: nextLineId(),
      text: t,
      type,
      timestamp: Date.now(),
    }));
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const connect = useCallback(async () => {
    if (wsRef.current || isConnecting) return;
    setIsConnecting(true);

    try {
      const ws = new NexusFlowWebSocket(serverUrl, token);

      ws.onMessage((data) => {
        if (typeof data === 'string') {
          try {
            const msg = JSON.parse(data);
            if (msg.type === 'output') {
              appendLine(msg.data, 'stdout');
            } else if (msg.type === 'error') {
              appendLine(msg.data, 'stderr');
            } else if (msg.type === 'system') {
              appendLine(msg.data, 'system');
            }
          } catch {
            appendLine(data, 'stdout');
          }
        }
      });

      ws.onOpen(() => {
        setIsConnected(true);
        setIsConnecting(false);
        appendLine(`Connected to session ${sessionId}`, 'system');
        // Attach to session
        ws.send(JSON.stringify({ type: 'attach', sessionId }));
        onReconnect?.();
      });

      ws.onClose(() => {
        setIsConnected(false);
        wsRef.current = null;
        appendLine('Connection closed', 'system');
        onDisconnect?.();
        // Auto-reconnect after 3s
        reconnectTimer.current = setTimeout(() => connect(), 3000);
      });

      ws.onError((err) => {
        appendLine(`Connection error: ${err}`, 'stderr');
        setIsConnecting(false);
      });

      ws.connect();
      wsRef.current = ws;
    } catch (err) {
      setIsConnecting(false);
      appendLine(`Failed to connect: ${err}`, 'stderr');
    }
  }, [serverUrl, token, sessionId, isConnecting, appendLine, onDisconnect, onReconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const sendInput = useCallback(
    (text: string) => {
      if (!wsRef.current || !isConnected) return;
      wsRef.current.send(JSON.stringify({ type: 'input', data: text + '\n', sessionId }));
      appendLine(text, 'stdin');
    },
    [isConnected, sessionId, appendLine]
  );

  const sendResize = useCallback(
    (cols: number, rows: number) => {
      if (!wsRef.current || !isConnected) return;
      wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows, sessionId }));
    },
    [isConnected, sessionId]
  );

  const clearOutput = useCallback(() => {
    setLines([]);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    lines,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendInput,
    sendResize,
    clearOutput,
  };
}
