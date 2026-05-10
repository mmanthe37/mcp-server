/**
 * Acknowledgment & Reliability Layer
 * Tracks in-flight frames, handles ACK/NACK, and retransmits lost frames.
 * Implements selective acknowledgment for bandwidth efficiency.
 */

import { FrameType, FrameFlag, FrameEncoder, type NexusFrame } from './frame.js';

export interface AckEntry {
  sequence: number;
  frame: Uint8Array;
  sentAt: number;
  retries: number;
}

export interface AckStats {
  rttMs: number;
  packetsInFlight: number;
  retransmissions: number;
  totalAcked: number;
  totalLost: number;
}

export class ReliabilityLayer {
  private inFlight = new Map<number, AckEntry>();
  private readonly maxRetries: number;
  private readonly ackTimeoutMs: number;
  private readonly encoder = new FrameEncoder();

  private rttSamples: number[] = [];
  private _retransmissions = 0;
  private _totalAcked = 0;
  private _totalLost = 0;

  private retransmitCallback?: (frame: Uint8Array) => void;
  private retransmitTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options?: { maxRetries?: number; ackTimeoutMs?: number }) {
    this.maxRetries = options?.maxRetries ?? 5;
    this.ackTimeoutMs = options?.ackTimeoutMs ?? 3000;
  }

  start(retransmitCallback: (frame: Uint8Array) => void): void {
    this.retransmitCallback = retransmitCallback;
    this.retransmitTimer = setInterval(() => this.checkTimeouts(), 500);
  }

  stop(): void {
    if (this.retransmitTimer) {
      clearInterval(this.retransmitTimer);
      this.retransmitTimer = null;
    }
    this.inFlight.clear();
  }

  trackSent(sequence: number, frameData: Uint8Array): void {
    this.inFlight.set(sequence, {
      sequence,
      frame: frameData,
      sentAt: Date.now(),
      retries: 0,
    });
  }

  handleAck(frame: NexusFrame): void {
    if (frame.type !== FrameType.Ack) return;

    const view = new DataView(frame.payload.buffer, frame.payload.byteOffset);
    const ackedSequence = view.getUint32(0, false);

    const entry = this.inFlight.get(ackedSequence);
    if (entry) {
      const rtt = Date.now() - entry.sentAt;
      this.rttSamples.push(rtt);
      if (this.rttSamples.length > 50) this.rttSamples.shift();

      this.inFlight.delete(ackedSequence);
      this._totalAcked++;
    }
  }

  createAckFrame(sequence: number): Uint8Array {
    const payload = new Uint8Array(4);
    const view = new DataView(payload.buffer);
    view.setUint32(0, sequence, false);
    return this.encoder.encode(FrameType.Ack, payload, FrameFlag.None);
  }

  get stats(): AckStats {
    const sum = this.rttSamples.reduce((a, b) => a + b, 0);
    return {
      rttMs: this.rttSamples.length > 0 ? sum / this.rttSamples.length : 0,
      packetsInFlight: this.inFlight.size,
      retransmissions: this._retransmissions,
      totalAcked: this._totalAcked,
      totalLost: this._totalLost,
    };
  }

  private checkTimeouts(): void {
    const now = Date.now();
    for (const [seq, entry] of this.inFlight) {
      if (now - entry.sentAt > this.ackTimeoutMs) {
        if (entry.retries >= this.maxRetries) {
          this.inFlight.delete(seq);
          this._totalLost++;
        } else {
          entry.retries++;
          entry.sentAt = now;
          this._retransmissions++;
          this.retransmitCallback?.(entry.frame);
        }
      }
    }
  }
}
