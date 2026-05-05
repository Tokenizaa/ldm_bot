import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, PriceHistory, DashboardStats } from '../types';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Furadeira de Impacto 1/2 Pol. 550W GSB 550 RE',
    slug: 'furadeira-impacto-bosch-gsb550',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400',
    price: 289.90,
    old_price: 349.90,
    discount: 17,
    category: 'Ferramentas Elétricas',
    brand: 'Bosch',
    affiliate_url: 'https://example.com/aff/1',
    original_url: 'https://lojadomecanico.com.br/1',
    ai_description: 'Alta performance para perfurações em concreto, aço e madeira.',
    ai_score: 92,
    active: true,
    is_hot: false,
    views: 0,
    clicks: 0,
    ctr: 0,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Jogo de Chaves de Fenda e Phillips com 6 Peças',
    slug: 'jogo-chaves-fenda-phillips-6pcs',
    image: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&q=80&w=400',
    price: 45.00,
    old_price: 89.00,
    discount: 49,
    category: 'Ferramentas Manuais',
    brand: 'Gedore',
    affiliate_url: 'https://example.com/aff/2',
    original_url: 'https://lojadomecanico.com.br/2',
    ai_description: 'Conjunto essencial para mecânica e manutenção industrial.',
    ai_score: 85,
    active: true,
    is_hot: false,
    views: 0,
    clicks: 0,
    ctr: 0,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Compressor de Ar Direto 1/2HP Monofásico',
    slug: 'compressor-ar-direto-schulz',
    image: 'https://images.unsplash.com/photo-1610915354914-9989b6576c24?auto=format&fit=crop&q=80&w=400',
    price: 1249.00,
    old_price: 1499.00,
    discount: 16,
    category: 'Máquinas e Equipamentos',
    brand: 'Schulz',
    affiliate_url: 'https://example.com/aff/3',
    original_url: 'https://lojadomecanico.com.br/3',
    ai_description: 'Ideal para pinturas domésticas e serviços leves de inflagem.',
    ai_score: 78,
    active: true,
    is_hot: false,
    views: 0,
    clicks: 0,
    ctr: 0,
    created_at: new Date().toISOString()
  }
];

export const productService = {
  async getProducts(): Promise<Product[]> {
    if (!isSupabaseConfigured) return MOCK_PRODUCTS;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data || data.length === 0) {
      return MOCK_PRODUCTS;
    }
    return data;
  },

  async getProductById(id: string): Promise<Product | null> {
    if (!isSupabaseConfigured) return MOCK_PRODUCTS.find(p => p.id === id) || null;
    
    // Increment view
    await supabase.rpc('increment_views', { product_id: id });

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return MOCK_PRODUCTS.find(p => p.id === id) || null;
    }
    return data;
  },

  async trackClick(productId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.rpc('increment_clicks', { product_id: productId });
  },

  async getPriceHistory(productId: string): Promise<PriceHistory[]> {
    if (!isSupabaseConfigured) {
      const basePrice = MOCK_PRODUCTS.find(p => p.id === productId)?.price || 300;
      return [
        { id: 'h1', product_id: productId, price: basePrice + 50, created_at: '2024-04-26T10:00:00Z' },
        { id: 'h2', product_id: productId, price: basePrice + 30, created_at: '2024-04-28T10:00:00Z' },
        { id: 'h3', product_id: productId, price: basePrice + 10, created_at: '2024-05-01T10:00:00Z' },
        { id: 'h4', product_id: productId, price: basePrice, created_at: new Date().toISOString() },
      ];
    }
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });
    
    if (error || !data || data.length === 0) {
      // Mocked history
      const basePrice = MOCK_PRODUCTS.find(p => p.id === productId)?.price || 300;
      return [
        { id: 'h1', product_id: productId, price: basePrice + 50, created_at: '2024-04-26T10:00:00Z' },
        { id: 'h2', product_id: productId, price: basePrice + 30, created_at: '2024-04-28T10:00:00Z' },
        { id: 'h3', product_id: productId, price: basePrice + 10, created_at: '2024-05-01T10:00:00Z' },
        { id: 'h4', product_id: productId, price: basePrice, created_at: new Date().toISOString() },
      ];
    }
    return data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const products = await this.getProducts();
    
    return {
      totalProducts: products.length,
      activeOffers: products.filter(p => p.active).length,
      publishedToday: Math.floor(products.length * 0.3), // Mock
      topCategories: [
        { name: 'Ferramentas Elétricas', count: 45 },
        { name: 'Manual/Mecânica', count: 32 },
        { name: 'Casa e Jardim', count: 18 }
      ],
      topBrands: [
        { name: 'Bosch', count: 12 },
        { name: 'Makita', count: 10 },
        { name: 'Gedore', count: 8 }
      ]
    };
  }
};
