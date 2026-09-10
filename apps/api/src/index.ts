import Fastify from 'fastify';
import cors from '@fastify/cors';
import { configRoutes } from './routes/config.js';
import { crawlerRoutes } from './routes/crawler.js';
import { facebookRoutes } from './routes/facebook.js';
import { ollamaRoutes } from './routes/ollama.js';
import { analyticsRoutes } from './routes/analytics.js';
import { monthlyPlanRoutes } from './routes/monthlyPlans.js';
import { loadEnv } from './config/env.js';
import { publishDueFacebookPosts } from './services/facebookGroupPlannerService.js';

const PUBLISHER_INTERVAL_MS = Math.max(30_000, Number.parseInt(process.env.FACEBOOK_PUBLISH_INTERVAL_MS ?? '60000', 10) || 60000);
const PUBLISHER_BATCH_SIZE = Math.max(1, Math.min(20, Number.parseInt(process.env.FACEBOOK_PUBLISH_BATCH_SIZE ?? '5', 10) || 5));

async function main() {
  const env = loadEnv();
  const fastify = Fastify({
    logger: env.NODE_ENV !== 'production',
    disableRequestLogging: env.NODE_ENV !== 'production',
  });

  await fastify.register(cors, {
    origin: env.CORS_ORIGIN ?? (env.NODE_ENV === 'development' ? 'http://localhost:5173' : false),
    credentials: true,
  });

  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await fastify.register(configRoutes, { prefix: '/api' });
  await fastify.register(crawlerRoutes, { prefix: '/api' });
  await fastify.register(facebookRoutes, { prefix: '/api' });
  await fastify.register(ollamaRoutes, { prefix: '/api' });
  await fastify.register(analyticsRoutes, { prefix: '/api' });
  await fastify.register(monthlyPlanRoutes, { prefix: '/api' });

  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  });

  const port = Number.parseInt(env.API_PORT || '3001', 10);
  const host = env.API_HOST || '0.0.0.0';

  await fastify.listen({ port, host });
  console.log(`🚀 API rodando em http://${host}:${port}`);

  // O publisher é um worker de fundo. Ele nunca deve bloquear ou derrubar a API.
  let running = false;
  const runPublisher = async () => {
    if (running) return;
    running = true;
    try {
      const result = await publishDueFacebookPosts(PUBLISHER_BATCH_SIZE);
      if (result.attempted > 0) {
        console.log(JSON.stringify({ job: 'publish-facebook-due', ...result }));
      }
    } catch (error) {
      fastify.log.error(error, 'Facebook publisher scheduler failed; API remains online');
    } finally {
      running = false;
    }
  };

  // Não executar Playwright/CDP durante o boot do servidor. A API precisa ficar
  // disponível mesmo quando o Chrome 9222 estiver fechado ou indisponível.
  const publisherTimer = setInterval(runPublisher, PUBLISHER_INTERVAL_MS);
  const publisherStartupTimer = setTimeout(runPublisher, 5_000);
  publisherTimer.unref();
  publisherStartupTimer.unref();

  const shutdown = async () => {
    clearInterval(publisherTimer);
    clearTimeout(publisherStartupTimer);
    await fastify.close().catch(() => undefined);
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

main().catch((error) => {
  console.error('❌ Falha fatal ao iniciar a API:', error);
  process.exitCode = 1;
});
