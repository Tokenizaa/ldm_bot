import { createClient } from '@supabase/supabase-js';

export interface Product {
  id?: string;
  title: string;
  price: number;
  old_price: number;
  image: string;
  affiliate_url: string;
  category: string;
  brand: string;
  created_at?: string;
}

export interface Post {
  id?: string;
  product_id: string;
  facebook_post_id: string;
  status: 'pending' | 'posted' | 'failed';
  created_at?: string;
}

export class SupabaseService {
  private supabase: any;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async saveProduct(product: Product): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createPost(post: Omit<Post, 'id' | 'created_at'>): Promise<Post> {
    const { data, error } = await this.supabase
      .from('posts')
      .insert(post)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePostStatus(postId: string, status: Post['status'], facebookPostId?: string): Promise<void> {
    const updateData: Partial<Post> = { status };
    if (facebookPostId) {
      updateData.facebook_post_id = facebookPostId;
    }

    const { error } = await this.supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId);

    if (error) throw error;
  }
}
