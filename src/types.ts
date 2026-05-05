export interface Product {
  id: string;
  title: string;
  slug: string;
  image: string;
  price: number;
  old_price: number;
  discount: number;
  category: string;
  brand: string;
  affiliate_url: string;
  original_url: string;
  ai_description?: string;
  ai_score?: number; // 0-100
  ai_analysis?: string;
  telegram_copy?: string;
  active: boolean;
  is_hot: boolean;
  views: number;
  clicks: number;
  ctr: number;
  created_at: string;
}

export interface CrawlerLog {
  id: string;
  source: string;
  status: 'success' | 'failure';
  total_products: number;
  new_products: number;
  updated_products: number;
  ignored_products: number;
  duration_ms: number;
  error_message?: string;
  created_at: string;
}

export interface AffiliateLink {
  id: string;
  product_name: string;
  affiliate_url: string;
  original_url: string;
  category: string;
  brand: string;
  current_price: number;
  previous_price: number;
  lowest_price: number;
  monitored: boolean;
  last_checked_at: string;
  created_at: string;
  price_drop_percentage?: number;
  opportunity_score?: number;
  last_price_change?: string;
}

export interface AffiliateLinkStats {
  total_monitored: number;
  active_links: number;
  price_drops_today: number;
  biggest_drop: number;
  top_categories: { name: string; count: number }[];
  top_brands: { name: string; count: number }[];
  recent_opportunities: AffiliateLink[];
}

export interface AffiliatePriceHistory {
  id: string;
  affiliate_link_id: string;
  price: number;
  price_change: number;
  created_at: string;
}

export interface CrawlerQueue {
  scraping: number;
  ai_processing: number;
  publication: number;
}

export interface PlaywrightStatus {
  browser_status: 'running' | 'idle' | 'error';
  last_url: string;
  memory_usage: string;
  avg_collection_time: string;
  recent_screenshots: string[];
}

export interface PriceHistory {
  id: string;
  product_id: string;
  price: number;
  created_at: string;
}

export interface Post {
  id: string;
  product_id: string;
  platform: 'telegram' | 'whatsapp' | 'instagram' | 'facebook';
  status: 'pending' | 'published' | 'failed';
  created_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  activeOffers: number;
  publishedToday: number;
  topCategories: { name: string; count: number }[];
  topBrands: { name: string; count: number }[];
}
