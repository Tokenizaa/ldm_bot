import { supabase } from '../lib/supabase';
import { AffiliateLink, AffiliateLinkStats, AffiliatePriceHistory } from '../types';

export const affiliateLinkService = {
  // CRUD Operations
  async getLinks(): Promise<AffiliateLink[]> {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching affiliate links:', error);
      return [];
    }
  },

  async getLinkById(id: string): Promise<AffiliateLink | null> {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching affiliate link:', error);
      return null;
    }
  },

  async createLink(link: Omit<AffiliateLink, 'id' | 'created_at'>): Promise<AffiliateLink> {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .insert(link)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating affiliate link:', error);
      throw new Error('Failed to create affiliate link');
    }
  },

  async updateLink(id: string, updates: Partial<AffiliateLink>): Promise<AffiliateLink> {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .update({ ...updates, last_checked_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating affiliate link:', error);
      throw new Error('Failed to update affiliate link');
    }
  },

  async deleteLink(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('affiliate_links')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting affiliate link:', error);
      throw new Error('Failed to delete affiliate link');
    }
  },

  async toggleMonitoring(id: string, monitored: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('affiliate_links')
        .update({ monitored })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error toggling monitoring:', error);
      throw new Error('Failed to toggle monitoring');
    }
  },

  // Price History
  async getPriceHistory(linkId: string): Promise<AffiliatePriceHistory[]> {
    try {
      const { data, error } = await supabase
        .from('affiliate_price_history')
        .select('*')
        .eq('affiliate_link_id', linkId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching price history:', error);
      return [];
    }
  },

  async addPriceRecord(linkId: string, price: number): Promise<void> {
    try {
      // Get current price to calculate change
      const currentLink = await this.getLinkById(linkId);
      if (!currentLink) throw new Error('Link not found');
      
      const priceChange = price - currentLink.current_price;
      const priceChangePercentage = currentLink.current_price > 0 
        ? ((price - currentLink.current_price) / currentLink.current_price) * 100 
        : 0;

      // Add to price history
      const { error: historyError } = await supabase
        .from('affiliate_price_history')
        .insert({
          affiliate_link_id: linkId,
          price,
          price_change: priceChange
        });
      
      if (historyError) throw historyError;

      // Update main link record
      const updates: Partial<AffiliateLink> = {
        current_price: price,
        previous_price: currentLink.current_price,
        last_checked_at: new Date().toISOString(),
        last_price_change: new Date().toISOString()
      };

      // Update lowest price if new price is lower
      if (price < currentLink.lowest_price || !currentLink.lowest_price) {
        updates.lowest_price = price;
      }

      // Calculate opportunity score based on price drop
      if (priceChange < 0) {
        updates.price_drop_percentage = Math.abs(priceChangePercentage);
        updates.opportunity_score = Math.min(100, Math.abs(priceChangePercentage) * 2);
      }

      await this.updateLink(linkId, updates);
    } catch (error) {
      console.error('Error adding price record:', error);
      throw new Error('Failed to add price record');
    }
  },

  // Statistics and Dashboard
  async getStats(): Promise<AffiliateLinkStats> {
    try {
      const [linksResult, todayResult] = await Promise.all([
        supabase.from('affiliate_links').select('*'),
        supabase
          .from('affiliate_price_history')
          .select('*')
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      ]);

      const links = linksResult.data || [];
      const todayChanges = todayResult.data || [];

      const totalMonitored = links.length;
      const activeLinks = links.filter((link: AffiliateLink) => link.monitored).length;
      
      // Calculate price drops today
      const priceDropsToday = todayChanges.filter((change: AffiliatePriceHistory) => change.price_change < 0).length;
      
      // Find biggest drop
      const biggestDrop = todayChanges.length > 0 
        ? Math.min(...todayChanges.map((change: AffiliatePriceHistory) => change.price_change || 0))
        : 0;

      // Top categories and brands
      const categoryCount = links.reduce((acc: Record<string, number>, link: AffiliateLink) => {
        if (link.category) {
          acc[link.category] = (acc[link.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const brandCount = links.reduce((acc: Record<string, number>, link: AffiliateLink) => {
        if (link.brand) {
          acc[link.brand] = (acc[link.brand] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topCategories = Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count: Number(count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const topBrands = Object.entries(brandCount)
        .map(([name, count]) => ({ name, count: Number(count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent opportunities (links with price drops)
      const recentOpportunities = links
        .filter((link: AffiliateLink) => link.price_drop_percentage && link.price_drop_percentage > 5)
        .sort((a: AffiliateLink, b: AffiliateLink) => (b.price_drop_percentage || 0) - (a.price_drop_percentage || 0))
        .slice(0, 5);

      return {
        total_monitored: totalMonitored,
        active_links: activeLinks,
        price_drops_today: priceDropsToday,
        biggest_drop: Math.abs(biggestDrop),
        top_categories: topCategories,
        top_brands: topBrands,
        recent_opportunities: recentOpportunities
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        total_monitored: 0,
        active_links: 0,
        price_drops_today: 0,
        biggest_drop: 0,
        top_categories: [],
        top_brands: [],
        recent_opportunities: []
      };
    }
  },

  // Bulk operations
  async bulkImport(links: Omit<AffiliateLink, 'id' | 'created_at'>[]): Promise<AffiliateLink[]> {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .insert(links)
        .select();
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error bulk importing links:', error);
      throw new Error('Failed to bulk import links');
    }
  },

  // Search and filter
  async searchLinks(query: string): Promise<AffiliateLink[]> {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .or(`product_name.ilike.%${query}%,brand.ilike.%${query}%,category.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching links:', error);
      return [];
    }
  },

  async getLinksByCategory(category: string): Promise<AffiliateLink[]> {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching links by category:', error);
      return [];
    }
  },

  async getLinksByBrand(brand: string): Promise<AffiliateLink[]> {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('brand', brand)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching links by brand:', error);
      return [];
    }
  }
};
