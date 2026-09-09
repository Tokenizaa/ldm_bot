import { buildProductIdentityKey, MONTHLY_PLAN_TOTAL_POSTS } from '@forge-deals/shared';
import { getSupabaseAdmin } from './supabaseAdmin.js';
import { generateProductCopy } from './nvidiaService.js';

const RECENT_PUBLICATION_DAYS = 30;
const MAX_CONCURRENT_UPDATES = 10;
const MAX_CONCURRENT_GENERATIONS = 3;

type AffiliateCandidate = {
  id: string;
  product_name: string;
  affiliate_url: string;
  original_url: string;
  category: string;
  brand: string;
  current_price: number;
  monitored: boolean;
  opportunity_score?: number | null;
  last_checked_at?: string | null;
  created_at: string;
};

type Candidate = AffiliateCandidate & { identityKey: string };

function candidateIdentity(candidate: AffiliateCandidate): string {
  return buildProductIdentityKey({ brand: candidate.brand, productName: candidate.product_name, category: candidate.category });
}

function rank(a: Candidate, b: Candidate): number {
  const scoreDiff = (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0);
  return scoreDiff || a.created_at.localeCompare(b.created_at);
}

async function loadRecentAffiliateIds(periodStart: string): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(`${periodStart}T00:00:00.000Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - RECENT_PUBLICATION_DAYS);
  const { data, error } = await supabase.from('posts').select('affiliate_link_id').not('affiliate_link_id', 'is', null).gte('scheduled_at', cutoff.toISOString());
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.affiliate_link_id).filter(Boolean));
}

async function loadCandidates(): Promise<Candidate[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('affiliate_links')
    .select('id, product_name, affiliate_url, original_url, category, brand, current_price, monitored, opportunity_score, last_checked_at, created_at')
    .eq('monitored', true);
  if (error) throw error;

  const seen = new Set<string>();
  return ((data ?? []) as AffiliateCandidate[])
    .map((candidate) => ({ ...candidate, identityKey: candidateIdentity(candidate) }))
    .filter((candidate) => candidate.identityKey && !seen.has(candidate.identityKey) && seen.add(candidate.identityKey))
    .sort(rank);
}

function selectDiverse(candidates: Candidate[], count: number, recentAffiliateIds: Set<string>): Candidate[] {
  const selected: Candidate[] = [];
  const selectedIdentities = new Set<string>();
  const categoryCounts = new Map<string, number>();
  const brandCounts = new Map<string, number>();

  while (selected.length < count) {
    const available = candidates.filter((candidate) => !recentAffiliateIds.has(candidate.id) && !selectedIdentities.has(candidate.identityKey));
    if (!available.length) break;

    available.sort((a, b) => {
      const aCategory = a.category?.trim().toLowerCase() || 'sem-categoria';
      const bCategory = b.category?.trim().toLowerCase() || 'sem-categoria';
      const aBrand = a.brand?.trim().toLowerCase() || 'sem-marca';
      const bBrand = b.brand?.trim().toLowerCase() || 'sem-marca';
      const diversity = ((categoryCounts.get(aCategory) ?? 0) + (brandCounts.get(aBrand) ?? 0)) - ((categoryCounts.get(bCategory) ?? 0) + (brandCounts.get(bBrand) ?? 0));
      return diversity || rank(a, b);
    });

    const candidate = available[0];
    selected.push(candidate);
    selectedIdentities.add(candidate.identityKey);
    const category = candidate.category?.trim().toLowerCase() || 'sem-categoria';
    const brand = candidate.brand?.trim().toLowerCase() || 'sem-marca';
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
  }
  return selected;
}

export async function fillMonthlyPlan(planId: string) {
  const supabase = getSupabaseAdmin();
  const { data: plan, error: planError } = await supabase.from('monthly_plans').select('id, period_start, status').eq('id', planId).maybeSingle();
  if (planError) throw planError;
  if (!plan) throw new Error('Plano mensal não encontrado');
  if (plan.status === 'published' || plan.status === 'scheduled') throw new Error('Plano mensal já está em estado protegido para edição');

  const { data: posts, error: postsError } = await supabase.from('posts').select('id, slot_index, affiliate_link_id').eq('plan_id', planId).order('slot_index', { ascending: true });
  if (postsError) throw postsError;
  if (!posts || posts.length !== MONTHLY_PLAN_TOTAL_POSTS) throw new Error(`Plano inválido: esperado ${MONTHLY_PLAN_TOTAL_POSTS} slots, encontrado ${posts?.length ?? 0}`);

  const recentAffiliateIds = await loadRecentAffiliateIds(plan.period_start);
  const candidates = await loadCandidates();
  const selected = selectDiverse(candidates, posts.length, recentAffiliateIds);
  if (!selected.length) throw new Error('Nenhum produto elegível encontrado');

  const updates = posts.slice(0, selected.length).map((post, index) => ({ id: post.id, affiliate_link_id: selected[index].id, link: selected[index].affiliate_url, image_url: null, status: 'draft' }));
  for (let i = 0; i < updates.length; i += MAX_CONCURRENT_UPDATES) {
    const results = await Promise.all(updates.slice(i, i + MAX_CONCURRENT_UPDATES).map((update) => supabase.from('posts').update(update).eq('id', update.id)));
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
  }

  const { error: statusError } = await supabase.from('monthly_plans').update({ status: selected.length === posts.length ? 'draft' : 'partial' }).eq('id', planId);
  if (statusError) throw statusError;

  return { planId, requested: posts.length, selected: selected.length, remaining: posts.length - selected.length, selectionComplete: selected.length === posts.length, candidatesAvailable: candidates.length, recentProductsExcluded: recentAffiliateIds.size };
}

export async function generateMonthlyPlanCopies(planId: string) {
  const supabase = getSupabaseAdmin();
  const { data: posts, error: postsError } = await supabase.from('posts').select('id, affiliate_link_id, content, slot_index').eq('plan_id', planId).not('affiliate_link_id', 'is', null).order('slot_index', { ascending: true });
  if (postsError) throw postsError;
  if (!posts?.length) throw new Error('Nenhum produto selecionado para gerar copy');

  const ids = [...new Set(posts.map((post) => post.affiliate_link_id).filter(Boolean))];
  const { data: links, error: linksError } = await supabase.from('affiliate_links').select('id, product_name, affiliate_url, category, brand').in('id', ids);
  if (linksError) throw linksError;
  const byId = new Map((links ?? []).map((link) => [link.id, link]));
  let generated = 0;
  let skipped = 0;
  const errors: Array<{ postId: string; error: string }> = [];

  for (let i = 0; i < posts.length; i += MAX_CONCURRENT_GENERATIONS) {
    const chunk = posts.slice(i, i + MAX_CONCURRENT_GENERATIONS);
    const results = await Promise.all(chunk.map(async (post) => {
      try {
        if (post.content?.trim()) return 'skipped';
        const product = byId.get(post.affiliate_link_id);
        if (!product) throw new Error(`Affiliate link não encontrado: ${post.affiliate_link_id}`);
        const copy = await generateProductCopy({ productName: product.product_name, brand: product.brand, category: product.category });
        const content = `${copy}\n\n👉 Confira: ${product.affiliate_url}\n\n@everyone`;
        const { error } = await supabase.from('posts').update({ content, link: product.affiliate_url, status: 'draft' }).eq('id', post.id);
        if (error) throw error;
        return 'generated';
      } catch (error) {
        errors.push({ postId: post.id, error: error instanceof Error ? error.message : 'Erro desconhecido' });
        return 'error';
      }
    }));
    generated += results.filter((result) => result === 'generated').length;
    skipped += results.filter((result) => result === 'skipped').length;
  }

  return { planId, generated, skipped, failed: errors.length, errors };
}
