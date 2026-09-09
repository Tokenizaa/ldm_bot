import { createHash } from 'node:crypto';
import { getSupabaseAdmin } from './supabaseAdmin.js';
import { loadConfig } from '../config/configStore.js';
import { FacebookPublisher } from './facebookPublisher.js';

const hashContent = (content: string) => createHash('sha256').update(content.trim()).digest('hex');

export async function scheduleMonthlyPlanForFacebook(planId: string) {
  const supabase = getSupabaseAdmin();
  const { data: plan, error: planError } = await supabase.from('monthly_plans').select('id,status').eq('id', planId).maybeSingle();
  if (planError) throw planError;
  if (!plan) throw new Error('Plano mensal não encontrado');
  if (plan.status === 'published') throw new Error('Plano já publicado');

  const { data: posts, error } = await supabase.from('posts').select('id,group_id,group_name,content,link,scheduled_at,affiliate_link_id,plan_id,status,slot_index').eq('plan_id', planId).order('slot_index');
  if (error) throw error;
  const ready = (posts ?? []).filter((p) => p.affiliate_link_id && p.content?.trim() && p.scheduled_at);
  if (!ready.length) throw new Error('Nenhum post pronto para agendamento');

  const ids = [...new Set(ready.map((p) => p.affiliate_link_id).filter(Boolean))];
  const { data: links, error: linksError } = await supabase.from('affiliate_links').select('id,product_identity_key').in('id', ids);
  if (linksError) throw linksError;
  const identityById = new Map((links ?? []).map((l) => [l.id, l.product_identity_key]));

  let scheduled = 0;
  for (const post of ready) {
    if (post.status === 'published') continue;
    const payload = {
      affiliate_link_id: post.affiliate_link_id,
      product_identity_key: identityById.get(post.affiliate_link_id) ?? `affiliate:${post.affiliate_link_id}`,
      post_id: post.id,
      plan_id: planId,
      group_id: post.group_id,
      published_at: post.scheduled_at,
      status: 'scheduled',
      content_hash: hashContent(post.content)
    };
    const { data: existing, error: existingError } = await supabase.from('publication_history').select('id,status').eq('post_id', post.id).maybeSingle();
    if (existingError) throw existingError;
    const { error: historyError } = existing
      ? await supabase.from('publication_history').update(payload).eq('id', existing.id)
      : await supabase.from('publication_history').insert(payload);
    if (historyError) throw historyError;
    const { error: updateError } = await supabase.from('posts').update({ status: 'scheduled' }).eq('id', post.id).neq('status', 'published');
    if (updateError) throw updateError;
    scheduled++;
  }

  const { error: planStatusError } = await supabase.from('monthly_plans').update({ status: 'scheduled' }).eq('id', planId);
  if (planStatusError) throw planStatusError;
  return { planId, scheduled, totalReady: ready.length, status: 'scheduled' };
}

export async function publishDueFacebookPosts(limit = 5) {
  const supabase = getSupabaseAdmin();
  const { data: posts, error } = await supabase.from('posts').select('id,group_name,content,link,image_url,scheduled_at,plan_id,attempts').eq('status', 'scheduled').lte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(Math.max(1, Math.min(limit, 20)));
  if (error) throw error;
  if (!posts?.length) return { attempted: 0, published: 0, failed: 0, errors: [] };

  const config = await loadConfig();
  let published = 0;
  const errors: Array<{ postId: string; error: string }> = [];
  for (const post of posts) {
    const claim = await supabase.from('posts').update({ status: 'publishing', attempts: (post.attempts ?? 0) + 1 }).eq('id', post.id).eq('status', 'scheduled').select('id').maybeSingle();
    if (claim.error) throw claim.error;
    if (!claim.data) continue;

    const publisher = new FacebookPublisher(config);
    try {
      await publisher.initialize();
      const result = await publisher.publishPost({ text: post.content, link: post.link ?? '', imageUrl: post.image_url ?? undefined }, post.group_name);
      if (!result.success) throw new Error(result.error ?? 'Falha na publicação Facebook');
      const publishedAt = result.publishedAt ?? new Date().toISOString();
      const { error: updateError } = await supabase.from('posts').update({ status: 'published', published_at: publishedAt, facebook_post_id: result.postId ?? null, error_message: null }).eq('id', post.id).eq('status', 'publishing');
      if (updateError) throw updateError;
      const { error: historyError } = await supabase.from('publication_history').update({ status: 'published', published_at: publishedAt }).eq('post_id', post.id);
      if (historyError) throw historyError;
      published++;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      errors.push({ postId: post.id, error: message });
      await supabase.from('posts').update({ status: 'failed', error_message: message }).eq('id', post.id).eq('status', 'publishing');
      await supabase.from('publication_history').update({ status: 'failed' }).eq('post_id', post.id);
    } finally {
      await publisher.cleanup().catch(() => undefined);
    }
  }

  return { attempted: posts.length, published, failed: errors.length, errors };
}
