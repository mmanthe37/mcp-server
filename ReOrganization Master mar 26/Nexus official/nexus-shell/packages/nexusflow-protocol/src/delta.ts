/**
 * Byte-level delta encoding for terminal output.
 * Computes minimal diff between previous and current state,
 * transmitting only changed regions for bandwidth efficiency.
 */

export interface DeltaOperation {
  offset: number;
  length: number;
  data: Uint8Array;
}

export class DeltaEncoder {
  private previousState: Uint8Array = new Uint8Array(0);

  encode(currentState: Uint8Array): DeltaOperation[] {
    const ops: DeltaOperation[] = [];
    let diffStart = -1;

    const maxLen = Math.max(this.previousState.byteLength, currentState.byteLength);

    for (let i = 0; i <= maxLen; i++) {
      const prevByte = i < this.previousState.byteLength ? this.previousState[i] : undefined;
      const currByte = i < currentState.byteLength ? currentState[i] : undefined;
      const isDifferent = prevByte !== currByte && currByte !== undefined;

      if (isDifferent && diffStart === -1) {
        diffStart = i;
      } else if (!isDifferent && diffStart !== -1) {
        ops.push({
          offset: diffStart,
          length: i - diffStart,
          data: currentState.slice(diffStart, i),
        });
        diffStart = -1;
      }
    }

    if (diffStart !== -1) {
      ops.push({
        offset: diffStart,
        length: currentState.byteLength - diffStart,
        data: currentState.slice(diffStart),
      });
    }

    this.previousState = currentState.slice();
    return ops;
  }

  reset(): void {
    this.previousState = new Uint8Array(0);
  }
}

export class DeltaDecoder {
  private state: Uint8Array = new Uint8Array(0);

  apply(ops: DeltaOperation[], newLength?: number): Uint8Array {
    if (newLength && newLength > this.state.byteLength) {
      const extended = new Uint8Array(newLength);
      extended.set(this.state);
      this.state = extended;
    }

    for (const op of ops) {
      if (op.offset + op.data.byteLength > this.state.byteLength) {
        const extended = new Uint8Array(op.offset + op.data.byteLength);
        extended.set(this.state);
        this.state = extended;
      }
      this.state.set(op.data, op.offset);
    }

    return this.state.slice();
  }

  reset(): void {
    this.state = new Uint8Array(0);
  }
}
