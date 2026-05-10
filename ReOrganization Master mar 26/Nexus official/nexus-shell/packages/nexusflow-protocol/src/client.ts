/**
 * NexusFlow Client — high-level protocol client combining
 * connection management, frame encoding, delta compression,
 * and speculative echo into a unified API.
 */

import { ConnectionManager, type ConnectionMode } from './connection.js';
import { FrameEncoder, FrameDecoder, FrameType, FrameFlag, type NexusFrame } from './frame.js';
import { DeltaEncoder, DeltaDecoder } from './delta.js';
import { SpeculativeEcho } from './speculative-echo.js';

export interface NexusFlowConfig {
  serverUrl: string;
  authToken: string;
  connectionMode: ConnectionMode;
  enableSpeculativeEcho: boolean;
  enableDeltaEncoding: boolean;
  reconnectMaxAttempts?: number;
  heartbeatInterval?: number;
}

export class NexusFlowClient {
  private connection: ConnectionManager;
  private frameEncoder = new FrameEncoder();
  private frameDecoder = new FrameDecoder();
  private deltaEncoder = new DeltaEncoder();
  private deltaDecoder = new DeltaDecoder();
  private speculativeEcho: SpeculativeEcho;
  private config: NexusFlowConfig;

  private onTerminalOutputCallback?: (data: string) => void;
  private onFrameCallback?: (frame: NexusFrame) => void;

  constructor(config: NexusFlowConfig) {
    this.config = config;
    this.speculativeEcho = new SpeculativeEcho();

    this.connection = new ConnectionManager({
      serverUrl: config.serverUrl,
      mode: config.connectionMode,
      authToken: config.authToken,
      reconnectMaxAttempts: config.reconnectMaxAttempts ?? 10,
      reconnectBaseDelay: 1000,
      heartbeatInterval: config.heartbeatInterval ?? 15000,
    });

    this.connection.onMessage((data) => this.handleIncoming(data));
  }

  async connect(): Promise<void> {
    await this.connection.connect();
  }

  disconnect(): void {
    this.connection.disconnect();
    this.deltaEncoder.reset();
    this.deltaDecoder.reset();
    this.speculativeEcho.reset();
  }

  sendInput(text: string): string | null {
    const payload = new TextEncoder().encode(text);
    const frame = this.frameEncoder.encode(FrameType.Data, payload);
    this.connection.send(frame.buffer as ArrayBuffer);

    if (this.config.enableSpeculativeEcho) {
      return this.speculativeEcho.predict(text);
    }
    return null;
  }

  sendResize(cols: number, rows: number): void {
    const payload = new TextEncoder().encode(JSON.stringify({ cols, rows }));
    const frame = this.frameEncoder.encode(FrameType.Resize, payload);
    this.connection.send(frame.buffer as ArrayBuffer);
  }

  onTerminalOutput(callback: (data: string) => void): void {
    this.onTerminalOutputCallback = callback;
  }

  onFrame(callback: (frame: NexusFrame) => void): void {
    this.onFrameCallback = callback;
  }

  private handleIncoming(data: ArrayBuffer | string): void {
    if (typeof data === 'string') {
      // JSON message (heartbeat, control, etc.)
      this.handleJsonMessage(data);
      return;
    }

    const frame = this.frameDecoder.decode(new Uint8Array(data));
    if (!frame) return;

    this.onFrameCallback?.(frame);

    if (frame.type === FrameType.Data || frame.type === FrameType.Delta) {
      let output: string;
      if (frame.flags & FrameFlag.DeltaEncoded) {
        const ops = JSON.parse(new TextDecoder().decode(frame.payload));
        const fullState = this.deltaDecoder.apply(ops);
        output = new TextDecoder().decode(fullState);
      } else {
        output = new TextDecoder().decode(frame.payload);
      }

      if (this.config.enableSpeculativeEcho) {
        output = this.speculativeEcho.reconcile(output);
      }

      this.onTerminalOutputCallback?.(output);
    }
  }

  private handleJsonMessage(data: string): void {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'terminal:output') {
        let output = msg.data;
        if (this.config.enableSpeculativeEcho) {
          output = this.speculativeEcho.reconcile(output);
        }
        this.onTerminalOutputCallback?.(output);
      }
    } catch {
      // Non-JSON binary message handled elsewhere
    }
  }
}
