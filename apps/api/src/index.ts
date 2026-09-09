import Fastify from 'fastify';
import cors from '@fastify/cors';
import { configRoutes } from './routes/config.js';
import { crawlerRoutes } from './routes/crawler.js';
import { facebookRoutes } from './routes/facebook.js';
import { ollamaRoutes } from './routes/ollama.js';
import { analyticsRoutes } from './routes/analytics.js';
import { loadEnv } from '../../workers/src/config/env.js';

async function main() {
  const env = loadEnv();
  
  const fastify = Fastify({
    logger: env.NODE_ENV !== 'production'
  });

  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  await fastify.register(configRoutes, { prefix: '/api' });
  await fastify.register(crawlerRoutes, { prefix: '/api' });
  await fastify.register(facebookRoutes, { prefix: '/api' });
  await fastify.register(ollamaRoutes, { prefix: '/api' });
  await fastify.register(analyticsRoutes, { prefix: '/api' });

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  });

  const PORT = parseInt(env.API_PORT || '3001');
  const HOST = env.API_HOST || '0.0.0.0';

  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 API rodando em http://${HOST}:${PORT}`);
    console.log(`📡 Endpoints:`);
    console.log(`   GET  /api/config`);
    console.log(`   PUT  /api/config`);
    console.log(`   PATCH /api/config`);
    console.log(`   POST /api/crawler/run`);
    console.log(`   POST /api/facebook/publish`);
    console.log(`   POST /api/ollama/generate`);
    console.log(`   GET  /api/analytics/overview`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, finalizando...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, finalizando...');
  process.exit(0);
});