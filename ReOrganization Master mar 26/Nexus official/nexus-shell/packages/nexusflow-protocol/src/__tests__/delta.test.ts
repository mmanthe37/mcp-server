import { DeltaEncoder, DeltaDecoder, type DeltaOperation } from '../delta';

describe('DeltaEncoder', () => {
  let encoder: DeltaEncoder;

  beforeEach(() => {
    encoder = new DeltaEncoder();
  });

  it('returns full content as a single op when encoding from empty state', () => {
    const data = new Uint8Array([1, 2, 3]);
    const ops = encoder.encode(data);
    expect(ops).toHaveLength(1);
    expect(ops[0].offset).toBe(0);
    expect(ops[0].length).toBe(3);
    expect(Array.from(ops[0].data)).toEqual([1, 2, 3]);
  });

  it('returns empty ops when state is unchanged', () => {
    const data = new Uint8Array([10, 20, 30]);
    encoder.encode(data); // first call stores state
    const ops = encoder.encode(data); // same data
    expect(ops).toHaveLength(0);
  });

  it('returns only changed regions', () => {
    const state1 = new Uint8Array([1, 2, 3, 4, 5]);
    const state2 = new Uint8Array([1, 9, 3, 4, 5]); // byte at index 1 changed

    encoder.encode(state1);
    const ops = encoder.encode(state2);

    expect(ops).toHaveLength(1);
    expect(ops[0].offset).toBe(1);
    expect(ops[0].length).toBe(1);
    expect(ops[0].data[0]).toBe(9);
  });

  it('detects multiple changed regions', () => {
    const state1 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const state2 = new Uint8Array([1, 9, 3, 4, 5, 6, 0, 8]);
    // Changes at index 1 and index 6

    encoder.encode(state1);
    const ops = encoder.encode(state2);

    expect(ops).toHaveLength(2);
    expect(ops[0].offset).toBe(1);
    expect(ops[1].offset).toBe(6);
  });

  it('handles growing data (new state longer than previous)', () => {
    const state1 = new Uint8Array([1, 2]);
    const state2 = new Uint8Array([1, 2, 3, 4]);

    encoder.encode(state1);
    const ops = encoder.encode(state2);

    // Appended bytes are a diff region
    expect(ops.length).toBeGreaterThanOrEqual(1);
    const lastOp = ops[ops.length - 1];
    expect(lastOp.offset + lastOp.length).toBe(4);
  });

  it('reset clears internal state', () => {
    const data = new Uint8Array([1, 2, 3]);
    encoder.encode(data);
    encoder.reset();

    // After reset, full content is a diff again
    const ops = encoder.encode(data);
    expect(ops).toHaveLength(1);
    expect(ops[0].offset).toBe(0);
  });
});

describe('DeltaDecoder', () => {
  let decoder: DeltaDecoder;

  beforeEach(() => {
    decoder = new DeltaDecoder();
  });

  it('applies operations to build state from empty', () => {
    const ops: DeltaOperation[] = [
      { offset: 0, length: 3, data: new Uint8Array([10, 20, 30]) },
    ];
    const result = decoder.apply(ops, 3);
    expect(Array.from(result)).toEqual([10, 20, 30]);
  });

  it('applies partial updates to existing state', () => {
    // Build initial state
    decoder.apply([{ offset: 0, length: 5, data: new Uint8Array([1, 2, 3, 4, 5]) }], 5);

    // Update byte at index 2
    const result = decoder.apply([{ offset: 2, length: 1, data: new Uint8Array([99]) }]);
    expect(result[2]).toBe(99);
    expect(result[0]).toBe(1); // unchanged
    expect(result[4]).toBe(5); // unchanged
  });

  it('extends state when operation exceeds current size', () => {
    decoder.apply([{ offset: 0, length: 2, data: new Uint8Array([1, 2]) }], 2);
    const result = decoder.apply([{ offset: 5, length: 1, data: new Uint8Array([99]) }]);
    expect(result[5]).toBe(99);
    expect(result.byteLength).toBeGreaterThanOrEqual(6);
  });

  it('reset clears internal state', () => {
    decoder.apply([{ offset: 0, length: 3, data: new Uint8Array([1, 2, 3]) }], 3);
    decoder.reset();

    // After reset, applying empty ops returns empty
    const result = decoder.apply([], 0);
    expect(result.byteLength).toBe(0);
  });
});

describe('DeltaEncoder ↔ DeltaDecoder round-trip', () => {
  it('decoder reconstructs state from encoder ops', () => {
    const encoder = new DeltaEncoder();
    const decoder = new DeltaDecoder();

    const state1 = new Uint8Array([65, 66, 67, 68, 69]); // ABCDE
    const ops1 = encoder.encode(state1);
    decoder.apply(ops1, state1.byteLength);

    const state2 = new Uint8Array([65, 88, 67, 68, 69]); // AXCDE
    const ops2 = encoder.encode(state2);
    const result = decoder.apply(ops2, state2.byteLength);

    expect(Array.from(result)).toEqual([65, 88, 67, 68, 69]);
  });

  it('handles multiple sequential updates', () => {
    const encoder = new DeltaEncoder();
    const decoder = new DeltaDecoder();

    const states = [
      new Uint8Array([1, 1, 1, 1]),
      new Uint8Array([1, 2, 1, 1]),
      new Uint8Array([1, 2, 3, 1]),
      new Uint8Array([1, 2, 3, 4]),
    ];

    for (const state of states) {
      const ops = encoder.encode(state);
      decoder.apply(ops, state.byteLength);
    }

    const final = decoder.apply([], states[states.length - 1].byteLength);
    expect(Array.from(final)).toEqual([1, 2, 3, 4]);
  });
});
