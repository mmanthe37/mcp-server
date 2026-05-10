/**
 * SGR (Select Graphic Rendition) Attribute Processor
 * Converts CSI SGR parameter sequences into CellAttributes.
 * Supports standard colors (0-7), bright (8-15), 256-color, and 24-bit true color.
 */

import type { CellAttributes } from './buffer.js';

/** Extended color result from 256-color or RGB parsing. */
interface ColorResult {
  color: number;
  consumed: number; // number of extra params consumed
}

/**
 * Parse a single SGR code and apply it to the given attributes.
 * Returns the number of additional params consumed (for extended colors).
 */
export function applySgrCode(
  code: number,
  params: number[],
  paramIndex: number,
  attrs: CellAttributes
): { attrs: CellAttributes; consumed: number } {
  let consumed = 0;

  switch (code) {
    case 0: // Reset
      return {
        attrs: {
          fg: 7, bg: 0,
          bold: false, italic: false, underline: false,
          strikethrough: false, inverse: false, dim: false,
        },
        consumed,
      };

    // Attribute toggles
    case 1: attrs.bold = true; break;
    case 2: attrs.dim = true; break;
    case 3: attrs.italic = true; break;
    case 4: attrs.underline = true; break;
    case 7: attrs.inverse = true; break;
    case 9: attrs.strikethrough = true; break;

    // Attribute resets
    case 21: attrs.bold = false; break;
    case 22: attrs.bold = false; attrs.dim = false; break;
    case 23: attrs.italic = false; break;
    case 24: attrs.underline = false; break;
    case 27: attrs.inverse = false; break;
    case 29: attrs.strikethrough = false; break;

    // Standard foreground colors (30-37)
    case 30: case 31: case 32: case 33:
    case 34: case 35: case 36: case 37:
      attrs.fg = code - 30;
      break;

    // Extended foreground color
    case 38: {
      const result = parseExtendedColor(params, paramIndex + 1);
      if (result) {
        attrs.fg = result.color;
        consumed = result.consumed;
      }
      break;
    }

    case 39: // Default foreground
      attrs.fg = 7;
      break;

    // Standard background colors (40-47)
    case 40: case 41: case 42: case 43:
    case 44: case 45: case 46: case 47:
      attrs.bg = code - 40;
      break;

    // Extended background color
    case 48: {
      const result = parseExtendedColor(params, paramIndex + 1);
      if (result) {
        attrs.bg = result.color;
        consumed = result.consumed;
      }
      break;
    }

    case 49: // Default background
      attrs.bg = 0;
      break;

    // Bright foreground colors (90-97)
    case 90: case 91: case 92: case 93:
    case 94: case 95: case 96: case 97:
      attrs.fg = code - 90 + 8;
      break;

    // Bright background colors (100-107)
    case 100: case 101: case 102: case 103:
    case 104: case 105: case 106: case 107:
      attrs.bg = code - 100 + 8;
      break;
  }

  return { attrs, consumed };
}

/**
 * Parse extended color (256-color mode 5 or RGB mode 2).
 */
function parseExtendedColor(params: number[], startIndex: number): ColorResult | null {
  if (startIndex >= params.length) return null;

  const mode = params[startIndex];
  if (mode === 5 && startIndex + 1 < params.length) {
    // 256-color: 38;5;n or 48;5;n
    return { color: params[startIndex + 1]!, consumed: 2 };
  } else if (mode === 2 && startIndex + 3 < params.length) {
    // 24-bit RGB: 38;2;r;g;b or 48;2;r;g;b
    // Encode as 0x1000000 + (r << 16) + (g << 8) + b to distinguish from 256 palette
    const r = params[startIndex + 1]!;
    const g = params[startIndex + 2]!;
    const b = params[startIndex + 3]!;
    return { color: 0x1000000 + (r << 16) + (g << 8) + b, consumed: 4 };
  }

  return null;
}

/**
 * Process a full SGR parameter sequence and return the resulting attributes.
 */
export function processSgrParams(params: number[], initial: CellAttributes): CellAttributes {
  let attrs = { ...initial };

  if (params.length === 0) {
    // ESC[m with no params = reset
    return {
      fg: 7, bg: 0,
      bold: false, italic: false, underline: false,
      strikethrough: false, inverse: false, dim: false,
    };
  }

  let i = 0;
  while (i < params.length) {
    const result = applySgrCode(params[i]!, params, i, attrs);
    attrs = result.attrs;
    i += 1 + result.consumed;
  }

  return attrs;
}

/**
 * Convert a 256-color palette index to approximate RGB hex string.
 */
export function colorToHex(colorIndex: number): string {
  // True color encoded as 0x1RRGGBB
  if (colorIndex >= 0x1000000) {
    const rgb = colorIndex - 0x1000000;
    return `#${rgb.toString(16).padStart(6, '0')}`;
  }

  // Standard 16 ANSI colors
  const ansi16: string[] = [
    '#000000', '#cc0000', '#00cc00', '#cccc00',
    '#0000cc', '#cc00cc', '#00cccc', '#cccccc',
    '#666666', '#ff0000', '#00ff00', '#ffff00',
    '#5c5cff', '#ff00ff', '#00ffff', '#ffffff',
  ];

  if (colorIndex < 16) return ansi16[colorIndex] ?? '#000000';

  // 216-color cube (indices 16-231)
  if (colorIndex < 232) {
    const idx = colorIndex - 16;
    const b = (idx % 6) * 51;
    const g = (Math.floor(idx / 6) % 6) * 51;
    const r = Math.floor(idx / 36) * 51;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Grayscale ramp (indices 232-255)
  const gray = (colorIndex - 232) * 10 + 8;
  return `#${gray.toString(16).padStart(2, '0').repeat(3)}`;
}
