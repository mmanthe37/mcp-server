/**
 * useTerminalSession — Custom hook that wires together:
 *   - TerminalService (WebSocket + NexusFlow)
 *   - TerminalEmulator (ANSI parsing + buffer)
 *   - React state for UI rendering
 *
 * Returns everything TerminalView and TerminalInput need.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TerminalEmulator, type EmulatorEvent, type Cell } from '@nexus-shell/terminal-parser';
import {
  TerminalService,
  type TerminalServiceState,
  type TerminalServiceConfig,
} from '../services/terminal-service';

export interface UseTerminalSessionOptions {
  serverUrl: string;
  token: string;
  sessionId?: string;
  cols?: number;
  rows?: number;
  autoConnect?: boolean;
}

export interface UseTerminalSessionReturn {
  /** Current terminal cells [row][col] */
  cells: Cell[][];
  /** Cursor position */
  cursorCol: number;
  cursorRow: number;
  /** Terminal dimensions */
  cols: number;
  rows: number;
  /** Connection state */
  connectionState: TerminalServiceState;
  /** Terminal title (set by OSC) */
  title: string;
  /** Round-trip latency in ms */
  latency: number;
  /** Session ID (assigned by server) */
  sessionId: string | null;
  /** Send input to the terminal */
  sendInput: (data: string) => void;
  /** Resize terminal */
  resize: (cols: number, rows: number) => void;
  /** Connect to server */
  connect: () => void;
  /** Disconnect */
  disconnect: () => void;
}

export function useTerminalSession(
  options: UseTerminalSessionOptions
): UseTerminalSessionReturn {
  const { serverUrl, token, sessionId, cols: initCols = 80, rows: initRows = 24, autoConnect = true } = options;

  const [cells, setCells] = useState<Cell[][]>([]);
  const [cursorCol, setCursorCol] = useState(0);
  const [cursorRow, setCursorRow] = useState(0);
  const [cols, setCols] = useState(initCols);
  const [rows, setRows] = useState(initRows);
  const [connectionState, setConnectionState] = useState<TerminalServiceState>('idle');
  const [title, setTitle] = useState('NexusShell');
  const [latency, setLatency] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId ?? null);

  const serviceRef = useRef<TerminalService | null>(null);
  const emulatorRef = useRef<TerminalEmulator | null>(null);
  const rafRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);

  // Create emulator
  useEffect(() => {
    const emulator = new TerminalEmulator({
      cols: initCols,
      rows: initRows,
      scrollback: 1000,
    });

    emulator.onEvent((event: EmulatorEvent) => {
      switch (event.type) {
        case 'title':
          setTitle(event.title);
          break;
        case 'bell':
          // Could trigger haptic feedback here
          break;
      }
    });

    emulatorRef.current = emulator;
    syncBufferToState(emulator);

    return () => {
      emulatorRef.current = null;
    };
  }, [initCols, initRows]);

  // Sync buffer state to React at ~30fps
  const scheduleSync = useCallback(() => {
    if (dirtyRef.current) return;
    dirtyRef.current = true;
    rafRef.current = requestAnimationFrame(() => {
      dirtyRef.current = false;
      if (emulatorRef.current) {
        syncBufferToState(emulatorRef.current);
      }
    });
  }, []);

  function syncBufferToState(emulator: TerminalEmulator): void {
    const buffer = emulator.buffer;
    // Build cells grid from buffer
    const grid: Cell[][] = [];
    for (let r = 0; r < buffer.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < buffer.cols; c++) {
        row.push(buffer.getCell(c, r) ?? { char: ' ', width: 1, attrs: { fg: 7, bg: 0, bold: false, italic: false, underline: false, strikethrough: false, inverse: false, dim: false } });
      }
      grid.push(row);
    }
    setCells(grid);
    setCursorCol(buffer.cursorCol);
    setCursorRow(buffer.cursorRow);
    setCols(buffer.cols);
    setRows(buffer.rows);
  }

  // Create service and connect
  useEffect(() => {
    const config: TerminalServiceConfig = {
      serverUrl,
      token,
      sessionId,
      cols: initCols,
      rows: initRows,
    };

    const service = new TerminalService(config);
    serviceRef.current = service;

    service.on('stateChange', (state: TerminalServiceState) => {
      setConnectionState(state);
      if (state === 'connected') {
        setCurrentSessionId(service.getSessionId());
      }
    });

    service.on('output', (data: string) => {
      emulatorRef.current?.write(data);
      scheduleSync();
    });

    service.on('title', (t: string) => setTitle(t));
    service.on('latency', (ms: number) => setLatency(ms));

    if (autoConnect) {
      service.connect();
    }

    return () => {
      service.disconnect();
      service.removeAllListeners();
      serviceRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [serverUrl, token, sessionId, initCols, initRows, autoConnect, scheduleSync]);

  const sendInput = useCallback((data: string) => {
    serviceRef.current?.write(data);
    // Speculative echo: write to local emulator immediately for responsiveness
    emulatorRef.current?.write(data);
    scheduleSync();
  }, [scheduleSync]);

  const resize = useCallback((newCols: number, newRows: number) => {
    serviceRef.current?.resize(newCols, newRows);
    emulatorRef.current?.buffer.resize(newCols, newRows);
    scheduleSync();
  }, [scheduleSync]);

  const connect = useCallback(() => {
    serviceRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    serviceRef.current?.disconnect();
  }, []);

  return {
    cells,
    cursorCol,
    cursorRow,
    cols,
    rows,
    connectionState,
    title,
    latency,
    sessionId: currentSessionId,
    sendInput,
    resize,
    connect,
    disconnect,
  };
}
