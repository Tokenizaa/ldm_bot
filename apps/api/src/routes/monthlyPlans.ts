import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createMonthlyPlan, getMonthlyPlan, listMonthlyPlans } from '../services/monthlyPlanService.js';
import { fillMonthlyPlan, generateMonthlyPlanCopies } from '../services/monthlyPlannerService.js';
import { publishDueFacebookPosts, scheduleMonthlyPlanForFacebook } from '../services/facebookGroupPlannerService.js';

const createSchema = z.object({ periodStart: z.string().min(10), groupId: z.string().optional(), groupName: z.string().optional() });
const idSchema = z.object({ id: z.string().min(1) });
const listSchema = z.object({ limit: z.coerce.number().int().min(1).max(50).optional().default(12) });
const publishSchema = z.object({ limit: z.number().int().min(1).max(20).optional().default(5) });

export async function monthlyPlanRoutes(fastify: FastifyInstance) {
  fastify.get('/monthly-plans', async (request, reply) => {
    const parsed = listSchema.safeParse(request.query ?? {});
    if (!parsed.success) return reply.status(400).send({ success: false, error: parsed.error.flatten() });
    try {
      return { success: true, data: await listMonthlyPlans(parsed.data.limit) };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: error instanceof Error ? error.message : 'Erro ao listar planos mensais' });
    }
  });

  fastify.post('/monthly-plans', async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ success: false, error: parsed.error.flatten() });
    try {
      const input = parsed.data;
      return { success: true, data: await createMonthlyPlan({ periodStart: input.periodStart, ...(input.groupId ? { groupId: input.groupId } : {}), ...(input.groupName ? { groupName: input.groupName } : {}) }) };
    } catch (error) { request.log.error(error); return reply.status(500).send({ success: false, error: error instanceof Error ? error.message : 'Erro ao criar plano mensal' }); }
  });

  fastify.post('/monthly-plans/:id/fill', async (request, reply) => {
    const parsed = idSchema.safeParse(request.params);
    if (!parsed.success) return reply.status(400).send({ success: false, error: 'ID inválido' });
    try { return { success: true, data: await fillMonthlyPlan(parsed.data.id) }; }
    catch (error) { request.log.error(error); return reply.status(500).send({ success: false, error: error instanceof Error ? error.message : 'Erro ao selecionar produtos' }); }
  });

  fastify.post('/monthly-plans/:id/generate', async (request, reply) => {
    const parsed = idSchema.safeParse(request.params);
    if (!parsed.success) return reply.status(400).send({ success: false, error: 'ID inválido' });
    try { return { success: true, data: await generateMonthlyPlanCopies(parsed.data.id) }; }
    catch (error) { request.log.error(error); return reply.status(500).send({ success: false, error: error instanceof Error ? error.message : 'Erro ao gerar copies' }); }
  });

  fastify.post('/monthly-plans/:id/schedule-facebook', async (request, reply) => {
    const parsed = idSchema.safeParse(request.params);
    if (!parsed.success) return reply.status(400).send({ success: false, error: 'ID inválido' });
    try { return { success: true, data: await scheduleMonthlyPlanForFacebook(parsed.data.id) }; }
    catch (error) { request.log.error(error); return reply.status(500).send({ success: false, error: error instanceof Error ? error.message : 'Erro ao agendar no Facebook' }); }
  });

  fastify.post('/monthly-plans/publish-facebook-due', async (request, reply) => {
    const parsed = publishSchema.safeParse(request.body ?? {});
    if (!parsed.success) return reply.status(400).send({ success: false, error: parsed.error.flatten() });
    try { return { success: true, data: await publishDueFacebookPosts(parsed.data.limit) }; }
    catch (error) { request.log.error(error); return reply.status(500).send({ success: false, error: error instanceof Error ? error.message : 'Erro ao publicar no Facebook' }); }
  });

  fastify.get('/monthly-plans/:id', async (request, reply) => {
    const parsed = idSchema.safeParse(request.params);
    if (!parsed.success) return reply.status(400).send({ success: false, error: 'ID inválido' });
    try {
      const plan = await getMonthlyPlan(parsed.data.id);
      if (!plan) return reply.status(404).send({ success: false, error: 'Plano não encontrado' });
      return { success: true, data: plan };
    } catch (error) { request.log.error(error); return reply.status(500).send({ success: false, error: error instanceof Error ? error.message : 'Erro ao consultar plano mensal' }); }
  });
}
