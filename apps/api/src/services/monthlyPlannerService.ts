import { getSupabaseAdmin } from './supabaseAdmin.js';
import { buildProductIdentityKey, MONTHLY_PLAN_TOTAL_POSTS } from '@forge-deals/shared';
import { generateProductCopy } from './nvidiaService.js';

const MAX_CONCURRENT_UPDATES = 10;

type Candidate = {
  id: string;
  affiliate_url: string;
  brand: string | null;
  product_name: string | null;
  category: string | null;
  identityKey: string;
};

function rank(a: Candidate, b: Candidate): number {
  const aScore = Number(Boolean(a.brand)) + Number(Boolean(a.product_name)) + Number(Boolean(a.category));
  const bScore = Number(Boolean(b.brand)) + Number(Boolean(b.product_name)) + Number(Boolean(b.category));
  return bScore - aScore || a.id.localeCompare(b.id);
}

async function loadRecentProductIdentities(periodStart: string): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('publication_history')
    .select('product_identity_key')
    .eq('status', 'published')
    .lt('published_at', `${periodStart}T00:00:00.000Z`)
    .order('published_at', { ascending: false })
    .limit(MONTHLY_PLAN_TOTAL_POSTS);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.product_identity_key).filter((key): key is string => Boolean(key)));
}

async function loadCandidates(): Promise<Candidate[]> {
  const supabase = getSupabaseAdmin();
  // `monitored` is the persisted eligibility flag in the real schema; there is no `active` column.
  const { data, error } = await supabase
    .from('affiliate_links')
    .select('id,affiliate_url,brand,product_name,category,product_identity_key')
    .eq('monitored', true);
  if (error) throw error;

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      affiliate_url: row.affiliate_url,
      brand: row.brand,
      product_name: row.product_name,
      category: row.category,
      identityKey: row.product_identity_key || buildProductIdentityKey({
        brand: row.brand,
        productName: row.product_name,
        category: row.category,
      }),
    }))
    .filter((candidate) => Boolean(candidate.identityKey))
    .sort(rank);
}

function selectDiverse(candidates: Candidate[], count: number, recentIdentities: Set<string>): Candidate[] {
  const selected: Candidate[] = [];
  const selectedIdentities = new Set<string>();
  const categoryCounts = new Map<string, number>();
  const brandCounts = new Map<string, number>();

  while (selected.length < count) {
    const available = candidates.filter(
      (candidate) => !recentIdentities.has(candidate.identityKey) && !selectedIdentities.has(candidate.identityKey),
    );
    if (!available.length) break;

    available.sort((a, b) => {
      const aCategory = a.category?.trim().toLowerCase() || 'sem-categoria';
      const bCategory = b.category?.trim().toLowerCase() || 'sem-categoria';
      const aBrand = a.brand?.trim().toLowerCase() || 'sem-marca';
      const bBrand = b.brand?.trim().toLowerCase() || 'sem-marca';
      const diversity =
        (categoryCounts.get(aCategory) ?? 0) + (brandCounts.get(aBrand) ?? 0) -
        ((categoryCounts.get(bCategory) ?? 0) + (brandCounts.get(bBrand) ?? 0));
      return diversity || rank(a, b);
    });

    const candidate = available[0];
    if (!candidate) break;
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
  const { data: plan, error: planError } = await supabase
    .from('monthly_plans')
    .select('id,period_start,status')
    .eq('id', planId)
    .maybeSingle();
  if (planError) throw planError;
  if (!plan) throw new Error('Plano mensal não encontrado');
  if (plan.status === 'published' || plan.status === 'scheduled') {
    throw new Error('Plano mensal já está em estado protegido para edição');
  }

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id,slot_index,affiliate_link_id')
    .eq('plan_id', planId)
    .order('slot_index', { ascending: true });
  if (postsError) throw postsError;
  if (!posts || posts.length !== MONTHLY_PLAN_TOTAL_POSTS) {
    throw new Error(`Plano inválido: esperado ${MONTHLY_PLAN_TOTAL_POSTS} slots, encontrado ${posts?.length ?? 0}`);
  }

  const recentIdentities = await loadRecentProductIdentities(plan.period_start);
  const candidates = await loadCandidates();
  const selected = selectDiverse(candidates, posts.length, recentIdentities);
  if (!selected.length) throw new Error('Nenhum produto elegível encontrado');

  const updates = posts
    .slice(0, selected.length)
    .map((post, index) => {
      const candidate = selected[index];
      if (!candidate) return null;
      return {
        id: post.id,
        affiliate_link_id: candidate.id,
        link: candidate.affiliate_url,
        image_url: null,
        status: 'draft',
      };
    })
    .filter((update): update is { id: string; affiliate_link_id: string; link: string; image_url: null; status: string } => Boolean(update));

  for (let i = 0; i < updates.length; i += MAX_CONCURRENT_UPDATES) {
    const results = await Promise.all(
      updates.slice(i, i + MAX_CONCURRENT_UPDATES).map((update) =>
        supabase.from('posts').update(update).eq('id', update.id),
      ),
    );
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
    recentProductsExcluded: recentIdentities.size,
  };
}

export async function generateMonthlyPlanCopies(planId: string) {
  const supabase = getSupabaseAdmin();
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id,affiliate_link_id')
    .eq('plan_id', planId)
    .order('slot_index');
  if (error) throw error;
  if (!posts?.length) throw new Error('Plano sem posts para gerar copy');

  let generated = 0;
  for (const post of posts) {
    if (!post.affiliate_link_id) continue;
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('id', post.affiliate_link_id)
      .single();
    if (linkError) throw linkError;

    const content = await generateProductCopy(link);
    const { error: updateError } = await supabase
      .from('posts')
      .update({ content, status: 'draft' })
      .eq('id', post.id);
    if (updateError) throw updateError;
    generated++;
  }

  return { planId, generated, total: posts.length };
}
