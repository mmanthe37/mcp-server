/**
 * Terminal Emulator — bridges AnsiParser and TerminalBuffer.
 * Interprets parsed tokens and applies terminal operations to the buffer.
 * Supports CSI cursor movement, erase, SGR attributes, scroll, and modes.
 */

import { AnsiParser, type AnsiToken } from './parser.js';
import { TerminalBuffer, type CellAttributes } from './buffer.js';
import { processSgrParams } from './sgr.js';

export interface EmulatorOptions {
  cols?: number;
  rows?: number;
  scrollback?: number;
}

export type EmulatorEvent =
  | { type: 'bell' }
  | { type: 'title'; title: string }
  | { type: 'resize'; cols: number; rows: number }
  | { type: 'output'; data: string };

export class TerminalEmulator {
  private parser: AnsiParser;
  private _buffer: TerminalBuffer;
  private savedCursorCol = 0;
  private savedCursorRow = 0;
  private savedAttrs: CellAttributes | null = null;
  private originMode = false;
  private autoWrap = true;
  private eventHandlers: ((event: EmulatorEvent) => void)[] = [];

  constructor(options?: EmulatorOptions) {
    const cols = options?.cols ?? 80;
    const rows = options?.rows ?? 24;
    this.parser = new AnsiParser();
    this._buffer = new TerminalBuffer(cols, rows);
  }

  get buffer(): TerminalBuffer {
    return this._buffer;
  }

  get cols(): number {
    return this._buffer.cols;
  }

  get rows(): number {
    return this._buffer.rows;
  }

