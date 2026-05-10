/**
 * Audit Service — structured audit logging with automatic
 * redaction of sensitive data and retention controls.
 */

import { PrismaClient, RiskLevel, type AuditLog } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  riskLevel?: RiskLevel;
}

// Fields that should never appear in audit log details
const REDACT_FIELDS = new Set([
  'password',
  'passwordHash',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'privateKey',
  'mfaSecret',
  'apiKey',
]);

function redactSensitiveFields(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACT_FIELDS.has(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = redactSensitiveFields(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function writeAuditLog(entry: AuditEntry): Promise<AuditLog> {
  const sanitizedDetails = entry.details ? redactSensitiveFields(entry.details) : undefined;
  const hasRedaction = JSON.stringify(sanitizedDetails) !== JSON.stringify(entry.details);

  return prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: sanitizedDetails as object | undefined,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      riskLevel: entry.riskLevel ?? 'LOW',
      redacted: hasRedaction,
    },
  });
}

export async function getAuditLogs(
  userId: string,
  opts: { limit?: number; offset?: number; action?: string; riskLevel?: RiskLevel } = {},
): Promise<{ logs: AuditLog[]; total: number }> {
  const where = {
    userId,
    ...(opts.action ? { action: opts.action } : {}),
    ...(opts.riskLevel ? { riskLevel: opts.riskLevel } : {}),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: opts.limit ?? 50,
      skip: opts.offset ?? 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

export async function purgeAuditLogs(retentionDays: number): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const result = await prisma.auditLog.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });

  return result.count;
}
