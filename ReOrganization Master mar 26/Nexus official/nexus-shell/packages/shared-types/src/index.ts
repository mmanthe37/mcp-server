// NexusShell Shared Types — API Contracts & Models

// === Identifiers ===
export type Identifier = string;

// === User ===
export interface User {
  id: Identifier;
  email: string;
  displayName: string;
  avatarUrl?: string;
  plan: SubscriptionPlan;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

// === Device & Machine ===
export interface Device {
  id: Identifier;
  userId: Identifier;
  machineId: Identifier;
  nickname: string;
  platform: DevicePlatform;
  publicKey: string;
  trusted: boolean;
  lastSeenAt?: string;
  createdAt: string;
}

export type DevicePlatform = 'ios' | 'android' | 'macos' | 'linux' | 'windows';

export interface Machine {
  id: Identifier;
  ownerUserId: Identifier;
  name: string;
  platform: MachinePlatform;
  status: MachineStatus;
  capabilities: MachineCapabilities;
  lastHeartbeatAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type MachinePlatform = 'macos' | 'linux';
export type MachineStatus = 'online' | 'offline' | 'unknown';

export interface MachineCapabilities {
  tmux: boolean;
  shell: string;
  osVersion: string;
  cpuCores: number;
  memoryGB: number;
  diskFreeGB: number;
}

// === Pairing ===
export interface PairingChallenge {
  id: Identifier;
  code: string;
  machineId: Identifier;
  issuedByUserId: Identifier;
  expiresAt: string;
  verifiedAt?: string;
  revokedAt?: string;
  createdAt: string;
}

// === Session ===
export interface TerminalSession {
  id: Identifier;
  machineId: Identifier;
  userId: Identifier;
  status: SessionStatus;
  shell: string;
  cols: number;
  rows: number;
  tmuxSession?: string;
  startedAt: string;
  endedAt?: string;
}

export type SessionStatus = 'creating' | 'active' | 'suspended' | 'terminated';

export interface SessionEvent {
  id: Identifier;
  sessionId: Identifier;
  type: SessionEventType;
  payload: Record<string, unknown>;
  createdAt: string;
}

export type SessionEventType =
  | 'created'
  | 'attached'
  | 'detached'
  | 'resumed'
  | 'terminated'
  | 'resize'
  | 'error';

// === WebSocket Messages ===
export type WSMessage =
  | WSTerminalInput
  | WSTerminalOutput
  | WSTerminalResize
  | WSSessionControl
  | WSHeartbeat
  | WSPolicyPrompt
  | WSAICompletion;

export interface WSTerminalInput {
  type: 'terminal:input';
  sessionId: Identifier;
  data: string;
  timestamp: number;
}

export interface WSTerminalOutput {
  type: 'terminal:output';
  sessionId: Identifier;
  data: string;
  deltaEncoded: boolean;
  compressed: boolean;
  sequenceNum: number;
  timestamp: number;
}

export interface WSTerminalResize {
  type: 'terminal:resize';
  sessionId: Identifier;
  cols: number;
  rows: number;
}

export interface WSSessionControl {
  type: 'session:control';
  action: 'create' | 'attach' | 'detach' | 'resume' | 'terminate';
  sessionId?: Identifier;
  machineId?: Identifier;
  shell?: string;
}

export interface WSHeartbeat {
  type: 'heartbeat';
  timestamp: number;
}

export interface WSPolicyPrompt {
  type: 'policy:prompt';
  sessionId: Identifier;
  command: string;
  riskLevel: RiskLevel;
  requiresBiometric: boolean;
  promptId: Identifier;
}

export interface WSAICompletion {
  type: 'ai:completion';
  sessionId: Identifier;
  suggestions: CommandSuggestion[];
}

// === Policy ===
export type RiskLevel = 'safe' | 'elevated' | 'dangerous';

export interface PolicyRule {
  id: Identifier;
  name: string;
  pattern: string;
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
  requiresBiometric: boolean;
  description?: string;
}

export interface PolicyDecision {
  command: string;
  riskLevel: RiskLevel;
  matchedRules: Identifier[];
  allowed: boolean;
  requiresConfirmation: boolean;
  reason?: string;
}

// === AI ===
export interface CommandSuggestion {
  text: string;
  confidence: number;
  description?: string;
  riskLevel: RiskLevel;
}

export interface AIContext {
  currentDirectory: string;
  recentCommands: string[];
  shellType: string;
  osType: string;
  errorOutput?: string;
}

// === Audit ===
export interface AuditEntry {
  id: Identifier;
  actorUserId?: Identifier;
  action: AuditAction;
  targetType: string;
  targetId?: Identifier;
  metadata: Record<string, unknown>;
  redacted: boolean;
  createdAt: string;
}

export type AuditAction =
  | 'auth:login'
  | 'auth:logout'
  | 'device:pair'
  | 'device:revoke'
  | 'session:create'
  | 'session:terminate'
  | 'policy:override'
  | 'policy:block'
  | 'settings:change';

// === API Responses ===
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  hasMore: boolean;
}

// === Connection ===
export interface ConnectionState {
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';
  latencyMs?: number;
  lastConnectedAt?: string;
  reconnectAttempts: number;
  protocol: 'websocket' | 'quic';
}

// === Record Aliases (used by mobile app) ===
export type UserRecord = User;
export type DeviceRecord = Device;
export type SessionRecord = TerminalSession;
export type MachineRecord = Machine;
export type PairingRecord = PairingChallenge;
