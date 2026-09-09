import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createMonthlyPlan, getMonthlyPlan } from '../services/monthlyPlanService.js';

const createSchema = z.object({
  periodStart: z.string().min(10),
  groupId: z.string().optional(),
  groupName: z.string().optional()
});

export async function monthlyPlanRoutes(fastify: FastifyInstance) {
  fastify.post('/monthly-plans', async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.flatten() });
    }

    try {
      const plan = await createMonthlyPlan(parsed.data);
      return { success: true, data: plan };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar plano mensal'
      });
    }
  });

  fastify.get('/monthly-plans/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const plan = await getMonthlyPlan(id);
      if (!plan) return reply.status(404).send({ success: false, error: 'Plano não encontrado' });
      return { success: true, data: plan };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao consultar plano mensal'
      });
    }
  });
}
