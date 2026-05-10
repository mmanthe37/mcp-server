/**
 * NexusFlow Wire Frame Format
 * Header: [version:1][type:1][flags:1][sequence:4][length:4][payload:N]
 */

export enum FrameType {
  Data = 0x01,
  Ack = 0x02,
  Heartbeat = 0x03,
  Resize = 0x04,
  Control = 0x05,
  Delta = 0x06,
  Policy = 0x07,
  AI = 0x08,
}

export enum FrameFlag {
  None = 0x00,
  Compressed = 0x01,
  DeltaEncoded = 0x02,
  Encrypted = 0x04,
  Priority = 0x08,
}

export interface NexusFrame {
  version: number;
  type: FrameType;
  flags: number;
  sequence: number;
  payload: Uint8Array;
}

const HEADER_SIZE = 11;
const PROTOCOL_VERSION = 1;

export class FrameEncoder {
  private sequence = 0;

  encode(type: FrameType, payload: Uint8Array, flags = FrameFlag.None): Uint8Array {
    const frame = new Uint8Array(HEADER_SIZE + payload.byteLength);
    const view = new DataView(frame.buffer);

    view.setUint8(0, PROTOCOL_VERSION);
    view.setUint8(1, type);
    view.setUint8(2, flags);
    view.setUint32(3, this.sequence++, false);
    view.setUint32(7, payload.byteLength, false);
    frame.set(payload, HEADER_SIZE);

    return frame;
  }
}

export class FrameDecoder {
  decode(data: Uint8Array): NexusFrame | null {
    if (data.byteLength < HEADER_SIZE) return null;

    const view = new DataView(data.buffer, data.byteOffset);
    const version = view.getUint8(0);
    const type = view.getUint8(1) as FrameType;
    const flags = view.getUint8(2);
    const sequence = view.getUint32(3, false);
    const length = view.getUint32(7, false);

    if (data.byteLength < HEADER_SIZE + length) return null;

    const payload = data.slice(HEADER_SIZE, HEADER_SIZE + length);
    return { version, type, flags, sequence, payload };
  }
}
