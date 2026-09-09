import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createMonthlyPlan, getMonthlyPlan } from '../services/monthlyPlanService.js';
import { fillMonthlyPlan } from '../services/monthlyPlannerService.js';

const createSchema = z.object({
  periodStart: z.string().min(10),
  groupId: z.string().optional(),
  groupName: z.string().optional()
});

const idSchema = z.object({ id: z.string().min(1) });

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

  fastify.post('/monthly-plans/:id/fill', async (request, reply) => {
    const parsed = idSchema.safeParse(request.params);
    if (!parsed.success) return reply.status(400).send({ success: false, error: 'ID inválido' });

    try {
      const result = await fillMonthlyPlan(parsed.data.id);
      return { success: true, data: result };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao preencher plano mensal'
      });
    }
  });

  fastify.get('/monthly-plans/:id', async (request, reply) => {
    const parsed = idSchema.safeParse(request.params);
    if (!parsed.success) return reply.status(400).send({ success: false, error: 'ID inválido' });

    try {
      const plan = await getMonthlyPlan(parsed.data.id);
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
