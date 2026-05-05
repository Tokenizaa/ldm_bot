import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function registerApiKeyAuth(app: FastifyInstance) {
  app.decorate('requireApiKey', async (req: FastifyRequest, reply: FastifyReply) => {
    const header = req.headers['x-api-key'];
    const provided = Array.isArray(header) ? header[0] : header;
    const expected = app.env.API_KEY;

    if (!provided || provided !== expected) {
      return reply.code(401).send({ success: false, error: 'Unauthorized' });
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    requireApiKey: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>;
  }
}

