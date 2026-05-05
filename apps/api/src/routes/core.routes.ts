import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createHash } from 'crypto';

function idempotencyKey(prefix: string, payload: unknown): string {
  const json = JSON.stringify(payload);
  const hash = createHash('sha256').update(json).digest('hex').slice(0, 32);
  return `${prefix}:${hash}`;
}

export async function registerCoreRoutes(app: FastifyInstance) {
  // Ingest product (from crawler/n8n/etc)
  app.post('/ingest/product', async (req, reply) => {
    await app.requireApiKey(req, reply);

    const schema = z.object({
      title: z.string().min(1),
      price: z.number().positive(),
      old_price: z.number().positive().optional(),
      discount: z.number().min(0).max(100).optional(),
      image: z.string().url().optional(),
      category: z.string().min(1).optional(),
      brand: z.string().min(1).optional(),
      affiliate_url: z.string().url().optional(),
      original_url: z.string().url().optional(),
      slug: z.string().min(1).optional()
    });

    const body = schema.parse(req.body);

    const dedupe = idempotencyKey('product', { title: body.title, original_url: body.original_url, affiliate_url: body.affiliate_url });

    const { data, error } = await app.supabase
      .from('products')
      .upsert(
        {
          title: body.title,
          slug: body.slug,
          image: body.image,
          price: body.price,
          old_price: body.old_price,
          discount: body.discount,
          category: body.category,
          brand: body.brand,
          affiliate_url: body.affiliate_url,
          original_url: body.original_url,
          active: true,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'slug' }
      )
      .select()
      .limit(1)
      .maybeSingle();

    if (error) return reply.code(500).send({ success: false, error: error.message });

    return reply.code(201).send({ success: true, idempotency_key: dedupe, product: data });
  });

  // Schedule a post (from web/admin)
  app.post('/schedule/post', async (req, reply) => {
    await app.requireApiKey(req, reply);

    const schema = z.object({
      product_id: z.string().uuid().optional(),
      platform: z.string().default('facebook'),
      type: z.string().min(1),
      content: z.string().min(1),
      scheduled_for: z.string().datetime(),
      group_id: z.string().min(1).optional()
    });

    const body = schema.parse(req.body);
    const key = idempotencyKey('scheduled_post', body);

    const { data, error } = await app.supabase
      .from('scheduled_posts')
      .insert({
        product_id: body.product_id ?? null,
        platform: body.platform,
        type: body.type,
        content: body.content,
        scheduled_for: body.scheduled_for,
        status: 'pending',
        idempotency_key: key
      })
      .select()
      .single();

    if (error) {
      // Unique violation on idempotency_key => already scheduled
      if (error.code === '23505') {
        return reply.code(200).send({ success: true, idempotency_key: key, alreadyExists: true });
      }
      return reply.code(500).send({ success: false, error: error.message });
    }

    return reply.code(201).send({ success: true, idempotency_key: key, scheduled_post: data });
  });

  // Metrics ingestion (clicks/engagement/etc)
  app.post('/metrics/event', async (req, reply) => {
    await app.requireApiKey(req, reply);

    const schema = z.object({
      platform: z.string().min(1),
      group_id: z.string().min(1).optional(),
      post_url: z.string().url().optional(),
      metric: z.enum(['click', 'like', 'comment', 'share', 'view']),
      value: z.number().nonnegative().default(1),
      captured_at: z.string().datetime().optional(),
      meta: z.record(z.any()).optional()
    });

    const body = schema.parse(req.body);

    const { error } = await app.supabase.from('engagement_metrics').insert({
      platform: body.platform,
      group_id: body.group_id,
      post_url: body.post_url,
      metric: body.metric,
      value: body.value,
      captured_at: body.captured_at ?? new Date().toISOString(),
      meta: body.meta ?? {}
    });

    if (error) return reply.code(500).send({ success: false, error: error.message });
    return reply.code(202).send({ success: true });
  });
}

