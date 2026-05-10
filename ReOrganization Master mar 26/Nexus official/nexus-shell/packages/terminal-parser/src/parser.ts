/**
 * ANSI/VT Escape Sequence Parser
 * State machine for parsing terminal control sequences.
 * Handles CSI, OSC, DCS, and standard escape sequences.
 */

export type TokenType =
  | 'text'
  | 'csi'        // Control Sequence Introducer (ESC [)
  | 'osc'        // Operating System Command (ESC ])
  | 'dcs'        // Device Control String (ESC P)
  | 'escape'     // Simple escape (ESC + char)
  | 'control';   // C0/C1 control characters

export interface AnsiToken {
  type: TokenType;
  raw: string;
  params?: number[];
  intermediates?: string;
  finalByte?: string;
  text?: string;
}

enum State {
  Ground,
  Escape,
  CsiEntry,
  CsiParam,
  CsiIntermediate,
  OscString,
  DcsEntry,
}

export class AnsiParser {
  private state = State.Ground;
  private currentSequence = '';
  private params: number[] = [];
  private currentParam = '';
  private intermediates = '';

  parse(input: string): AnsiToken[] {
    const tokens: AnsiToken[] = [];
    let textBuffer = '';

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      const code = ch.charCodeAt(0);

      switch (this.state) {
        case State.Ground:
          if (code === 0x1b) {
            if (textBuffer) {
              tokens.push({ type: 'text', raw: textBuffer, text: textBuffer });
              textBuffer = '';
            }
            this.state = State.Escape;
            this.currentSequence = ch;
          } else if (code < 0x20) {
            if (textBuffer) {
              tokens.push({ type: 'text', raw: textBuffer, text: textBuffer });
              textBuffer = '';
            }
            tokens.push({ type: 'control', raw: ch });
          } else {
            textBuffer += ch;
          }
          break;

        case State.Escape:
          this.currentSequence += ch;
          if (ch === '[') {
            this.state = State.CsiEntry;
            this.params = [];
            this.currentParam = '';
            this.intermediates = '';
          } else if (ch === ']') {
            this.state = State.OscString;
          } else if (ch === 'P') {
            this.state = State.DcsEntry;
          } else {
            tokens.push({ type: 'escape', raw: this.currentSequence, finalByte: ch });
            this.resetState();
          }
          break;

        case State.CsiEntry:
        case State.CsiParam:
          this.currentSequence += ch;
          if (code >= 0x30 && code <= 0x39) {
            this.currentParam += ch;
            this.state = State.CsiParam;
          } else if (ch === ';') {
            this.params.push(this.currentParam ? parseInt(this.currentParam, 10) : 0);
            this.currentParam = '';
          } else if (code >= 0x20 && code <= 0x2f) {
            this.intermediates += ch;
            this.state = State.CsiIntermediate;
          } else if (code >= 0x40 && code <= 0x7e) {
            if (this.currentParam) {
              this.params.push(parseInt(this.currentParam, 10));
            }
            tokens.push({
              type: 'csi',
              raw: this.currentSequence,
              params: [...this.params],
              intermediates: this.intermediates || undefined,
              finalByte: ch,
            });
            this.resetState();
          } else {
            this.resetState();
          }
          break;

        case State.CsiIntermediate:
          this.currentSequence += ch;
          if (code >= 0x20 && code <= 0x2f) {
            this.intermediates += ch;
          } else if (code >= 0x40 && code <= 0x7e) {
            if (this.currentParam) {
              this.params.push(parseInt(this.currentParam, 10));
            }
            tokens.push({
              type: 'csi',
              raw: this.currentSequence,
              params: [...this.params],
              intermediates: this.intermediates,
              finalByte: ch,
            });
            this.resetState();
          } else {
            this.resetState();
          }
          break;

        case State.OscString:
          this.currentSequence += ch;
          if (ch === '\x07' || (ch === '\\' && this.currentSequence.endsWith('\x1b\\'))) {
            tokens.push({ type: 'osc', raw: this.currentSequence, text: this.currentSequence.slice(2, -1) });
            this.resetState();
          }
          break;

        case State.DcsEntry:
          this.currentSequence += ch;
          if (ch === '\x07' || (ch === '\\' && this.currentSequence.endsWith('\x1b\\'))) {
            tokens.push({ type: 'dcs', raw: this.currentSequence });
            this.resetState();
          }
          break;
      }
    }

    if (textBuffer) {
      tokens.push({ type: 'text', raw: textBuffer, text: textBuffer });
    }

    return tokens;
  }

  private resetState(): void {
    this.state = State.Ground;
    this.currentSequence = '';
    this.params = [];
    this.currentParam = '';
    this.intermediates = '';
  }
}
