export { default as TerminalView } from './TerminalView';
export { default as SessionCard } from './SessionCard';
export { default as DeviceCard } from './DeviceCard';
export { default as InputBar } from './InputBar';

export type { TerminalViewProps, TerminalLine } from './TerminalView';
export type { SessionCardProps } from './SessionCard';
export type { DeviceCardProps } from './DeviceCard';
export type { InputBarProps, Suggestion } from './InputBar';

// Phase 2: SGR-aware terminal components
export {
  TerminalView as TerminalViewV2,
  TerminalInput,
} from './terminal';
export type {
  TerminalViewProps as TerminalViewV2Props,
  TerminalInputProps,
} from './terminal';
