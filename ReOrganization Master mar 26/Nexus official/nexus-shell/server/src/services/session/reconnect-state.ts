/**
 * Reconnect State Machine — Mobile-resilient connection lifecycle.
 * Handles disconnect/reconnect, exponential backoff, and state synchronization.
 */

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'suspended'
  | 'failed';

export type ConnectionEvent =
  | 'CONNECT'
  | 'CONNECTED'
  | 'DISCONNECT'
  | 'ERROR'
  | 'RETRY'
  | 'SUSPEND'
  | 'RESUME'
  | 'MAX_RETRIES';

export interface ReconnectConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;
  suspendTimeoutMs: number;
}

export interface ReconnectContext {
  state: ConnectionState;
  retryCount: number;
  lastConnectedAt: number | null;
  lastDisconnectedAt: number | null;
  nextRetryAt: number | null;
  sessionId: string | null;
  bufferedBytes: number;
}

const DEFAULT_CONFIG: ReconnectConfig = {
  maxRetries: 10,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.3,
  suspendTimeoutMs: 300000, // 5 minutes
};

const STATE_TRANSITIONS: Record<ConnectionState, Partial<Record<ConnectionEvent, ConnectionState>>> = {
  disconnected: {
    CONNECT: 'connecting',
  },
  connecting: {
    CONNECTED: 'connected',
    ERROR: 'reconnecting',
    DISCONNECT: 'disconnected',
  },
  connected: {
    DISCONNECT: 'reconnecting',
    ERROR: 'reconnecting',
    SUSPEND: 'suspended',
  },
  reconnecting: {
    CONNECTED: 'connected',
    RETRY: 'connecting',
    MAX_RETRIES: 'failed',
    SUSPEND: 'suspended',
  },
  suspended: {
    RESUME: 'reconnecting',
    DISCONNECT: 'disconnected',
  },
  failed: {
    CONNECT: 'connecting',
    DISCONNECT: 'disconnected',
  },
};

export function createReconnectContext(sessionId?: string): ReconnectContext {
  return {
    state: 'disconnected',
    retryCount: 0,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    nextRetryAt: null,
    sessionId: sessionId ?? null,
    bufferedBytes: 0,
  };
}

export function transition(
  ctx: ReconnectContext,
  event: ConnectionEvent,
  config: ReconnectConfig = DEFAULT_CONFIG,
): ReconnectContext {
  const nextState = STATE_TRANSITIONS[ctx.state]?.[event];
  if (!nextState) return ctx; // Invalid transition — ignore

  const next = { ...ctx, state: nextState };

  switch (nextState) {
    case 'connected':
      next.retryCount = 0;
      next.lastConnectedAt = Date.now();
      next.nextRetryAt = null;
      break;

    case 'reconnecting':
      if (event === 'DISCONNECT' || event === 'ERROR') {
        next.lastDisconnectedAt = Date.now();
      }
      if (next.retryCount >= config.maxRetries) {
        return transition(next, 'MAX_RETRIES', config);
      }
      next.nextRetryAt = Date.now() + computeBackoff(next.retryCount, config);
      next.retryCount++;
      break;

    case 'connecting':
      break;

    case 'failed':
      next.nextRetryAt = null;
      break;

    case 'suspended':
      next.nextRetryAt = null;
      break;

    case 'disconnected':
      next.retryCount = 0;
      next.nextRetryAt = null;
      next.bufferedBytes = 0;
      break;
  }

  return next;
}

export function computeBackoff(retryCount: number, config: ReconnectConfig = DEFAULT_CONFIG): number {
  const exponentialDelay = Math.min(
    config.baseDelayMs * Math.pow(2, retryCount),
    config.maxDelayMs,
  );
  const jitter = exponentialDelay * config.jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(exponentialDelay + jitter));
}

export function shouldSuspend(ctx: ReconnectContext, config: ReconnectConfig = DEFAULT_CONFIG): boolean {
  if (ctx.state !== 'reconnecting') return false;
  if (!ctx.lastDisconnectedAt) return false;
  return Date.now() - ctx.lastDisconnectedAt > config.suspendTimeoutMs;
}

export function canRetry(ctx: ReconnectContext): boolean {
  if (ctx.state !== 'reconnecting') return false;
  if (!ctx.nextRetryAt) return false;
  return Date.now() >= ctx.nextRetryAt;
}

export function getTimeTilRetry(ctx: ReconnectContext): number {
  if (!ctx.nextRetryAt) return 0;
  return Math.max(0, ctx.nextRetryAt - Date.now());
}
