import { createHash } from 'node:crypto';
import { getSupabaseAdmin } from './supabaseAdmin.js';
import { loadConfig } from '../config/configStore.js';
import { FacebookPublisher } from './facebookPublisher.js';

const hashContent = (content: string) => createHash('sha256').update(content.trim()).digest('hex');
const MAX_ATTEMPTS = 3;
const STALE_PUBLISHING_MINUTES = 15;

async function finalizePlanStatuses(planIds: string[]) {
  const supabase = getSupabaseAdmin();
  for (const planId of [...new Set(planIds)]) {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('status')
      .eq('plan_id', planId);
    if (error) throw error;
    if (!posts?.length) continue;

    const hasPending = posts.some((post) => ['draft', 'scheduled', 'publishing'].includes(post.status ?? ''));
    if (hasPending) continue;

    const hasFailures = posts.some((post) => post.status === 'failed');
    const nextStatus = hasFailures ? 'completed_with_errors' : 'published';
    const { error: updateError } = await supabase
      .from('monthly_plans')
      .update({ status: nextStatus })
      .eq('id', planId)
      .not('status', 'eq', 'cancelled');
    if (updateError) throw updateError;
  }
}

export async function scheduleMonthlyPlanForFacebook(planId: string) {
  const supabase = getSupabaseAdmin();
  const { data: plan, error: planError } = await supabase
    .from('monthly_plans')
    .select('id,status')
    .eq('id', planId)
    .maybeSingle();
  if (planError) throw planError;
  if (!plan) throw new Error('Plano mensal não encontrado');
  if (plan.status === 'published' || plan.status === 'completed') throw new Error('Plano já concluído');
  if (plan.status === 'cancelled') throw new Error('Plano cancelado');

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id,group_id,group_name,content,link,scheduled_at,affiliate_link_id,plan_id,status,slot_index')
    .eq('plan_id', planId)
    .order('slot_index');
  if (error) throw error;

  const ready = (posts ?? []).filter((post) =>
    post.affiliate_link_id && post.content?.trim() && post.scheduled_at,
  );
  if (!ready.length) throw new Error('Nenhum post pronto para agendamento');

  const ids = [...new Set(ready.map((post) => post.affiliate_link_id).filter(Boolean))];
  const { data: links, error: linksError } = await supabase
    .from('affiliate_links')
    .select('id,product_identity_key')
    .in('id', ids);
  if (linksError) throw linksError;
  const identityById = new Map((links ?? []).map((link) => [link.id, link.product_identity_key]));

  let scheduled = 0;
  for (const post of ready) {
    if (post.status === 'published') continue;
    const payload = {
      affiliate_link_id: post.affiliate_link_id,
      product_identity_key: identityById.get(post.affiliate_link_id) ?? `affiliate:${post.affiliate_link_id}`,
      post_id: post.id,
      plan_id: planId,
      group_id: post.group_id,
      scheduled_at: post.scheduled_at,
      published_at: null,
      status: 'scheduled',
      content_hash: hashContent(post.content),
    };

    const { data: existing, error: existingError } = await supabase
      .from('publication_history')
      .select('id,status')
      .eq('post_id', post.id)
      .maybeSingle();
    if (existingError) throw existingError;

    const { error: historyError } = existing
      ? await supabase.from('publication_history').update(payload).eq('id', existing.id)
      : await supabase.from('publication_history').insert(payload);
    if (historyError) throw historyError;

    const { error: updateError } = await supabase
      .from('posts')
      .update({ status: 'scheduled', error_message: null })
      .eq('id', post.id)
      .neq('status', 'published');
    if (updateError) throw updateError;
    scheduled++;
  }

  const { error: planStatusError } = await supabase
    .from('monthly_plans')
    .update({ status: 'scheduled' })
    .eq('id', planId);
  if (planStatusError) throw planStatusError;

  return { planId, scheduled, totalReady: ready.length, status: 'scheduled' };
}

