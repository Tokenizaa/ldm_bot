import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function registerOpsRoutes(app: FastifyInstance) {
  // Minimal ops: counts of scheduled_posts by status + recent failures
  app.get('/ops/scheduled-posts', async (req, reply) => {
    await app.requireApiKey(req, reply);

    const { data, error } = await app.supabase
      .from('scheduled_posts')
      .select('status', { count: 'exact', head: false });

    if (error) return reply.code(500).send({ success: false, error: error.message });

    const counts = (data ?? []).reduce((acc: Record<string, number>, row: any) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});

    return reply.code(200).send({ success: true, counts });
  });

  app.get('/ops/publication-logs', async (req, reply) => {
    await app.requireApiKey(req, reply);

    const schema = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) });
    const { limit } = schema.parse(req.query ?? {});

    const { data, error } = await app.supabase
      .from('publication_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return reply.code(500).send({ success: false, error: error.message });
    return reply.code(200).send({ success: true, logs: data ?? [] });
  });
}

