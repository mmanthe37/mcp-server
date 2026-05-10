/**
 * Connection Manager — handles WebSocket with future QUIC upgrade path.
 * Supports reconnection, multi-path bonding, and connection mode selection.
 */

import type { ConnectionState, Identifier } from '@nexus-shell/shared-types';

export type ConnectionMode = 'local' | 'cloud-relay' | 'p2p-mesh' | 'direct-wan';

export interface ConnectionManagerConfig {
  serverUrl: string;
  mode: ConnectionMode;
  authToken: string;
  reconnectMaxAttempts: number;
  reconnectBaseDelay: number;
  heartbeatInterval: number;
}

export class ConnectionManager {
  private ws: WebSocket | null = null;
  private state: ConnectionState = {
    status: 'disconnected',
    reconnectAttempts: 0,
    protocol: 'websocket',
  };

  private readonly config: ConnectionManagerConfig;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private onMessageCallback?: (data: ArrayBuffer | string) => void;
  private onStateChangeCallback?: (state: ConnectionState) => void;

  constructor(config: ConnectionManagerConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.updateState({ status: 'connecting' });

    try {
      const url = `${this.config.serverUrl}?token=${this.config.authToken}&mode=${this.config.mode}`;
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.updateState({
          status: 'connected',
          reconnectAttempts: 0,
          lastConnectedAt: new Date().toISOString(),
        });
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        this.onMessageCallback?.(event.data);
      };

      this.ws.onclose = () => {
        this.cleanup();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.updateState({ status: 'error' });
      };
    } catch {
      this.updateState({ status: 'error' });
      this.scheduleReconnect();
    }
  }

  send(data: ArrayBuffer | string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  disconnect(): void {
    this.cleanup();
    this.ws?.close();
    this.ws = null;
    this.updateState({ status: 'disconnected', reconnectAttempts: 0 });
  }

  onMessage(callback: (data: ArrayBuffer | string) => void): void {
    this.onMessageCallback = callback;
  }

  onStateChange(callback: (state: ConnectionState) => void): void {
    this.onStateChangeCallback = callback;
  }

  getState(): ConnectionState {
    return { ...this.state };
  }

  private scheduleReconnect(): void {
    if (this.state.reconnectAttempts >= this.config.reconnectMaxAttempts) {
      this.updateState({ status: 'disconnected' });
      return;
    }

    const delay = this.config.reconnectBaseDelay * Math.pow(2, this.state.reconnectAttempts);
    const jitter = delay * 0.2 * Math.random();

    this.updateState({
      status: 'reconnecting',
      reconnectAttempts: this.state.reconnectAttempts + 1,
    });

    this.reconnectTimer = setTimeout(() => this.connect(), delay + jitter);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const msg = JSON.stringify({ type: 'heartbeat', timestamp: Date.now() });
      this.send(msg);
    }, this.config.heartbeatInterval);
  }

  private cleanup(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
  }

  private updateState(partial: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...partial };
    this.onStateChangeCallback?.({ ...this.state });
  }
}
