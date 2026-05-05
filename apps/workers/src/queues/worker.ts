import { Worker, QueueEvents } from 'bullmq';
import type Redis from 'ioredis';
import { QueueNames } from '@forge-deals/shared/queues';
import { JobNames } from '@forge-deals/shared/jobs';
import { runLojaDoMecanicoCrawler } from '../crawlers/LojaDoMecanicoCrawler';
import { FacebookPublisher } from '../social-ai/facebook/facebook.publisher';
import type { SocialPost } from '../social-ai/types';
import { log } from '@forge-deals/shared/logger';
import { Queue } from 'bullmq';

export function createProcessors(connection: Redis) {
  const deadLetterQueue = new Queue(QueueNames.deadLetterQueue, { connection });

  const crawlerWorker = new Worker(
    QueueNames.crawlerQueue,
    async (job) => {
      if (job.name === JobNames.crawlProduct) {
        await runLojaDoMecanicoCrawler();
        return { ok: true };
      }
      throw new Error(`Unsupported job: ${job.name}`);
    },
    { connection }
  );

  const publisher = new FacebookPublisher();

  const publishWorker = new Worker(
    QueueNames.publishQueue,
    async (job) => {
      if (job.name === JobNames.publishFacebook) {
        const payload = job.data as { groupId: string; post: { id: string; content: string; links?: string[] } };
        const post: SocialPost = {
          id: payload.post.id,
          content: payload.post.content,
          variationType: 'offer',
          groupId: payload.groupId,
          status: 'approved',
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            links: payload.post.links || [],
            images: [],
            hashtags: [],
            mentions: [],
            productIds: [],
            groupId: payload.groupId
          },
          analytics: {},
          aiGenerated: false,
          humanReviewed: true,
          priority: 'medium'
        };

        await publisher.initialize();
        try {
          const result = await publisher.publishPost(post, payload.groupId);
          if (!result.success) throw new Error(result.error || 'publish failed');
          return { ok: true, postId: result.postId };
        } finally {
          await publisher.cleanup();
        }
      }
      throw new Error(`Unsupported job: ${job.name}`);
    },
    { connection }
  );

  const crawlerEvents = new QueueEvents(QueueNames.crawlerQueue, { connection });
  const publishEvents = new QueueEvents(QueueNames.publishQueue, { connection });

  crawlerWorker.on('completed', (job) => {
    log('info', { service: 'workers', env: process.env.NODE_ENV ?? 'development', jobId: String(job.id) }, 'crawler completed');
  });
  crawlerWorker.on('failed', (job, err) => {
    log('error', { service: 'workers', env: process.env.NODE_ENV ?? 'development', jobId: String(job?.id) }, 'crawler failed', { error: err.message });
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      void deadLetterQueue.add('dlq', { queue: QueueNames.crawlerQueue, jobName: job.name, jobId: job.id, data: job.data, error: err.message }, { removeOnComplete: { count: 5000 } });
    }
  });

  publishWorker.on('completed', (job) => {
    log('info', { service: 'workers', env: process.env.NODE_ENV ?? 'development', jobId: String(job.id) }, 'publish completed');
  });
  publishWorker.on('failed', (job, err) => {
    log('error', { service: 'workers', env: process.env.NODE_ENV ?? 'development', jobId: String(job?.id) }, 'publish failed', { error: err.message });
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      void deadLetterQueue.add('dlq', { queue: QueueNames.publishQueue, jobName: job.name, jobId: job.id, data: job.data, error: err.message }, { removeOnComplete: { count: 5000 } });
    }
  });

  return { crawlerWorker, publishWorker, crawlerEvents, publishEvents };
}
