/**
 * TerminalView — Main terminal display component for React Native.
 * Renders the terminal buffer as a flat list of styled text rows.
 * Supports touch-to-select, scroll, and accessibility labeling.
 */

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  type LayoutChangeEvent,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import type { Cell, CellAttributes } from '@nexus-shell/terminal-parser';
import { colorToHex } from '@nexus-shell/terminal-parser';

export interface TerminalViewProps {
  /** 2D array of cells [row][col] */
  cells: Cell[][];
  /** Current cursor position */
  cursorCol: number;
  cursorRow: number;
  /** Terminal dimensions */
  cols: number;
  rows: number;
  /** Whether the cursor should blink */
  cursorVisible?: boolean;
  /** Font size in points */
  fontSize?: number;
  /** Callback when layout dimensions change (for resize) */
  onLayout?: (cols: number, rows: number) => void;
}

const FONT_FAMILY = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

/** Convert CellAttributes to inline style */
function cellStyle(
  attrs: CellAttributes,
  isCursor: boolean
): {
  color: string;
  backgroundColor?: string;
  fontWeight?: 'bold' | 'normal';
  fontStyle?: 'italic' | 'normal';
  textDecorationLine?: 'underline' | 'line-through' | 'underline line-through' | 'none';
} {
  let fg = attrs.inverse ? attrs.bg : attrs.fg;
  let bg = attrs.inverse ? attrs.fg : attrs.bg;

  if (attrs.dim) {
    fg = 8; // dim gray
  }

  const style: ReturnType<typeof cellStyle> = {
    color: isCursor ? colorToHex(bg) : colorToHex(fg),
  };

  if (isCursor || bg !== 0) {
    style.backgroundColor = isCursor ? colorToHex(fg) : colorToHex(bg);
  }

  if (attrs.bold) style.fontWeight = 'bold';
  if (attrs.italic) style.fontStyle = 'italic';

  const decorations: string[] = [];
  if (attrs.underline) decorations.push('underline');
  if (attrs.strikethrough) decorations.push('line-through');
  if (decorations.length > 0) {
    style.textDecorationLine = decorations.join(' ') as typeof style.textDecorationLine;
  }

  return style;
}

/** Group consecutive cells with identical attributes into spans for efficiency. */
interface CellSpan {
  text: string;
  attrs: CellAttributes;
  hasCursor: boolean;
  startCol: number;
}

function groupRow(row: Cell[], cursorCol: number, isCursorRow: boolean): CellSpan[] {
  const spans: CellSpan[] = [];
  if (row.length === 0) return spans;

  let current: CellSpan = {
    text: row[0]!.char,
    attrs: row[0]!.attrs,
    hasCursor: isCursorRow && cursorCol === 0,
    startCol: 0,
  };

  for (let c = 1; c < row.length; c++) {
    const cell = row[c]!;
    const isCursor = isCursorRow && c === cursorCol;
    const sameAttrs =
      !isCursor &&
      !current.hasCursor &&
      cell.attrs.fg === current.attrs.fg &&
      cell.attrs.bg === current.attrs.bg &&
      cell.attrs.bold === current.attrs.bold &&
      cell.attrs.italic === current.attrs.italic &&
      cell.attrs.underline === current.attrs.underline &&
      cell.attrs.strikethrough === current.attrs.strikethrough &&
      cell.attrs.inverse === current.attrs.inverse &&
      cell.attrs.dim === current.attrs.dim;

    if (sameAttrs) {
      current.text += cell.char;
    } else {
      spans.push(current);
      current = {
        text: cell.char,
        attrs: cell.attrs,
        hasCursor: isCursor,
        startCol: c,
      };
    }
  }
  spans.push(current);
  return spans;
}

const TerminalRow = React.memo(function TerminalRow({
  row,
  rowIndex,
  cursorCol,
  cursorRow,
  fontSize,
}: {
  row: Cell[];
  rowIndex: number;
  cursorCol: number;
  cursorRow: number;
  fontSize: number;
}) {
  const isCursorRow = rowIndex === cursorRow;
  const spans = useMemo(
    () => groupRow(row, cursorCol, isCursorRow),
    [row, cursorCol, isCursorRow]
  );

  return (
    <Text
      style={[styles.row, { fontSize, lineHeight: fontSize * 1.2 }]}
      accessibilityRole="text"
    >
      {spans.map((span, i) => (
        <Text key={`${span.startCol}-${i}`} style={cellStyle(span.attrs, span.hasCursor)}>
          {span.text}
        </Text>
      ))}
    </Text>
  );
});

export const TerminalView: React.FC<TerminalViewProps> = React.memo(function TerminalView({
  cells,
  cursorCol,
  cursorRow,
  cols,
  rows,
  cursorVisible = true,
  fontSize = 13,
  onLayout,
}) {
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, [cells]);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (!onLayout) return;
      const { width, height } = e.nativeEvent.layout;
      const charWidth = fontSize * 0.6;
      const lineHeight = fontSize * 1.2;
      const newCols = Math.floor(width / charWidth);
      const newRows = Math.floor(height / lineHeight);
      if (newCols > 0 && newRows > 0 && (newCols !== cols || newRows !== rows)) {
        onLayout(newCols, newRows);
      }
    },
    [fontSize, cols, rows, onLayout]
  );

  return (
    <View
      style={styles.container}
      onLayout={handleLayout}
      accessible
      accessibilityLabel="Terminal output"
      accessibilityRole="text"
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {cells.map((row, r) => (
          <TerminalRow
            key={r}
            row={row}
            rowIndex={r}
            cursorCol={cursorVisible ? cursorCol : -1}
            cursorRow={cursorRow}
            fontSize={fontSize}
          />
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  row: {
    fontFamily: FONT_FAMILY,
    letterSpacing: 0,
  },
});
