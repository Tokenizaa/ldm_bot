import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { loadConfig, saveConfig, updateConfig } from '../config/configStore';
import type { SystemConfig } from '../../web/src/types/config';

const configSchema = z.object({
  facebook: z.object({
    postsPerDay: z.number().min(1).max(100),
    delayBetweenPosts: z.number().min(1).max(1440),
    activeHours: z.array(z.number().min(0).max(23)),
    activeGroups: z.array(z.object({
      id: z.string(),
      name: z.string(),
      limit: z.number().min(1).max(50),
      active: z.boolean()
    })),
    defaultCTA: z.string(),
    mode: z.enum(['safe', 'aggressive']),
    humanizationLevel: z.number().min(0).max(100)
  }),
  ollama: z.object({
    activeModel: z.string(),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().min(1).max(4000),
    copyStyle: z.enum(['casual', 'professional', 'enthusiastic', 'educational']),
    useEmojis: z.boolean(),
    includeCTA: z.boolean(),
    writingTone: z.enum(['direct', 'friendly', 'technical', 'promotional'])
  }),
  crawler: z.object({
    activeCategories: z.array(z.object({
      id: z.string(),
      name: z.string(),
      url: z.string().url(),
      priority: z.number().min(1).max(10)
    })),
    maxProducts: z.number().min(1).max(100),
    scrapingDelay: z.number().min(1).max(60),
    minScore: z.number().min(0).max(100),
    priorityCategories: z.array(z.string())
  }),
  planning: z.object({
    promotionalPosts: z.number().min(0).max(50),
    educationalPosts: z.number().min(0).max(50),
    engagementPosts: z.number().min(0).max(50),
    institutionalPosts: z.number().min(0).max(50),
    totalDailyPosts: z.number().min(1).max(200),
    rotationStrategy: z.enum(['balanced', 'promotion-focused', 'engagement-focused'])
  }),
  system: z.object({
    autoStart: z.boolean(),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']),
    backupEnabled: z.boolean(),
    emergencyStop: z.boolean(),
    cdpPort: z.number().default(9222)
  })
});

export async function configRoutes(fastify: FastifyInstance) {
  // GET /api/config - Load current configuration
  fastify.get('/config', async () => {
    const config = await loadConfig();
    return { success: true, data: config };
  });

  // PUT /api/config - Save entire configuration
  fastify.put('/config', async (request, reply) => {
    try {
      const validated = configSchema.parse(request.body);
      const config = await saveConfig(validated as SystemConfig);
      return { success: true, data: config };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          success: false, 
          error: 'Configuração inválida', 
          details: error.errors 
        });
      }
      throw error;
    }
  });

  // PATCH /api/config - Update partial configuration
  fastify.patch('/config', async (request, reply) => {
    try {
      // Validate partial (make all fields optional)
      const partialSchema = configSchema.partial();
      const validated = partialSchema.parse(request.body);
      const config = await updateConfig(validated as Partial<SystemConfig>);
      return { success: true, data: config };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          success: false, 
          error: 'Configuração inválida', 
          details: error.errors 
        });
      }
      throw error;
    }
  });

  // GET /api/config/defaults - Get default configuration
  fastify.get('/config/defaults', async () => {
    const { DEFAULT_CONFIG } = await import('../../web/src/types/config');
    return { success: true, data: DEFAULT_CONFIG };
  });
}