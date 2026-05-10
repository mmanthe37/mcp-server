/**
 * Frame Stream Parser — handles partial/fragmented frames from WebSocket.
 * Buffers incoming data and emits complete NexusFrames as they arrive.
 */

import { type NexusFrame, FrameDecoder } from './frame.js';

const HEADER_SIZE = 11;

export class FrameStreamParser {
  private buffer: Uint8Array = new Uint8Array(0);
  private readonly decoder = new FrameDecoder();
  private readonly onFrame: (frame: NexusFrame) => void;

  constructor(onFrame: (frame: NexusFrame) => void) {
    this.onFrame = onFrame;
  }

  feed(data: Uint8Array): void {
    this.buffer = this.concat(this.buffer, data);

    while (this.buffer.byteLength >= HEADER_SIZE) {
      const view = new DataView(this.buffer.buffer, this.buffer.byteOffset);
      const payloadLength = view.getUint32(7, false);
      const totalLength = HEADER_SIZE + payloadLength;

      if (this.buffer.byteLength < totalLength) break;

      const frameBytes = this.buffer.slice(0, totalLength);
      this.buffer = this.buffer.slice(totalLength);

      const frame = this.decoder.decode(frameBytes);
      if (frame) {
        this.onFrame(frame);
      }
    }
  }

  reset(): void {
    this.buffer = new Uint8Array(0);
  }

  get bufferedBytes(): number {
    return this.buffer.byteLength;
  }

  private concat(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(a.byteLength + b.byteLength);
    result.set(a, 0);
    result.set(b, a.byteLength);
    return result;
  }
}
