import { FrameEncoder, FrameDecoder, FrameType, FrameFlag } from '../frame';

describe('FrameEncoder', () => {
  let encoder: FrameEncoder;

  beforeEach(() => {
    encoder = new FrameEncoder();
  });

  it('encodes a frame with correct header size (11 bytes)', () => {
    const payload = new Uint8Array([0x41, 0x42, 0x43]); // "ABC"
    const frame = encoder.encode(FrameType.Data, payload);
    expect(frame.byteLength).toBe(11 + 3);
  });

  it('sets protocol version to 1', () => {
    const frame = encoder.encode(FrameType.Data, new Uint8Array(0));
    const view = new DataView(frame.buffer);
    expect(view.getUint8(0)).toBe(1);
  });

  it('sets frame type correctly', () => {
    const frame = encoder.encode(FrameType.Heartbeat, new Uint8Array(0));
    const view = new DataView(frame.buffer);
    expect(view.getUint8(1)).toBe(FrameType.Heartbeat);
  });

  it('sets flags byte', () => {
    const frame = encoder.encode(FrameType.Data, new Uint8Array(0), FrameFlag.Compressed);
    const view = new DataView(frame.buffer);
    expect(view.getUint8(2)).toBe(FrameFlag.Compressed);
  });

  it('auto-increments sequence number', () => {
    const frame1 = encoder.encode(FrameType.Data, new Uint8Array(0));
    const frame2 = encoder.encode(FrameType.Data, new Uint8Array(0));
    const view1 = new DataView(frame1.buffer);
    const view2 = new DataView(frame2.buffer);
    expect(view2.getUint32(3, false)).toBe(view1.getUint32(3, false) + 1);
  });

  it('stores payload length in header', () => {
    const payload = new Uint8Array(100);
    const frame = encoder.encode(FrameType.Data, payload);
    const view = new DataView(frame.buffer);
    expect(view.getUint32(7, false)).toBe(100);
  });

  it('includes payload after header', () => {
    const payload = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
    const frame = encoder.encode(FrameType.Data, payload);
    expect(frame[11]).toBe(0xDE);
    expect(frame[12]).toBe(0xAD);
    expect(frame[13]).toBe(0xBE);
    expect(frame[14]).toBe(0xEF);
  });
});

describe('FrameDecoder', () => {
  let encoder: FrameEncoder;
  let decoder: FrameDecoder;

  beforeEach(() => {
    encoder = new FrameEncoder();
    decoder = new FrameDecoder();
  });

  it('returns null for data smaller than header size', () => {
    const tiny = new Uint8Array(5);
    expect(decoder.decode(tiny)).toBeNull();
  });

  it('returns null when declared payload length exceeds available data', () => {
    const frame = new Uint8Array(11);
    const view = new DataView(frame.buffer);
    view.setUint32(7, 999, false); // claim 999 bytes of payload
    expect(decoder.decode(frame)).toBeNull();
  });

  it('decodes a frame encoded by FrameEncoder', () => {
    const payload = new TextEncoder().encode('hello');
    const encoded = encoder.encode(FrameType.Data, payload, FrameFlag.Priority);
    const decoded = decoder.decode(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.version).toBe(1);
    expect(decoded!.type).toBe(FrameType.Data);
    expect(decoded!.flags).toBe(FrameFlag.Priority);
    expect(decoded!.sequence).toBe(0);
    expect(new TextDecoder().decode(decoded!.payload)).toBe('hello');
  });

  it('decodes correct sequence number', () => {
    encoder.encode(FrameType.Data, new Uint8Array(0)); // seq 0
    const second = encoder.encode(FrameType.Ack, new Uint8Array(0)); // seq 1
    const decoded = decoder.decode(second);
    expect(decoded!.sequence).toBe(1);
  });
});

describe('encode → decode round-trip', () => {
  it('preserves all frame fields through encode/decode', () => {
    const encoder = new FrameEncoder();
    const decoder = new FrameDecoder();
    const payload = new Uint8Array([1, 2, 3, 4, 5]);

    const flags = FrameFlag.Compressed | FrameFlag.Encrypted;
    const encoded = encoder.encode(FrameType.Delta, payload, flags);
    const decoded = decoder.decode(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.type).toBe(FrameType.Delta);
    expect(decoded!.flags).toBe(flags);
    expect(Array.from(decoded!.payload)).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles empty payload', () => {
    const encoder = new FrameEncoder();
    const decoder = new FrameDecoder();
    const encoded = encoder.encode(FrameType.Heartbeat, new Uint8Array(0));
    const decoded = decoder.decode(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.payload.byteLength).toBe(0);
    expect(decoded!.type).toBe(FrameType.Heartbeat);
  });
});
