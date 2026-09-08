import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { FacebookPublisher } from '../services/facebookPublisher';
import { loadConfig } from '../config/configStore';

const publishSchema = z.object({
  content: z.object({
    text: z.string().min(1),
    link: z.string().url().optional().default(''),
    imageUrl: z.string().url().optional()
  }),
  groupName: z.string().min(1)
});

export async function facebookRoutes(fastify: FastifyInstance) {
  // GET /api/facebook/groups - Get configured groups
  fastify.get('/facebook/groups', async () => {
    const config = await loadConfig();
    return { 
      success: true, 
      data: config.facebook.activeGroups 
    };
  });

  // POST /api/facebook/publish - Publish to Facebook group
  fastify.post('/facebook/publish', async (request, reply) => {
    try {
      const validated = publishSchema.parse(request.body);
      
      const config = await loadConfig();
      const publisher = new FacebookPublisher(config);
      
      await publisher.initialize();
      const result = await publisher.publishPost(validated.content, validated.groupName);
      await publisher.cleanup();
      
      return { success: result.success, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          success: false, 
          error: 'Dados inválidos', 
          details: error.errors 
        });
      }
      throw error;
    }
  });

  // POST /api/facebook/test-connection - Test CDP connection
  fastify.post('/facebook/test-connection', async () => {
    const config = await loadConfig();
    const publisher = new FacebookPublisher(config);
    
    try {
      await publisher.initialize();
      await publisher.cleanup();
      return { success: true, message: 'Conexão CDP OK' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro na conexão' 
      };
    }
  });
}