export async function recoverStaleFacebookPublishing() {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - STALE_PUBLISHING_MINUTES * 60_000).toISOString();
  const { data, error } = await supabase
    .from('posts')
    .select('id,attempts,plan_id')
    .eq('status', 'publishing')
    .or(`publishing_started_at.is.null,publishing_started_at.lt.${cutoff}`);
  if (error) throw error;
  if (!data?.length) return { recovered: 0, exhausted: 0 };

  let recovered = 0;
  let exhausted = 0;
  const planIds: string[] = [];
  for (const post of data) {
    const attempts = post.attempts ?? 0;
    const nextStatus = attempts >= MAX_ATTEMPTS ? 'failed' : 'scheduled';
    const message = attempts >= MAX_ATTEMPTS
      ? 'Limite de tentativas excedido após recuperação de publicação interrompida'
      : 'Publicação recuperada após execução interrompida';

    const { error: updateError } = await supabase
      .from('posts')
      .update({ status: nextStatus, error_message: message, publishing_started_at: null })
      .eq('id', post.id)
      .eq('status', 'publishing');
    if (updateError) throw updateError;

    const { error: historyError } = await supabase
      .from('publication_history')
      .update({ status: nextStatus === 'failed' ? 'failed' : 'scheduled' })
      .eq('post_id', post.id);
    if (historyError) throw historyError;

    if (post.plan_id) planIds.push(post.plan_id);
    if (nextStatus === 'failed') exhausted++;
    else recovered++;
  }

  await finalizePlanStatuses(planIds);
  return { recovered, exhausted };
}

export async function publishDueFacebookPosts(limit = 5) {
  const supabase = getSupabaseAdmin();
  await recoverStaleFacebookPublishing();

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id,group_name,content,link,image_url,scheduled_at,plan_id,attempts')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .lt('attempts', MAX_ATTEMPTS)
    .order('scheduled_at')
    .limit(Math.max(1, Math.min(limit, 20)));
  if (error) throw error;
  if (!posts?.length) return { attempted: 0, published: 0, failed: 0, retried: 0, errors: [] };

  const config = await loadConfig();
  let attempted = 0;
  let published = 0;
  let terminalFailures = 0;
  let retried = 0;
  const planIds: string[] = [];
  const errors: Array<{ postId: string; error: string; nextStatus: 'scheduled' | 'failed' }> = [];

  for (const post of posts) {
    const nextAttempt = (post.attempts ?? 0) + 1;
    const now = new Date().toISOString();
    const claim = await supabase
      .from('posts')
      .update({ status: 'publishing', attempts: nextAttempt, publishing_started_at: now, last_attempt_at: now })
      .eq('id', post.id)
      .eq('status', 'scheduled')
      .select('id')
      .maybeSingle();
    if (claim.error) throw claim.error;
    if (!claim.data) continue;

    attempted++;
    if (post.plan_id) planIds.push(post.plan_id);
    const publisher = new FacebookPublisher(config);

    try {
      await publisher.initialize();
      const result = await publisher.publishPost(
        { text: post.content, link: post.link ?? '', imageUrl: post.image_url ?? undefined },
        post.group_name,
      );
      if (!result.success) throw new Error(result.error ?? 'Falha na publicação Facebook');

      const publishedAt = result.publishedAt ?? new Date().toISOString();
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          status: 'published',
          published_at: publishedAt,
          facebook_post_id: result.postId ?? null,
          error_message: null,
          publishing_started_at: null,
        })
        .eq('id', post.id)
        .eq('status', 'publishing');
      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('publication_history')
        .update({ status: 'published', published_at: publishedAt })
        .eq('post_id', post.id);
      if (historyError) throw historyError;
      published++;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      const nextStatus = nextAttempt >= MAX_ATTEMPTS ? 'failed' : 'scheduled';
      errors.push({ postId: post.id, error: message, nextStatus });
      if (nextStatus === 'failed') terminalFailures++;
      else retried++;

      const { error: postError } = await supabase
        .from('posts')
        .update({ status: nextStatus, error_message: message, publishing_started_at: null })
        .eq('id', post.id)
        .eq('status', 'publishing');
      if (postError) throw postError;

      const { error: historyError } = await supabase
        .from('publication_history')
        .update({ status: nextStatus === 'failed' ? 'failed' : 'scheduled' })
        .eq('post_id', post.id);
      if (historyError) throw historyError;
    } finally {
      await publisher.cleanup().catch(() => undefined);
    }
  }

  await finalizePlanStatuses(planIds);
  return { attempted, published, failed: terminalFailures, retried, errors };
}
