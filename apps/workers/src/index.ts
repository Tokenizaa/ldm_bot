import { log } from '@forge-deals/shared/logger';
import { runLojaDoMecanicoCrawler } from './crawlers/LojaDoMecanicoCrawler';
import Redis from 'ioredis';
import { loadEnv } from './config/env';
import { createProcessors } from './queues/worker';

// Worker entrypoint (transitional).
// For now, we keep execution explicit and manual to avoid hidden side effects.

async function main() {
  const env = loadEnv();
  log('info', { service: 'workers', env: env.NODE_ENV }, 'online');

  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  createProcessors(redis);

  if (process.env.RUN_LDM_CRAWLER === 'true') {
    await runLojaDoMecanicoCrawler();
  }
}

main().catch((error) => {
  log('error', { service: 'workers', env: process.env.NODE_ENV ?? 'development' }, 'fatal', {
    error: error instanceof Error ? { message: error.message, stack: error.stack } : { value: String(error) }
  });
  process.exitCode = 1;
});
