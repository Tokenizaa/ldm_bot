import { loadEnv } from './config/env';
import { log } from '@forge-deals/shared/logger';
import Fastify from 'fastify';
import { registerOpsRoutes } from './routes/ops.routes';
import { registerApiKeyAuth } from './auth/apiKey';
import { getSupabaseAdmin } from './supabase/admin';
import { registerCoreRoutes } from './routes/core.routes';

const env = loadEnv();

const app = Fastify({
  logger: false
});

const supabase = getSupabaseAdmin(env);

declare module 'fastify' {
  interface FastifyInstance {
    env: typeof env;
    supabase: typeof supabase;
  }
}

app.decorate('env', env);
app.decorate('supabase', supabase);
await registerApiKeyAuth(app);

app.get('/health', async () => ({ ok: true }));
await registerCoreRoutes(app);
await registerOpsRoutes(app);

log('info', { service: 'api', env: env.NODE_ENV }, 'starting', { port: env.PORT });

await app.listen({ port: env.PORT, host: '0.0.0.0' });
