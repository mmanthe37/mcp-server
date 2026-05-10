import { AnsiParser, type AnsiToken } from '../parser';

describe('AnsiParser', () => {
  let parser: AnsiParser;

  beforeEach(() => {
    parser = new AnsiParser();
  });

  describe('plain text', () => {
    it('parses plain text as a single text token', () => {
      const tokens = parser.parse('hello world');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('text');
      expect(tokens[0].text).toBe('hello world');
    });

    it('returns empty array for empty input', () => {
      const tokens = parser.parse('');
      expect(tokens).toHaveLength(0);
    });
  });

  describe('control characters', () => {
    it('parses newline as a control token', () => {
      const tokens = parser.parse('\n');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('control');
      expect(tokens[0].raw).toBe('\n');
    });

    it('parses carriage return as a control token', () => {
      const tokens = parser.parse('\r');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('control');
    });

    it('splits text around control characters', () => {
      const tokens = parser.parse('abc\ndef');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toMatchObject({ type: 'text', text: 'abc' });
      expect(tokens[1]).toMatchObject({ type: 'control', raw: '\n' });
      expect(tokens[2]).toMatchObject({ type: 'text', text: 'def' });
    });
  });

  describe('CSI sequences', () => {
    it('parses cursor movement (CSI n A)', () => {
      // ESC [ 5 A — cursor up 5
      const tokens = parser.parse('\x1b[5A');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('csi');
      expect(tokens[0].params).toEqual([5]);
      expect(tokens[0].finalByte).toBe('A');
    });

    it('parses SGR sequence with multiple params (CSI n;n m)', () => {
      // ESC [ 1 ; 31 m — bold + red foreground
      const tokens = parser.parse('\x1b[1;31m');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('csi');
      expect(tokens[0].params).toEqual([1, 31]);
      expect(tokens[0].finalByte).toBe('m');
    });

    it('parses CSI with no params', () => {
      // ESC [ m — reset SGR
      const tokens = parser.parse('\x1b[m');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('csi');
      expect(tokens[0].params).toEqual([]);
      expect(tokens[0].finalByte).toBe('m');
    });

    it('parses CSI with default (empty) param as 0', () => {
      // ESC [ ; 5 m — first param default 0, second 5
      const tokens = parser.parse('\x1b[;5m');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].params).toEqual([0, 5]);
    });

    it('handles text interleaved with CSI sequences', () => {
      const tokens = parser.parse('hello\x1b[31mworld');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toMatchObject({ type: 'text', text: 'hello' });
      expect(tokens[1]).toMatchObject({ type: 'csi', finalByte: 'm' });
      expect(tokens[2]).toMatchObject({ type: 'text', text: 'world' });
    });

    it('parses cursor position (CSI row;col H)', () => {
      const tokens = parser.parse('\x1b[10;20H');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].params).toEqual([10, 20]);
      expect(tokens[0].finalByte).toBe('H');
    });

    it('parses erase in display (CSI 2 J)', () => {
      const tokens = parser.parse('\x1b[2J');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].params).toEqual([2]);
      expect(tokens[0].finalByte).toBe('J');
    });
  });

  describe('OSC sequences', () => {
    it('parses OSC string terminated by BEL', () => {
      // ESC ] 0 ; title BEL
      const tokens = parser.parse('\x1b]0;My Title\x07');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('osc');
      expect(tokens[0].text).toContain('My Title');
    });
  });

  describe('simple escape sequences', () => {
    it('parses ESC + character', () => {
      // ESC D — index (line feed)
      const tokens = parser.parse('\x1bD');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('escape');
      expect(tokens[0].finalByte).toBe('D');
    });
  });

  describe('stateful parsing', () => {
    it('maintains state across multiple parse calls', () => {
      // Send partial CSI in first chunk, complete in second
      const tokens1 = parser.parse('\x1b[');
      const tokens2 = parser.parse('31m');
      // First call enters CSI state, emits nothing meaningful
      // Second call completes the sequence
      const allTokens = [...tokens1, ...tokens2];
      const csiTokens = allTokens.filter(t => t.type === 'csi');
      expect(csiTokens.length).toBeGreaterThanOrEqual(1);
    });
  });
});
