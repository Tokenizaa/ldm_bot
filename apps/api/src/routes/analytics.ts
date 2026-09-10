import { FastifyInstance } from 'fastify';
import { getSupabaseAdmin } from '../services/supabaseAdmin.js';

export async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.get('/analytics/overview', async () => {
    try {
      const supabase = getSupabaseAdmin();
      const { count: totalProducts } = await supabase.from('affiliate_links').select('*', { count: 'exact', head: true });
      const { count: activeLinks } = await supabase.from('affiliate_links').select('*', { count: 'exact', head: true }).eq('monitored', true);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count: priceDropsToday } = await supabase.from('affiliate_price_history').select('*', { count: 'exact', head: true }).lt('price_change', 0).gte('created_at', today.toISOString());
      const { data: categoryData } = await supabase.from('affiliate_links').select('category').eq('monitored', true);
      const categoryCounts: Record<string, number> = {};
      categoryData?.forEach((item) => { if (item.category) categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1; });
      const topCategories = Object.entries(categoryCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      const { data: brandData } = await supabase.from('affiliate_links').select('brand').eq('monitored', true);
      const brandCounts: Record<string, number> = {};
      brandData?.forEach((item) => { if (item.brand) brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1; });
      const topBrands = Object.entries(brandCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      const { data: opportunities } = await supabase.from('affiliate_links').select('*').eq('monitored', true).gt('price_drop_percentage', 0).order('price_drop_percentage', { ascending: false }).limit(10);
      return { success: true, data: { totalProducts: totalProducts || 0, activeLinks: activeLinks || 0, priceDropsToday: priceDropsToday || 0, biggestDrop: opportunities?.[0]?.price_drop_percentage || 0, topCategories, topBrands, recentOpportunities: opportunities || [] } };
    } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }; }
  });

  fastify.get('/analytics/products', async () => {
    try {
      const supabase = getSupabaseAdmin();
      const { data: products } = await supabase.from('affiliate_links').select('*').eq('monitored', true).order('last_checked_at', { ascending: false }).limit(50);
      const scoreRanges = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
      products?.forEach((p) => { const score = p.opportunity_score || 0; if (score <= 20) scoreRanges['0-20']++; else if (score <= 40) scoreRanges['21-40']++; else if (score <= 60) scoreRanges['41-60']++; else if (score <= 80) scoreRanges['61-80']++; else scoreRanges['81-100']++; });
      const avgScore = products?.length ? products.reduce((sum, p) => sum + (p.opportunity_score || 0), 0) / products.length : 0;
      const brandFreq: Record<string, number> = {}; products?.forEach((p) => { if (p.brand) brandFreq[p.brand] = (brandFreq[p.brand] || 0) + 1; });
      const catFreq: Record<string, number> = {}; products?.forEach((p) => { if (p.category) catFreq[p.category] = (catFreq[p.category] || 0) + 1; });
      return { success: true, data: { products: products || [], scoreDistribution: scoreRanges, averageScore: Math.round(avgScore * 100) / 100, brandFrequency: Object.entries(brandFreq).map(([name, count]) => ({ name, count })), categoryFrequency: Object.entries(catFreq).map(([name, count]) => ({ name, count })) } };
    } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }; }
  });

  fastify.get('/analytics/operational', async () => {
    try {
      const supabase = getSupabaseAdmin();
      const { data: crawlerLogs } = await supabase.from('crawler_logs').select('*').order('created_at', { ascending: false }).limit(20);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data: postsToday } = await supabase.from('posts').select('*').gte('created_at', today.toISOString()).order('created_at', { ascending: false });
      const logs = crawlerLogs || [];
      const posts = postsToday || [];
      const successfulRuns = logs.filter((log) => log.status === 'success').length;
      const publishedPosts = posts.filter((post) => post.status === 'published').length;
      const failedPosts = posts.filter((post) => post.status === 'failed').length;
      return { success: true, data: { crawlerLogs: logs, postsToday: posts.length, publishedPosts, failedPosts, crawlerSuccessRate: logs.length ? Math.round((successfulRuns / logs.length) * 10000) / 100 : 0, publicationSuccessRate: posts.length ? Math.round((publishedPosts / posts.length) * 10000) / 100 : 0 } };
    } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }; }
  });
}
