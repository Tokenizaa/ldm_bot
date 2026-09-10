import { buildProductIdentityKey } from '@forge-deals/shared';
import type { AffiliateLink, AffiliatePriceHistory } from '@forge-deals/shared/types';
import { getSupabaseAdmin } from './supabaseAdmin.js';

export const affiliateLinkService = {
  async findByAffiliateUrl(affiliateUrl: string): Promise<AffiliateLink | null> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('affiliate_links').select('*').eq('affiliate_url', affiliateUrl).maybeSingle();
    if (error) throw error;
    return (data as AffiliateLink) || null;
  },

  async createLink(link: AffiliateLink): Promise<AffiliateLink> {
    const supabase = getSupabaseAdmin();
    const sku = (link as AffiliateLink & { sku?: string }).sku;
    const productIdentityInput = {
      ...(sku ? { sku } : {}),
      brand: link.brand,
      productName: link.product_name,
      category: link.category
    };
    const product_identity_key = buildProductIdentityKey(productIdentityInput);
    if (!product_identity_key) throw new Error('Produto sem identidade suficiente para cadastro');

    const { data, error } = await supabase
      .from('affiliate_links')
      .insert({ ...link, product_identity_key })
      .select()
      .single();
    if (error) throw error;
    return data as AffiliateLink;
  },

  async addPriceRecord(linkId: string, price: number): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { data: current, error: currentError } = await supabase.from('affiliate_links').select('*').eq('id', linkId).single();
    if (currentError) throw currentError;
    const currentLink = current as AffiliateLink;
    const priceChange = price - currentLink.current_price;

    const { error: historyError } = await supabase.from('affiliate_price_history').insert({ affiliate_link_id: linkId, price, price_change: priceChange } satisfies Partial<AffiliatePriceHistory>);
    if (historyError) throw historyError;

    const { error: updateError } = await supabase.from('affiliate_links').update({ current_price: price, previous_price: currentLink.current_price, last_checked_at: new Date().toISOString(), last_price_change: new Date().toISOString(), lowest_price: currentLink.lowest_price ? Math.min(currentLink.lowest_price, price) : price }).eq('id', linkId);
    if (updateError) throw updateError;
  }
};
