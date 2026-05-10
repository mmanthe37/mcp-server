import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  deviceId?: string;
  deviceTrusted?: boolean;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}

async function authPlugin(fastify: FastifyInstance) {
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    sign: { expiresIn: '15m' },
  });

  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  });

  fastify.decorate('authenticateOptional', async function (request: FastifyRequest) {
    try {
      await request.jwtVerify();
    } catch {
      // Optional auth — no error on failure
    }
  });

  fastify.decorate('verifyDeviceTrust', async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    if (!user?.deviceId) {
      reply.code(403).send({ error: 'Forbidden', message: 'Device identity required' });
      return;
    }
    if (!user.deviceTrusted) {
      reply.code(403).send({ error: 'Forbidden', message: 'Device not trusted' });
      return;
    }
  });
}

export default fp(authPlugin, { name: 'auth', dependencies: [] });
