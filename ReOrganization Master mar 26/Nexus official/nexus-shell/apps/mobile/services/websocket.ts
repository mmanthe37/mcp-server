import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';

type MessageHandler = (data: ArrayBuffer | string) => void;
type VoidHandler = () => void;
type ErrorHandler = (err: Event | string) => void;

const WS_BASE = process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:3000';

export class NexusWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnects = 10;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  connect(): void {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    useSessionStore.getState().setConnectionStatus('connecting');

    this.ws = new WebSocket(
      `${WS_BASE}/ws/session/${this.sessionId}?token=${accessToken}`,
    );
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      useSessionStore.getState().setConnectionStatus('connected');
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      const handlers = this.handlers.get('message');
      if (handlers) {
        handlers.forEach((handler) => handler(event.data));
      }
    };

    this.ws.onerror = () => {
      this.emit('error', 'WebSocket error');
    };

    this.ws.onclose = (event) => {
      this.stopPing();
      useSessionStore.getState().setConnectionStatus('disconnected');

      if (!event.wasClean && this.reconnectAttempts < this.maxReconnects) {
        this.reconnect();
      }
    };
  }

  private reconnect(): void {
    this.reconnectAttempts++;
    useSessionStore.getState().setConnectionStatus('reconnecting');

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000,
    );

    setTimeout(() => this.connect(), delay);
  }

  send(data: string | ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  sendInput(input: string): void {
    this.send(JSON.stringify({ type: 'input', payload: input }));
  }

  sendResize(cols: number, rows: number): void {
    this.send(JSON.stringify({ type: 'resize', payload: { cols, rows } }));
  }

  on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  private emit(event: string, data: unknown): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data as ArrayBuffer | string));
    }
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const start = Date.now();
        this.send(JSON.stringify({ type: 'ping', ts: start }));
      }
    }, 10000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect(): void {
    this.maxReconnects = 0;
    this.stopPing();
    this.ws?.close(1000, 'Client disconnect');
    this.ws = null;
    this.handlers.clear();
    useSessionStore.getState().setConnectionStatus('disconnected');
  }
}

/**
 * NexusFlowWebSocket — Adapter used by useTerminal and useNexusFlow hooks.
 * Provides callback-style API (onMessage, onOpen, etc.) over NexusWebSocket.
 */
export class NexusFlowWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnects = 10;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  private messageHandlers = new Set<MessageHandler>();
  private openHandlers = new Set<VoidHandler>();
  private closeHandlers = new Set<VoidHandler>();
  private errorHandlers = new Set<ErrorHandler>();

  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  connect(): void {
    const wsUrl = `${this.url}${this.url.includes('?') ? '&' : '?'}token=${this.token}`;
    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startPing();
      this.openHandlers.forEach((h) => h());
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.messageHandlers.forEach((h) => h(event.data));
    };

    this.ws.onerror = (event: Event) => {
      this.errorHandlers.forEach((h) => h(event));
    };

    this.ws.onclose = (event) => {
      this.stopPing();
      this.closeHandlers.forEach((h) => h());

      if (!event.wasClean && this.reconnectAttempts < this.maxReconnects) {
        this.reconnectAttempts++;
        const delay = Math.min(
          this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
          30000,
        );
        setTimeout(() => this.connect(), delay);
      }
    };
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  onOpen(handler: VoidHandler): void {
    this.openHandlers.add(handler);
  }

  onClose(handler: VoidHandler): void {
    this.closeHandlers.add(handler);
  }

  onError(handler: ErrorHandler): void {
    this.errorHandlers.add(handler);
  }

  send(data: string | ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  sendInput(input: string): void {
    this.send(JSON.stringify({ type: 'input', payload: input }));
  }

  sendResize(cols: number, rows: number): void {
    this.send(JSON.stringify({ type: 'resize', payload: { cols, rows } }));
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
      }
    }, 10000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  close(): void {
    this.maxReconnects = 0;
    this.stopPing();
    this.ws?.close(1000, 'Client disconnect');
    this.ws = null;
    this.messageHandlers.clear();
    this.openHandlers.clear();
    this.closeHandlers.clear();
    this.errorHandlers.clear();
  }
}
