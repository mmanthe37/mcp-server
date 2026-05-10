import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
});

const deviceTrustSchema = z.object({
  publicKey: z.string(),
  platform: z.enum(['ios', 'android', 'macos', 'linux', 'windows']),
  nickname: z.string().min(1).max(100),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    // Auth service integration placeholder
    return {
      success: true,
      data: {
        token: 'jwt-token-placeholder',
        refreshToken: 'refresh-token-placeholder',
        user: {
          id: 'user-id',
          email: body.email,
          displayName: body.email.split('@')[0],
          plan: 'free',
        },
      },
    };
  });

  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    return {
      success: true,
      data: {
        token: 'jwt-token-placeholder',
        user: {
          id: 'new-user-id',
          email: body.email,
          displayName: body.displayName,
          plan: 'free',
        },
      },
    };
  });

  app.post('/device/trust', async (request, reply) => {
    const body = deviceTrustSchema.parse(request.body);
    return {
      success: true,
      data: {
        deviceId: 'device-id',
        trusted: true,
        platform: body.platform,
        nickname: body.nickname,
      },
    };
  });

  app.post('/biometric/challenge', async () => ({
    success: true,
    data: {
      challengeId: 'challenge-id',
      nonce: 'random-nonce',
      expiresAt: new Date(Date.now() + 300000).toISOString(),
    },
  }));

  app.post('/refresh', async () => ({
    success: true,
    data: {
      token: 'new-jwt-token',
      refreshToken: 'new-refresh-token',
    },
  }));
};
