/**
 * Speculative Echo — instant local keystroke feedback.
 * Predicts terminal echo before server confirmation arrives,
 * then reconciles when server response is received.
 */

export interface EchoEntry {
  inputChar: string;
  predictedOutput: string;
  timestamp: number;
  confirmed: boolean;
}

export class SpeculativeEcho {
  private pendingEchoes: EchoEntry[] = [];
  private readonly maxAge = 2000; // ms before discarding unconfirmed echoes

  predict(inputChar: string): string | null {
    if (this.isEchoable(inputChar)) {
      const entry: EchoEntry = {
        inputChar,
        predictedOutput: inputChar,
        timestamp: Date.now(),
        confirmed: false,
      };
      this.pendingEchoes.push(entry);
      this.pruneStale();
      return entry.predictedOutput;
    }
    return null;
  }

  reconcile(serverOutput: string): string {
    this.pruneStale();

    let reconciled = serverOutput;
    const newPending: EchoEntry[] = [];

    for (const echo of this.pendingEchoes) {
      if (!echo.confirmed && reconciled.startsWith(echo.predictedOutput)) {
        echo.confirmed = true;
        reconciled = reconciled.slice(echo.predictedOutput.length);
      } else {
        newPending.push(echo);
      }
    }

    this.pendingEchoes = newPending;
    return reconciled;
  }

  private isEchoable(char: string): boolean {
    const code = char.charCodeAt(0);
    return code >= 0x20 && code < 0x7f;
  }

  private pruneStale(): void {
    const now = Date.now();
    this.pendingEchoes = this.pendingEchoes.filter(
      (e) => now - e.timestamp < this.maxAge
    );
  }

  get pendingCount(): number {
    return this.pendingEchoes.filter((e) => !e.confirmed).length;
  }

  reset(): void {
    this.pendingEchoes = [];
  }
}
