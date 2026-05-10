/**
 * Auth Service — handles user registration, login, token management,
 * and biometric authentication verification.
 */

import { PrismaClient, type User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loadConfig } from '../../config/env.js';

const config = loadConfig();

const prisma = new PrismaClient();

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  deviceFingerprint: string;
}

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

export async function registerUser(input: RegisterInput): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      subscription: {
        create: { plan: 'FREE', status: 'ACTIVE', maxDevices: 2, maxSessions: 3 },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_REGISTERED',
      resource: 'user',
      resourceId: user.id,
    },
  });

  return user;
}

export async function loginUser(input: LoginInput): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'user',
      resourceId: user.id,
      details: { deviceFingerprint: input.deviceFingerprint },
    },
  });

  return generateTokens(user.id);
}

export function generateTokens(userId: string): AuthTokens {
  const accessToken = jwt.sign({ sub: userId, type: 'access' }, config.jwtSecret, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

  const refreshToken = jwt.sign({ sub: userId, type: 'refresh' }, config.jwtSecret, {
    expiresIn: REFRESH_TOKEN_TTL,
  });

  return { accessToken, refreshToken, expiresIn: 900 };
}

export function verifyAccessToken(token: string): { sub: string } {
  const payload = jwt.verify(token, config.jwtSecret) as { sub: string; type: string };
  if (payload.type !== 'access') {
    throw new Error('INVALID_TOKEN_TYPE');
  }
  return { sub: payload.sub };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const payload = jwt.verify(refreshToken, config.jwtSecret) as { sub: string; type: string };
  if (payload.type !== 'refresh') {
    throw new Error('INVALID_TOKEN_TYPE');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return generateTokens(user.id);
}

export async function getUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } });
}