  onEvent(handler: (event: EmulatorEvent) => void): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handler);
    };
  }

  /** Process raw terminal output data. */
  write(data: string): void {
    const tokens = this.parser.parse(data);
    for (const token of tokens) {
      this.processToken(token);
    }
  }

  resize(cols: number, rows: number): void {
    this._buffer = this._buffer.resize(cols, rows);
    this.emit({ type: 'resize', cols, rows });
  }

  reset(): void {
    this._buffer = new TerminalBuffer(this._buffer.cols, this._buffer.rows);
    this.parser = new AnsiParser();
    this.savedCursorCol = 0;
    this.savedCursorRow = 0;
    this.savedAttrs = null;
    this.originMode = false;
    this.autoWrap = true;
  }

  private processToken(token: AnsiToken): void {
    switch (token.type) {
      case 'text':
        this.handleText(token.text ?? '');
        break;
      case 'control':
        this.handleControl(token.raw);
        break;
      case 'csi':
        this.handleCsi(token);
        break;
      case 'osc':
        this.handleOsc(token);
        break;
      case 'escape':
        this.handleEscape(token);
        break;
      case 'dcs':
        // DCS sequences not yet handled
        break;
    }
  }

  private handleText(text: string): void {
    for (const char of text) {
      this._buffer.writeChar(char);
    }
  }

  private handleControl(raw: string): void {
    const code = raw.charCodeAt(0);
    switch (code) {
      case 0x07: // BEL
        this.emit({ type: 'bell' });
        break;
      case 0x08: // BS (backspace)
        this._buffer.moveCursor(
          Math.max(0, this._buffer.cursorCol - 1),
          this._buffer.cursorRow
        );
        break;
      case 0x09: // HT (tab)
        this._buffer.moveCursor(
          Math.min(this._buffer.cols - 1, (this._buffer.cursorCol + 8) & ~7),
          this._buffer.cursorRow
        );
        break;
      case 0x0a: // LF
      case 0x0b: // VT
      case 0x0c: // FF
        this._buffer.lineFeed();
        break;
      case 0x0d: // CR
        this._buffer.carriageReturn();
        break;
    }
  }

  private handleCsi(token: AnsiToken): void {
    const params = token.params ?? [];
    const finalByte = token.finalByte ?? '';

    switch (finalByte) {
      case 'A': // CUU — Cursor Up
        this._buffer.moveCursor(
          this._buffer.cursorCol,
          this._buffer.cursorRow - (params[0] || 1)
        );
        break;

      case 'B': // CUD — Cursor Down
        this._buffer.moveCursor(
          this._buffer.cursorCol,
          this._buffer.cursorRow + (params[0] || 1)
        );
        break;

      case 'C': // CUF — Cursor Forward
        this._buffer.moveCursor(
          this._buffer.cursorCol + (params[0] || 1),
          this._buffer.cursorRow
        );
        break;

      case 'D': // CUB — Cursor Back
        this._buffer.moveCursor(
          this._buffer.cursorCol - (params[0] || 1),
          this._buffer.cursorRow
        );
        break;

      case 'E': // CNL — Cursor Next Line
        this._buffer.moveCursor(0, this._buffer.cursorRow + (params[0] || 1));
        break;

      case 'F': // CPL — Cursor Previous Line
        this._buffer.moveCursor(0, this._buffer.cursorRow - (params[0] || 1));
        break;

      case 'G': // CHA — Cursor Horizontal Absolute
        this._buffer.moveCursor((params[0] || 1) - 1, this._buffer.cursorRow);
        break;

      case 'H': // CUP — Cursor Position
      case 'f': // HVP — Horizontal and Vertical Position
        this._buffer.moveCursor(
          (params[1] || 1) - 1,
          (params[0] || 1) - 1
        );
        break;

      case 'J': // ED — Erase in Display
        this._buffer.eraseInDisplay(params[0] || 0);
        break;

      case 'K': // EL — Erase in Line
        this._buffer.eraseInLine(params[0] || 0);
        break;

      case 'm': // SGR — Select Graphic Rendition
        this.handleSgr(params);
        break;

      case 'd': // VPA — Vertical Position Absolute
        this._buffer.moveCursor(this._buffer.cursorCol, (params[0] || 1) - 1);
        break;

      case 's': // Save cursor position (ANSI.SYS)
        this.savedCursorCol = this._buffer.cursorCol;
        this.savedCursorRow = this._buffer.cursorRow;
        break;

      case 'u': // Restore cursor position (ANSI.SYS)
        this._buffer.moveCursor(this.savedCursorCol, this.savedCursorRow);
        break;

      case 'h': // Set Mode
        this.handleSetMode(params, token.intermediates);
        break;

      case 'l': // Reset Mode
        this.handleResetMode(params, token.intermediates);
        break;

      case 'r': // DECSTBM — Set scrolling region
        // Not yet implemented in buffer — would need scrollTop/scrollBottom access
        break;

      case 'n': // DSR — Device Status Report
        if (params[0] === 6) {
          // Report cursor position
          this.emit({
            type: 'output',
            data: `\x1b[${this._buffer.cursorRow + 1};${this._buffer.cursorCol + 1}R`,
          });
        }
        break;
    }
  }

  private handleSgr(params: number[]): void {
    const cell = this._buffer.getCell(this._buffer.cursorCol, this._buffer.cursorRow);
    const currentAttrs: CellAttributes = cell?.attrs ?? {
      fg: 7, bg: 0,
      bold: false, italic: false, underline: false,
      strikethrough: false, inverse: false, dim: false,
    };

    const newAttrs = processSgrParams(params, currentAttrs);
    this._buffer.setAttributes(newAttrs);
  }

  private handleOsc(token: AnsiToken): void {
    const text = token.text ?? '';
    const semi = text.indexOf(';');
    if (semi >= 0) {
      const code = parseInt(text.slice(0, semi), 10);
      const value = text.slice(semi + 1);
      if (code === 0 || code === 2) {
        this.emit({ type: 'title', title: value });
      }
    }
  }

  private handleEscape(token: AnsiToken): void {
    switch (token.finalByte) {
      case '7': // DECSC — Save Cursor
        this.savedCursorCol = this._buffer.cursorCol;
        this.savedCursorRow = this._buffer.cursorRow;
        break;
      case '8': // DECRC — Restore Cursor
        this._buffer.moveCursor(this.savedCursorCol, this.savedCursorRow);
        break;
      case 'c': // RIS — Full Reset
        this.reset();
        break;
    }
  }

  private handleSetMode(params: number[], intermediates?: string): void {
    if (intermediates === '?') {
      for (const p of params) {
        switch (p) {
          case 6: this.originMode = true; break;
          case 7: this.autoWrap = true; break;
          // case 25: cursor visible
          // case 1049: alternate screen
        }
      }
    }
  }

  private handleResetMode(params: number[], intermediates?: string): void {
    if (intermediates === '?') {
      for (const p of params) {
        switch (p) {
          case 6: this.originMode = false; break;
          case 7: this.autoWrap = false; break;
        }
      }
    }
  }

  private emit(event: EmulatorEvent): void {
    for (const handler of this.eventHandlers) {
      handler(event);
    }
  }
}
