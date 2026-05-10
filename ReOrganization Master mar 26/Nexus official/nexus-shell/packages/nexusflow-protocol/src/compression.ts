/**
 * Compression utilities for NexusFlow frame payloads.
 * Uses a simple LZ-style run-length encoding for cross-platform compatibility.
 * Designed as a pluggable interface so LZ4/Zstd can be swapped in via native modules.
 */

export interface CompressionCodec {
  name: string;
  compress(data: Uint8Array): Uint8Array;
  decompress(data: Uint8Array): Uint8Array;
}

/**
 * Lightweight RLE + byte-pair encoding for small payloads.
 * Suitable for terminal delta data where repeated bytes are common.
 */
export class SimpleCodec implements CompressionCodec {
  readonly name = 'simple-rle';

  compress(data: Uint8Array): Uint8Array {
    if (data.length === 0) return new Uint8Array(0);
    if (data.length < 8) return data; // too small to benefit

    const out: number[] = [];
    let i = 0;

    while (i < data.length) {
      const byte = data[i]!;
      let runLen = 1;

      while (i + runLen < data.length && data[i + runLen] === byte && runLen < 255) {
        runLen++;
      }

      if (runLen >= 4) {
        // Escape sequence: 0xFF, count, byte
        out.push(0xff, runLen, byte);
        i += runLen;
      } else {
        // Literal byte (escape 0xFF itself if needed)
        if (byte === 0xff) {
          out.push(0xff, 1, 0xff);
        } else {
          out.push(byte);
        }
        i++;
      }
    }

    const compressed = new Uint8Array(out);
    // Only use compressed if it's actually smaller
    return compressed.length < data.length ? compressed : data;
  }

  decompress(data: Uint8Array): Uint8Array {
    if (data.length === 0) return new Uint8Array(0);

    const out: number[] = [];
    let i = 0;

    while (i < data.length) {
      if (data[i] === 0xff && i + 2 < data.length) {
        const count = data[i + 1]!;
        const byte = data[i + 2]!;
        for (let j = 0; j < count; j++) {
          out.push(byte);
        }
        i += 3;
      } else {
        out.push(data[i]!);
        i++;
      }
    }

    return new Uint8Array(out);
  }
}

/**
 * Passthrough codec — no compression. Used as default/fallback.
 */
export class NoOpCodec implements CompressionCodec {
  readonly name = 'none';

  compress(data: Uint8Array): Uint8Array {
    return data;
  }

  decompress(data: Uint8Array): Uint8Array {
    return data;
  }
}

/**
 * Compression manager — selects the best codec based on payload characteristics.
 */
export class CompressionManager {
  private codecs = new Map<string, CompressionCodec>();
  private defaultCodec: CompressionCodec;

  constructor() {
    const noop = new NoOpCodec();
    const simple = new SimpleCodec();
    this.codecs.set(noop.name, noop);
    this.codecs.set(simple.name, simple);
    this.defaultCodec = simple;
  }

  registerCodec(codec: CompressionCodec): void {
    this.codecs.set(codec.name, codec);
  }

  setDefault(name: string): void {
    const codec = this.codecs.get(name);
    if (!codec) throw new Error(`Unknown codec: ${name}`);
    this.defaultCodec = codec;
  }

  compress(data: Uint8Array, codecName?: string): { compressed: Uint8Array; codec: string } {
    const codec = codecName ? this.codecs.get(codecName) ?? this.defaultCodec : this.defaultCodec;
    return { compressed: codec.compress(data), codec: codec.name };
  }

  decompress(data: Uint8Array, codecName: string): Uint8Array {
    const codec = this.codecs.get(codecName) ?? this.defaultCodec;
    return codec.decompress(data);
  }
}
