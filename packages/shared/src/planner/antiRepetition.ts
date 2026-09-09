export interface RecentPost {
  productId: string;
  categoryId: string;
  postType: string;
  contentHash: string;
  postedAt: Date;
}

export class AntiRepetition {
  private recentPosts: RecentPost[] = [];
  private readonly WINDOW_DAYS = 7;

  /**
   * Verifica se produto pode ser usado (não repetido recentemente)
   */
  canUseProduct(productId: string): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.WINDOW_DAYS);

    const recentPost = this.recentPosts.find(post => 
      post.productId === productId && 
      post.postedAt > cutoffDate
    );

    return !recentPost;
  }

  /**
   * Verifica se categoria pode ser usada (evitar excesso)
   */
  canUseCategory(categoryId: string): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.WINDOW_DAYS);

    const categoryPosts = this.recentPosts.filter(post =>
      post.categoryId === categoryId &&
      post.postedAt > cutoffDate
    );

    // Permitir no máximo 2 posts por categoria na janela de 7 dias
    return categoryPosts.length < 2;
  }

  /**
   * Verifica se tipo de post pode ser usado
   */
  canUsePostType(postType: string): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 1); // 1 dia para tipos

    const recentTypePost = this.recentPosts.find(post =>
      post.postType === postType &&
      post.postedAt > cutoffDate
    );

    return !recentTypePost;
  }

  /**
   * Verifica se conteúdo é único (hash)
   */
  isContentUnique(contentHash: string): boolean {
    return !this.recentPosts.some(post => post.contentHash === contentHash);
  }

  /**
   * Adiciona post ao histórico
   */
  addPost(post: RecentPost): void {
    this.recentPosts.push(post);
    this.cleanup();
  }

  /**
   * Remove posts antigos (manutenção)
   */
  private cleanup(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.WINDOW_DAYS);

    this.recentPosts = this.recentPosts.filter(post => post.postedAt > cutoffDate);
  }

  /**
   * Gera hash simples do conteúdo
   */
  generateHash(content: string): string {
    // Hash simples (poderia usar crypto MD5)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Retorna estatísticas
   */
  getStats(): {
    totalRecent: number;
    windowDays: number;
    categoryFrequency: Record<string, number>;
  } {
    const categoryFrequency: Record<string, number> = {};
    
    this.recentPosts.forEach(post => {
      categoryFrequency[post.categoryId] = (categoryFrequency[post.categoryId] || 0) + 1;
    });

    return {
      totalRecent: this.recentPosts.length,
      windowDays: this.WINDOW_DAYS,
      categoryFrequency
    };
  }

  /**
   * Filtra produtos que podem ser usados
   */
  filterAvailableProducts(products: Array<{ id: string; categoryId: string }>): Array<{ id: string; categoryId: string }> {
    return products.filter(product => 
      this.canUseProduct(product.id) && 
      this.canUseCategory(product.categoryId)
    );
  }
}
