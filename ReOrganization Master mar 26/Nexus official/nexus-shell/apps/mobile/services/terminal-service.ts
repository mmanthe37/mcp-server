/**
 * terminal-service.ts — Orchestrates WebSocket connection, NexusFlow protocol,
 * terminal emulation, and UI state for a single terminal session.
 */

import { EventEmitter } from 'events';
import type { ConnectionState } from '@nexus-shell/shared-types';

export type TerminalServiceState =
  | 'idle'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface TerminalServiceConfig {
  serverUrl: string;
  token: string;
  sessionId?: string;
  cols?: number;
  rows?: number;
  reconnectAttempts?: number;
  reconnectDelayMs?: number;
}

export interface TerminalServiceEvents {
  stateChange: (state: TerminalServiceState) => void;
  output: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  title: (title: string) => void;
  bell: () => void;
  error: (error: Error) => void;
  latency: (ms: number) => void;
}

/**
 * TerminalService manages the full lifecycle of a terminal session:
 *  1. WebSocket connection to server
 *  2. NexusFlow frame encoding/decoding
 *  3. Input forwarding
 *  4. Reconnection with exponential backoff
 */
export class TerminalService extends EventEmitter {
  private ws: WebSocket | null = null;
  private state: TerminalServiceState = 'idle';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private lastPingSent = 0;
  private config: Required<TerminalServiceConfig>;
  private inputBuffer: string[] = [];
  private sessionId: string | null = null;
  private disposed = false;

  constructor(config: TerminalServiceConfig) {
    super();
    this.config = {
      cols: 80,
      rows: 24,
      reconnectAttempts: 10,
      reconnectDelayMs: 1000,
      sessionId: '',
      ...config,
    };
    this.sessionId = config.sessionId ?? null;
  }

  /** Connect to the terminal server. */
  async connect(): Promise<void> {
    if (this.disposed) return;
    this.setState('connecting');

    try {
      const wsUrl = this.config.serverUrl
        .replace(/^http/, 'ws')
        .replace(/\/$/, '');

      const url = this.sessionId
        ? `${wsUrl}/ws/terminal?session=${this.sessionId}`
        : `${wsUrl}/ws/terminal?cols=${this.config.cols}&rows=${this.config.rows}`;

      this.ws = new WebSocket(url, ['nexusflow-v1']);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.setState('authenticating');
        this.ws?.send(JSON.stringify({ type: 'auth', token: this.config.token }));
      };

      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (event) => this.handleError(new Error('WebSocket error'));
      this.ws.onclose = (event) => this.handleClose(event.code, event.reason);
    } catch (err) {
      this.setState('error');
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    }
  }

  /** Send keyboard input to the terminal. */
  write(data: string): void {
    if (this.state !== 'connected') {
      this.inputBuffer.push(data);
      return;
    }
    this.sendFrame('input', data);
  }

  /** Send a resize event. */
  resize(cols: number, rows: number): void {
    this.config.cols = cols;
    this.config.rows = rows;
    if (this.state === 'connected') {
      this.sendFrame('resize', JSON.stringify({ cols, rows }));
    }
    this.emit('resize', cols, rows);
  }

  /** Disconnect and clean up. */
  disconnect(): void {
    this.disposed = true;
    this.clearTimers();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }
    this.setState('disconnected');
  }

  /** Get current connection state. */
  getState(): TerminalServiceState {
    return this.state;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  // --- Private Methods ---

  private handleMessage(event: MessageEvent): void {
    try {
      if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);
        this.processJsonMessage(msg);
      } else if (event.data instanceof ArrayBuffer) {
        this.processBinaryFrame(new Uint8Array(event.data));
      }
    } catch {
      // Malformed message, ignore
    }
  }

  private processJsonMessage(msg: {
    type: string;
    data?: string;
    sessionId?: string;
    title?: string;
    latency?: number;
  }): void {
    switch (msg.type) {
      case 'auth_ok':
        this.sessionId = msg.sessionId ?? this.sessionId;
        this.setState('connected');
        this.startPing();
        this.flushInputBuffer();
        break;

      case 'output':
        if (msg.data) this.emit('output', msg.data);
        break;

      case 'title':
        if (msg.title) this.emit('title', msg.title);
        break;

      case 'bell':
        this.emit('bell');
        break;

      case 'pong': {
        const rtt = Date.now() - this.lastPingSent;
        this.emit('latency', rtt);
        break;
      }

      case 'error':
        this.emit('error', new Error(msg.data ?? 'Server error'));
        break;
    }
  }

  private processBinaryFrame(data: Uint8Array): void {
    // NexusFlow binary frames: [type:1][seq:4][payload:...]
    if (data.length < 5) return;

    const frameType = data[0];
    // const seq = (data[1]! << 24) | (data[2]! << 16) | (data[3]! << 8) | data[4]!;
    const payload = data.slice(5);

    switch (frameType) {
      case 0x01: // Output data
        this.emit('output', new TextDecoder().decode(payload));
        break;
      case 0x02: // Delta frame
        this.emit('output', new TextDecoder().decode(payload));
        break;
      case 0x03: // Ack
        break;
    }
  }

  private sendFrame(type: string, data: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, data }));
  }

  private handleError(error: Error): void {
    this.emit('error', error);
  }

  private handleClose(code: number, reason: string): void {
    this.clearTimers();

    if (this.disposed || code === 1000) {
      this.setState('disconnected');
      return;
    }

    if (this.reconnectAttempt < this.config.reconnectAttempts) {
      this.setState('reconnecting');
      const delay = Math.min(
        this.config.reconnectDelayMs * Math.pow(2, this.reconnectAttempt),
        30000
      );
      this.reconnectAttempt++;
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    } else {
      this.setState('error');
      this.emit('error', new Error(`Connection lost after ${this.reconnectAttempt} attempts`));
    }
  }

  private setState(newState: TerminalServiceState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.emit('stateChange', newState);
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      this.lastPingSent = Date.now();
      this.sendFrame('ping', '');
    }, 15000);
  }

  private flushInputBuffer(): void {
    while (this.inputBuffer.length > 0) {
      const data = this.inputBuffer.shift()!;
      this.sendFrame('input', data);
    }
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}
