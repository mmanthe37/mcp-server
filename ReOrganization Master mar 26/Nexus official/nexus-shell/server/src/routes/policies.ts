import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const policySchema = z.object({
  name: z.string(),
  pattern: z.string(),
  riskLevel: z.enum(['safe', 'elevated', 'dangerous']),
  requiresConfirmation: z.boolean().default(false),
  requiresBiometric: z.boolean().default(false),
  description: z.string().optional(),
});

export const policyRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => ({
    success: true,
    data: [
      { id: 'p-1', name: 'rm-rf', pattern: 'rm\\s+-rf', riskLevel: 'dangerous', requiresConfirmation: true, requiresBiometric: true },
      { id: 'p-2', name: 'sudo', pattern: '^sudo\\s+', riskLevel: 'elevated', requiresConfirmation: true, requiresBiometric: false },
      { id: 'p-3', name: 'chmod-777', pattern: 'chmod\\s+777', riskLevel: 'elevated', requiresConfirmation: true, requiresBiometric: false },
    ],
  }));

  app.post('/', async (request) => {
    const body = policySchema.parse(request.body);
    return {
      success: true,
      data: { id: `policy-${Date.now()}`, ...body },
    };
  });

  app.post('/evaluate', async (request) => {
    const { command } = z.object({ command: z.string() }).parse(request.body);
    return {
      success: true,
      data: {
        command,
        riskLevel: 'safe',
        matchedRules: [],
        allowed: true,
        requiresConfirmation: false,
      },
    };
  });
};
