import { useRef, useCallback, useState, useEffect } from 'react';
import { NexusFlowWebSocket } from '../services/websocket';

export interface NexusFlowStats {
  latency: number;
  framesReceived: number;
  framesSent: number;
  bytesReceived: number;
  bytesSent: number;
  reconnectCount: number;
  connectionUptime: number;
}

export interface UseNexusFlowOptions {
  serverUrl: string;
  token: string;
  autoConnect?: boolean;
  enableSpeculativeEcho?: boolean;
  compressionEnabled?: boolean;
}

export function useNexusFlow({
  serverUrl,
  token,
  autoConnect = false,
  enableSpeculativeEcho = true,
  compressionEnabled = true,
}: UseNexusFlowOptions) {
  const wsRef = useRef<NexusFlowWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<NexusFlowStats>({
    latency: 0,
    framesReceived: 0,
    framesSent: 0,
    bytesReceived: 0,
    bytesSent: 0,
    reconnectCount: 0,
    connectionUptime: 0,
  });
  const connectTimeRef = useRef<number>(0);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current) return;

    const ws = new NexusFlowWebSocket(serverUrl, token);

    ws.onOpen(() => {
      setIsConnected(true);
      connectTimeRef.current = Date.now();
      // Negotiate capabilities
      ws.send(
        JSON.stringify({
          type: 'negotiate',
          capabilities: {
            speculativeEcho: enableSpeculativeEcho,
            compression: compressionEnabled ? 'lz4' : 'none',
            deltaEncoding: true,
            protocolVersion: '1.0.0',
          },
        })
      );
    });

    ws.onClose(() => {
      setIsConnected(false);
      connectTimeRef.current = 0;
    });

    ws.connect();
    wsRef.current = ws;
  }, [serverUrl, token, enableSpeculativeEcho, compressionEnabled]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const sendFrame = useCallback(
    (type: string, payload: any) => {
      if (!wsRef.current || !isConnected) return;
      wsRef.current.send(JSON.stringify({ type, ...payload }));
      setStats((prev) => ({ ...prev, framesSent: prev.framesSent + 1 }));
    },
    [isConnected]
  );

  const onFrame = useCallback(
    (handler: (type: string, payload: any) => void) => {
      wsRef.current?.onMessage((data) => {
        if (typeof data === 'string') {
          try {
            const msg = JSON.parse(data);
            handler(msg.type, msg);
            setStats((prev) => ({ ...prev, framesReceived: prev.framesReceived + 1 }));
          } catch {
            // ignore malformed frames
          }
        }
      });
    },
    []
  );

  // Update uptime stat periodically
  useEffect(() => {
    if (isConnected) {
      statsIntervalRef.current = setInterval(() => {
        setStats((prev) => ({
          ...prev,
          connectionUptime: connectTimeRef.current ? Date.now() - connectTimeRef.current : 0,
        }));
      }, 5000);
    }
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, [isConnected]);

  useEffect(() => {
    if (autoConnect) connect();
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    stats,
    connect,
    disconnect,
    sendFrame,
    onFrame,
  };
}
