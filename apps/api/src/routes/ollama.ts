import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { OllamaService, OllamaUnavailableError } from '../services/ollamaService.js';
import { loadConfig } from '../config/configStore.js';

const generateSchema = z.object({
  product: z.object({
    title: z.string(),
    price: z.number(),
    brand: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional()
  })
});

export async function ollamaRoutes(fastify: FastifyInstance) {
  fastify.get('/ollama/models', async (request, reply) => {
    try {
      const config = await loadConfig();
      const ollama = new OllamaService(config);
      const models = await ollama.listModels();
      return { success: true, data: models };
    } catch (error) {
      if (error instanceof OllamaUnavailableError) {
        return reply.status(503).send({ success: false, error: error.message });
      }
      throw error;
    }
  });

  fastify.post('/ollama/generate', async (request, reply) => {
    try {
      const validated = generateSchema.parse(request.body);
      const config = await loadConfig();
      const ollama = new OllamaService(config);
      const prompt = buildPrompt(validated.product, config);
      const copy = await ollama.generateText(prompt, config.ollama.activeModel);
      return { success: true, data: { copy, prompt } };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        });
      }
      if (error instanceof OllamaUnavailableError) {
        return reply.status(503).send({ success: false, error: error.message });
      }
      throw error;
    }
  });

  fastify.post('/ollama/test', async (request, reply) => {
    try {
      const config = await loadConfig();
      const ollama = new OllamaService(config);
      const models = await ollama.listModels();
      return {
        success: true,
        data: { models, activeModel: config.ollama.activeModel }
      };
    } catch (error) {
      if (error instanceof OllamaUnavailableError) {
        return reply.status(503).send({ success: false, error: error.message });
      }
      throw error;
    }
  });
}

function buildPrompt(product: any, config: any): string {
  const { ollama, facebook } = config;

  let prompt = `Crie uma ${ollama.copyStyle} para este produto da Loja do Mecânico:\n\n`;
  prompt += `Título: ${product.title}\n`;
  prompt += `Preço: R$ ${product.price}\n`;
  prompt += `Marca: ${product.brand}\n`;
  prompt += `Categoria: ${product.category}\n\n`;
  prompt += `A copy deve:\n`;
  prompt += `- Ter no máximo ${ollama.maxTokens} caracteres\n`;
  prompt += `- Usar tom ${ollama.writingTone}\n`;
  prompt += `- Estilo ${ollama.copyStyle}\n`;
  if (ollama.useEmojis) prompt += `- Incluir emojis relevantes\n`;
  if (ollama.includeCTA) prompt += `- Incluir call-to-action: ${facebook.defaultCTA}\n`;
  prompt += `\nResponda apenas com a copy, sem explicações.`;
  return prompt;
}
