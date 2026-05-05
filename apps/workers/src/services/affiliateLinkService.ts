import type { AffiliateLink, AffiliatePriceHistory } from '@forge-deals/shared/types';
import { getSupabaseAdmin } from './supabaseAdmin';

export const affiliateLinkService = {
  async findByAffiliateUrl(affiliateUrl: string): Promise<AffiliateLink | null> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('affiliate_url', affiliateUrl)
      .maybeSingle();

    if (error) throw error;
    return (data as AffiliateLink) || null;
  },

  async createLink(link: AffiliateLink): Promise<AffiliateLink> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('affiliate_links')
      .insert(link)
      .select()
      .single();

    if (error) throw error;
    return data as AffiliateLink;
  },

  async addPriceRecord(linkId: string, price: number): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { data: current, error: currentError } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('id', linkId)
      .single();
    if (currentError) throw currentError;

    const currentLink = current as AffiliateLink;
    const priceChange = price - currentLink.current_price;

    const { error: historyError } = await supabase
      .from('affiliate_price_history')
      .insert({
        affiliate_link_id: linkId,
        price,
        price_change: priceChange
      } satisfies Partial<AffiliatePriceHistory>);
    if (historyError) throw historyError;

    const { error: updateError } = await supabase
      .from('affiliate_links')
      .update({
        current_price: price,
        previous_price: currentLink.current_price,
        last_checked_at: new Date().toISOString(),
        last_price_change: new Date().toISOString(),
        lowest_price: currentLink.lowest_price ? Math.min(currentLink.lowest_price, price) : price
      })
      .eq('id', linkId);
    if (updateError) throw updateError;
  }
};

