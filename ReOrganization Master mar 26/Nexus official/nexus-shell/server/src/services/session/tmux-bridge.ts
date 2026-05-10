/**
 * Tmux Bridge — Integration with tmux for persistent terminal sessions.
 * Manages tmux session lifecycle, window/pane operations, and state recovery.
 */

export interface TmuxSession {
  id: string;
  name: string;
  windows: number;
  attached: boolean;
  createdAt: Date;
  lastActivity: Date;
}

export interface TmuxPane {
  sessionName: string;
  windowIndex: number;
  paneIndex: number;
  width: number;
  height: number;
  pid: number;
  currentCommand: string;
  currentPath: string;
}

export interface TmuxCommand {
  type: 'create' | 'attach' | 'detach' | 'kill' | 'resize' | 'send-keys' | 'capture';
  args: string[];
}

export function buildCreateSessionCommand(
  sessionName: string,
  cols: number,
  rows: number,
  shell?: string,
): string[] {
  const cmd = [
    'tmux', 'new-session',
    '-d',
    '-s', sessionName,
    '-x', cols.toString(),
    '-y', rows.toString(),
  ];
  if (shell) cmd.push(shell);
  return cmd;
}

export function buildAttachCommand(sessionName: string): string[] {
  return ['tmux', 'attach-session', '-t', sessionName];
}

export function buildDetachCommand(sessionName: string): string[] {
  return ['tmux', 'detach-client', '-s', sessionName];
}

export function buildKillSessionCommand(sessionName: string): string[] {
  return ['tmux', 'kill-session', '-t', sessionName];
}

export function buildResizeCommand(
  sessionName: string,
  cols: number,
  rows: number,
): string[] {
  return [
    'tmux', 'resize-window',
    '-t', sessionName,
    '-x', cols.toString(),
    '-y', rows.toString(),
  ];
}

export function buildSendKeysCommand(sessionName: string, keys: string): string[] {
  return ['tmux', 'send-keys', '-t', sessionName, keys];
}

export function buildCaptureCommand(sessionName: string, historyLines: number): string[] {
  return [
    'tmux', 'capture-pane',
    '-t', sessionName,
    '-p',
    '-S', (-historyLines).toString(),
  ];
}

export function buildListSessionsCommand(): string[] {
  return [
    'tmux', 'list-sessions',
    '-F', '#{session_name}|#{session_windows}|#{session_attached}|#{session_created}|#{session_activity}',
  ];
}

export function parseTmuxSessionList(output: string): TmuxSession[] {
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [name, windows, attached, created, activity] = line.split('|');
      return {
        id: name,
        name,
        windows: parseInt(windows, 10) || 0,
        attached: attached === '1',
        createdAt: new Date(parseInt(created, 10) * 1000),
        lastActivity: new Date(parseInt(activity, 10) * 1000),
      };
    });
}

export function buildListPanesCommand(sessionName: string): string[] {
  return [
    'tmux', 'list-panes',
    '-t', sessionName,
    '-F', '#{session_name}|#{window_index}|#{pane_index}|#{pane_width}|#{pane_height}|#{pane_pid}|#{pane_current_command}|#{pane_current_path}',
  ];
}

export function parseTmuxPaneList(output: string): TmuxPane[] {
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sessionName, windowIndex, paneIndex, width, height, pid, currentCommand, currentPath] =
        line.split('|');
      return {
        sessionName,
        windowIndex: parseInt(windowIndex, 10),
        paneIndex: parseInt(paneIndex, 10),
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        pid: parseInt(pid, 10),
        currentCommand: currentCommand || '',
        currentPath: currentPath || '',
      };
    });
}

export function generateSessionName(userId: string, label?: string): string {
  const suffix = label?.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20) || 'main';
  return `nexus_${userId.slice(0, 8)}_${suffix}`;
}
