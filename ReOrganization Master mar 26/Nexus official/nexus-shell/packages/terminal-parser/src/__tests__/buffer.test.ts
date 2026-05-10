import { TerminalBuffer } from '../buffer';

describe('TerminalBuffer', () => {
  let buffer: TerminalBuffer;

  beforeEach(() => {
    buffer = new TerminalBuffer(80, 24);
  });

  describe('constructor', () => {
    it('creates a buffer with the specified dimensions', () => {
      expect(buffer.cols).toBe(80);
      expect(buffer.rows).toBe(24);
    });

    it('initializes cursor at origin', () => {
      expect(buffer.cursorCol).toBe(0);
      expect(buffer.cursorRow).toBe(0);
    });

    it('starts as dirty', () => {
      expect(buffer.isDirty).toBe(true);
    });
  });

  describe('getCell', () => {
    it('returns a space cell for unwritten positions', () => {
      const cell = buffer.getCell(0, 0);
      expect(cell).not.toBeNull();
      expect(cell!.char).toBe(' ');
      expect(cell!.width).toBe(1);
    });

    it('returns null for out-of-bounds coordinates', () => {
      expect(buffer.getCell(-1, 0)).toBeNull();
      expect(buffer.getCell(0, -1)).toBeNull();
      expect(buffer.getCell(80, 0)).toBeNull();
      expect(buffer.getCell(0, 24)).toBeNull();
    });
  });

  describe('writeChar', () => {
    it('writes a character at the cursor position', () => {
      buffer.writeChar('A');
      const cell = buffer.getCell(0, 0);
      expect(cell!.char).toBe('A');
    });

    it('advances cursor after writing', () => {
      buffer.writeChar('A');
      expect(buffer.cursorCol).toBe(1);
      expect(buffer.cursorRow).toBe(0);
    });

    it('wraps to the next line when reaching end of row', () => {
      const narrow = new TerminalBuffer(3, 5);
      narrow.writeChar('A');
      narrow.writeChar('B');
      narrow.writeChar('C');
      // cursor is now at col 3, which equals cols, so next write wraps
      narrow.writeChar('D');
      expect(narrow.cursorRow).toBe(1);
      expect(narrow.getCell(0, 1)!.char).toBe('D');
    });

    it('preserves cell attributes when writing', () => {
      buffer.setAttributes({ bold: true, fg: 1 });
      buffer.writeChar('X');
      const cell = buffer.getCell(0, 0);
      expect(cell!.attrs.bold).toBe(true);
      expect(cell!.attrs.fg).toBe(1);
    });
  });

  describe('moveCursor', () => {
    it('moves cursor to specified position', () => {
      buffer.moveCursor(10, 5);
      expect(buffer.cursorCol).toBe(10);
      expect(buffer.cursorRow).toBe(5);
    });

    it('clamps to buffer bounds', () => {
      buffer.moveCursor(200, 200);
      expect(buffer.cursorCol).toBe(79);
      expect(buffer.cursorRow).toBe(23);
    });

    it('clamps negative values to zero', () => {
      buffer.moveCursor(-5, -3);
      expect(buffer.cursorCol).toBe(0);
      expect(buffer.cursorRow).toBe(0);
    });
  });

  describe('lineFeed', () => {
    it('advances cursor to the next row', () => {
      buffer.lineFeed();
      expect(buffer.cursorRow).toBe(1);
    });

    it('scrolls when at the bottom of scroll region', () => {
      // Move cursor to last row then linefeed — triggers scroll
      buffer.moveCursor(0, 23);
      buffer.writeChar('Z');
      buffer.lineFeed();
      // After scroll, cursor stays at row 23
      expect(buffer.cursorRow).toBe(23);
    });
  });

  describe('carriageReturn', () => {
    it('resets cursor column to zero', () => {
      buffer.writeChar('A');
      buffer.writeChar('B');
      buffer.carriageReturn();
      expect(buffer.cursorCol).toBe(0);
    });
  });

  describe('eraseInLine', () => {
    beforeEach(() => {
      // Fill first row with 'A'
      for (let i = 0; i < 80; i++) buffer.writeChar('A');
      buffer.moveCursor(40, 0);
    });

    it('mode 0: erases from cursor to end of line', () => {
      buffer.eraseInLine(0);
      expect(buffer.getCell(40, 0)!.char).toBe(' ');
      expect(buffer.getCell(79, 0)!.char).toBe(' ');
      expect(buffer.getCell(39, 0)!.char).toBe('A');
    });

    it('mode 1: erases from start of line to cursor', () => {
      buffer.eraseInLine(1);
      expect(buffer.getCell(0, 0)!.char).toBe(' ');
      expect(buffer.getCell(40, 0)!.char).toBe(' ');
      expect(buffer.getCell(41, 0)!.char).toBe('A');
    });

    it('mode 2: erases entire line', () => {
      buffer.eraseInLine(2);
      for (let i = 0; i < 80; i++) {
        expect(buffer.getCell(i, 0)!.char).toBe(' ');
      }
    });
  });

  describe('eraseInDisplay', () => {
    it('mode 2: erases entire screen', () => {
      buffer.writeChar('X');
      buffer.eraseInDisplay(2);
      expect(buffer.getCell(0, 0)!.char).toBe(' ');
    });
  });

  describe('attributes', () => {
    it('setAttributes merges with current attributes', () => {
      buffer.setAttributes({ bold: true });
      buffer.writeChar('B');
      const cell = buffer.getCell(0, 0);
      expect(cell!.attrs.bold).toBe(true);
      expect(cell!.attrs.italic).toBe(false); // default unchanged
    });

    it('resetAttributes restores defaults', () => {
      buffer.setAttributes({ bold: true, fg: 9 });
      buffer.resetAttributes();
      buffer.writeChar('N');
      const cell = buffer.getCell(0, 0);
      expect(cell!.attrs.bold).toBe(false);
      expect(cell!.attrs.fg).toBe(7);
    });
  });

  describe('resize', () => {
    it('returns a new buffer with updated dimensions', () => {
      buffer.writeChar('A');
      const resized = buffer.resize(40, 12);
      expect(resized.cols).toBe(40);
      expect(resized.rows).toBe(12);
      expect(resized.getCell(0, 0)!.char).toBe('A');
    });

    it('clamps cursor position to new bounds', () => {
      buffer.moveCursor(79, 23);
      const resized = buffer.resize(40, 12);
      expect(resized.cursorCol).toBe(39);
      expect(resized.cursorRow).toBe(11);
    });
  });

  describe('markClean', () => {
    it('clears dirty flag', () => {
      expect(buffer.isDirty).toBe(true);
      buffer.markClean();
      expect(buffer.isDirty).toBe(false);
    });

    it('becomes dirty again after a write', () => {
      buffer.markClean();
      buffer.writeChar('X');
      expect(buffer.isDirty).toBe(true);
    });
  });
});
