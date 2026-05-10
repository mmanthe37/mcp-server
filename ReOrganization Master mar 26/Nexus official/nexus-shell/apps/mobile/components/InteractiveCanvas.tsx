/**
 * InteractiveCanvas — Rich terminal canvas overlay with embedded interactive controls.
 * Supports tap-to-select, long-press context menus, and floating action panels.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  StyleSheet,
} from 'react-native';

interface InteractiveCanvasProps {
  terminalCols: number;
  terminalRows: number;
  cellWidth: number;
  cellHeight: number;
  onCellTap: (col: number, row: number) => void;
  onSelection: (startCol: number, startRow: number, endCol: number, endRow: number) => void;
  onContextMenu: (col: number, row: number) => void;
  visible: boolean;
}

interface SelectionState {
  active: boolean;
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
}

export default function InteractiveCanvas({
  terminalCols,
  terminalRows,
  cellWidth,
  cellHeight,
  onCellTap,
  onSelection,
  onContextMenu,
  visible,
}: InteractiveCanvasProps) {
  const [selection, setSelection] = useState<SelectionState>({
    active: false,
    startCol: 0,
    startRow: 0,
    endCol: 0,
    endRow: 0,
  });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const screenToCell = useCallback(
    (x: number, y: number) => ({
      col: Math.min(Math.floor(x / cellWidth), terminalCols - 1),
      row: Math.min(Math.floor(y / cellHeight), terminalRows - 1),
    }),
    [cellWidth, cellHeight, terminalCols, terminalRows],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const cell = screenToCell(locationX, locationY);

        // Start long press detection
        longPressTimer.current = setTimeout(() => {
          onContextMenu(cell.col, cell.row);
          setShowContextMenu(true);
          setMenuPosition({ x: locationX, y: locationY });
        }, 500);

        setSelection({
          active: true,
          startCol: cell.col,
          startRow: cell.row,
          endCol: cell.col,
          endRow: cell.row,
        });
      },

      onPanResponderMove: (evt) => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        const { locationX, locationY } = evt.nativeEvent;
        const cell = screenToCell(locationX, locationY);

        setSelection((prev) => ({
          ...prev,
          endCol: cell.col,
          endRow: cell.row,
        }));
      },

      onPanResponderRelease: (evt) => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        const { locationX, locationY } = evt.nativeEvent;
        const cell = screenToCell(locationX, locationY);

        if (
          selection.startCol === cell.col &&
          selection.startRow === cell.row
        ) {
          onCellTap(cell.col, cell.row);
        } else {
          onSelection(
            selection.startCol,
            selection.startRow,
            cell.col,
            cell.row,
          );
        }

        setSelection((prev) => ({ ...prev, active: false }));
      },
    }),
  ).current;

  const dismissContextMenu = useCallback(() => setShowContextMenu(false), []);

  if (!visible) return null;

  const { width } = Dimensions.get('window');

  return (
    <View
      style={[styles.container, { width, height: terminalRows * cellHeight }]}
      {...panResponder.panHandlers}
    >
      {/* Selection highlight */}
      {selection.active && (
        <View
          style={[
            styles.selectionHighlight,
            {
              left: Math.min(selection.startCol, selection.endCol) * cellWidth,
              top: Math.min(selection.startRow, selection.endRow) * cellHeight,
              width:
                (Math.abs(selection.endCol - selection.startCol) + 1) * cellWidth,
              height:
                (Math.abs(selection.endRow - selection.startRow) + 1) * cellHeight,
            },
          ]}
        />
      )}

      {/* Context menu */}
      {showContextMenu && (
        <View style={[styles.contextMenu, { left: menuPosition.x - 60, top: menuPosition.y - 120 }]}>
          <TouchableOpacity style={styles.menuItem} onPress={dismissContextMenu}>
            <Text style={styles.menuText}>📋 Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={dismissContextMenu}>
            <Text style={styles.menuText}>📝 Paste</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={dismissContextMenu}>
            <Text style={styles.menuText}>🔍 Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={dismissContextMenu}>
            <Text style={styles.menuText}>📌 Bookmark</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  selectionHighlight: {
    position: 'absolute',
    backgroundColor: 'rgba(90, 200, 250, 0.25)',
    borderColor: 'rgba(90, 200, 250, 0.5)',
    borderWidth: 1,
    borderRadius: 2,
  },
  contextMenu: {
    position: 'absolute',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 120,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
