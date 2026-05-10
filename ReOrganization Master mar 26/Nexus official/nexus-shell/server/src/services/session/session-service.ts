/**
 * Session Service — manages terminal session lifecycle including
 * creation, attachment, suspension, resumption, and termination.
 */

import { PrismaClient, type Session, SessionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateSessionInput {
  userId: string;
  deviceId: string;
  machineId: string;
  shell?: string;
  cols?: number;
  rows?: number;
}

export interface ResizeInput {
  sessionId: string;
  cols: number;
  rows: number;
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  // Verify device-machine pairing is confirmed
  const pairing = await prisma.pairing.findFirst({
    where: {
      deviceId: input.deviceId,
      machineId: input.machineId,
      status: 'CONFIRMED',
    },
  });

  if (!pairing) {
    throw new Error('NO_CONFIRMED_PAIRING');
  }

  // Check subscription limits
  const subscription = await prisma.subscription.findUnique({
    where: { userId: input.userId },
  });

  if (subscription) {
    const activeSessions = await prisma.session.count({
      where: { userId: input.userId, status: { in: ['ACTIVE', 'CONNECTING'] } },
    });

    if (activeSessions >= subscription.maxSessions) {
      throw new Error('SESSION_LIMIT_REACHED');
    }
  }

  const session = await prisma.session.create({
    data: {
      userId: input.userId,
      deviceId: input.deviceId,
      machineId: input.machineId,
      shell: input.shell ?? '/bin/zsh',
      cols: input.cols ?? 80,
      rows: input.rows ?? 24,
      status: 'CONNECTING',
    },
  });

  await prisma.sessionEvent.create({
    data: { sessionId: session.id, type: 'CREATED' },
  });

  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: 'SESSION_CREATED',
      resource: 'session',
      resourceId: session.id,
      details: { machineId: input.machineId, shell: session.shell },
    },
  });

  return session;
}

export async function activateSession(sessionId: string): Promise<Session> {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'ACTIVE', lastActiveAt: new Date() },
  });

  await prisma.sessionEvent.create({
    data: { sessionId, type: 'CONNECTED' },
  });

  return session;
}

export async function suspendSession(sessionId: string): Promise<Session> {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'SUSPENDED' },
  });

  await prisma.sessionEvent.create({
    data: { sessionId, type: 'SUSPENDED' },
  });

  return session;
}

export async function resumeSession(sessionId: string): Promise<Session> {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'ACTIVE', lastActiveAt: new Date() },
  });

  await prisma.sessionEvent.create({
    data: { sessionId, type: 'RESUMED' },
  });

  return session;
}

export async function terminateSession(sessionId: string, exitCode?: number): Promise<Session> {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: 'TERMINATED',
      endedAt: new Date(),
      exitCode: exitCode ?? 0,
    },
  });

  await prisma.sessionEvent.create({
    data: { sessionId, type: 'TERMINATED', payload: { exitCode: exitCode ?? 0 } },
  });

  return session;
}

export async function resizeSession(input: ResizeInput): Promise<Session> {
  const session = await prisma.session.update({
    where: { id: input.sessionId },
    data: { cols: input.cols, rows: input.rows },
  });

  await prisma.sessionEvent.create({
    data: {
      sessionId: input.sessionId,
      type: 'RESIZED',
      payload: { cols: input.cols, rows: input.rows },
    },
  });

  return session;
}

export async function getActiveSessions(userId: string): Promise<Session[]> {
  return prisma.session.findMany({
    where: {
      userId,
      status: { in: ['ACTIVE', 'CONNECTING', 'SUSPENDED', 'RECONNECTING'] },
    },
    orderBy: { lastActiveAt: 'desc' },
  });
}

export async function touchSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { lastActiveAt: new Date() },
  });
}
