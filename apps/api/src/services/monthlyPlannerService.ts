import { buildProductIdentityKey, MONTHLY_PLAN_TOTAL_POSTS } from '@forge-deals/shared';
import { getSupabaseAdmin } from './supabaseAdmin.js';

const RECENT_PUBLICATION_DAYS = 30;
const MAX_CONCURRENT_UPDATES = 10;

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
  return buildProductIdentityKey({
    brand: candidate.brand,
    productName: candidate.product_name,
    category: candidate.category
  });
}

function rank(a: Candidate, b: Candidate): number {
  const scoreDiff = (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0);
  if (scoreDiff !== 0) return scoreDiff;
  return a.created_at.localeCompare(b.created_at);
}

async function loadRecentAffiliateIds(periodStart: string): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(`${periodStart}T00:00:00.000Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - RECENT_PUBLICATION_DAYS);

  const { data, error } = await supabase
    .from('posts')
    .select('affiliate_link_id, scheduled_at')
    .not('affiliate_link_id', 'is', null)
    .gte('scheduled_at', cutoff.toISOString());

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
    .filter((candidate) => {
      if (!candidate.identityKey || seen.has(candidate.identityKey)) return false;
      seen.add(candidate.identityKey);
      return true;
    })
    .sort(rank);
}

function selectDiverse(candidates: Candidate[], count: number, recentAffiliateIds: Set<string>): Candidate[] {
  const selected: Candidate[] = [];
  const selectedIdentities = new Set<string>();
  const recentCategories = new Set<string>();
  const recentBrands = new Set<string>();

  for (const candidate of candidates) {
    if (selected.length >= count) break;
    if (recentAffiliateIds.has(candidate.id) || selectedIdentities.has(candidate.identityKey)) continue;

    const category = candidate.category?.trim().toLowerCase() || 'sem-categoria';
    const brand = candidate.brand?.trim().toLowerCase() || 'sem-marca';

    // Prefer variety, but never sacrifice product uniqueness just to fill a slot.
    const categoryPenalty = recentCategories.has(category) ? 1 : 0;
    const brandPenalty = recentBrands.has(brand) ? 1 : 0;
    const insertionIndex = selected.findIndex((item) => {
      const itemCategory = item.category?.trim().toLowerCase() || 'sem-categoria';
      const itemBrand = item.brand?.trim().toLowerCase() || 'sem-marca';
      const itemPenalty = (recentCategories.has(itemCategory) ? 1 : 0) + (recentBrands.has(itemBrand) ? 1 : 0);
      return categoryPenalty + brandPenalty < itemPenalty;
    });

    if (insertionIndex >= 0) selected.splice(insertionIndex, 0, candidate);
    else selected.push(candidate);

    selectedIdentities.add(candidate.identityKey);
    recentCategories.add(category);
    recentBrands.add(brand);
  }

  return selected.slice(0, count);
}

export async function fillMonthlyPlan(planId: string) {
  const supabase = getSupabaseAdmin();
  const { data: plan, error: planError } = await supabase
    .from('monthly_plans')
    .select('id, period_start, status')
    .eq('id', planId)
    .maybeSingle();

  if (planError) throw planError;
  if (!plan) throw new Error('Plano mensal não encontrado');
  if (plan.status === 'published' || plan.status === 'scheduled') {
    throw new Error('Plano mensal já está em estado protegido para edição');
  }

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, slot_index, affiliate_link_id')
    .eq('plan_id', planId)
    .order('slot_index', { ascending: true });

  if (postsError) throw postsError;
  if (!posts || posts.length !== MONTHLY_PLAN_TOTAL_POSTS) {
    throw new Error(`Plano inválido: esperado ${MONTHLY_PLAN_TOTAL_POSTS} slots, encontrado ${posts?.length ?? 0}`);
  }

  const recentAffiliateIds = await loadRecentAffiliateIds(plan.period_start);
  const candidates = await loadCandidates();
  const selected = selectDiverse(candidates, posts.length, recentAffiliateIds);

  if (selected.length === 0) throw new Error('Nenhum produto elegível encontrado');

  const updates = posts.slice(0, selected.length).map((post, index) => {
    const candidate = selected[index];
    return {
      id: post.id,
      affiliate_link_id: candidate.id,
      link: candidate.affiliate_url,
      image_url: null,
      status: 'draft'
    };
  });

  for (let i = 0; i < updates.length; i += MAX_CONCURRENT_UPDATES) {
    const chunk = updates.slice(i, i + MAX_CONCURRENT_UPDATES);
    const results = await Promise.all(chunk.map((update) =>
      supabase.from('posts').update(update).eq('id', update.id)
    ));
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
  }

  const { error: statusError } = await supabase
    .from('monthly_plans')
    .update({ status: selected.length === posts.length ? 'draft' : 'partial' })
    .eq('id', planId);

  if (statusError) throw statusError;

  return {
    planId,
    requested: posts.length,
    selected: selected.length,
    remaining: posts.length - selected.length,
    selectionComplete: selected.length === posts.length,
    candidatesAvailable: candidates.length,
    recentProductsExcluded: recentAffiliateIds.size
  };
}
