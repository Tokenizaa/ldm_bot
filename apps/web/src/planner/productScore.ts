export interface Product {
  id: string;
  title: string;
  price: number;
  old_price: number;
  image: string;
  affiliate_url: string;
  category: string;
  brand: string;
  description?: string;
  technical_specs?: string;
}

export interface ScoredProduct extends Product {
  score: number;
  scoreReasons: string[];
}

export class ProductScorer {
  /**
   * Calcula score simples para produto
   * Sem IA, apenas heurísticas diretas
   */
  calculateScore(product: Product, recentCategories: string[], recentBrands: string[]): ScoredProduct {
    const reasons: string[] = [];
    let score = 0;

    // 1. Desconto (0-30 pontos)
    const discountPercentage = this.calculateDiscount(product);
    if (discountPercentage > 0) {
      score += Math.min(discountPercentage * 3, 30);
      reasons.push(`Desconto de ${discountPercentage}%`);
    }

    // 2. Diversidade de categoria (0-25 pontos)
    if (!recentCategories.includes(product.category)) {
      score += 25;
      reasons.push('Categoria nova');
    } else {
      // Penalidade se categoria muito repetida
      const categoryCount = recentCategories.filter(cat => cat === product.category).length;
      if (categoryCount >= 3) {
        score -= 10;
        reasons.push('Categoria repetida');
      }
    }

    // 3. Diversidade de marca (0-20 pontos)
    if (!recentBrands.includes(product.brand)) {
      score += 20;
      reasons.push('Marca nova');
    } else {
      const brandCount = recentBrands.filter(brand => brand === product.brand).length;
      if (brandCount >= 2) {
        score -= 5;
        reasons.push('Marca repetida');
      }
    }

    // 4. Preço acessível (0-15 pontos)
    if (product.price < 500) {
      score += 15;
      reasons.push('Preço acessível');
    } else if (product.price < 1000) {
      score += 8;
      reasons.push('Preço razoável');
    }

    // 5. Qualidade do título (0-10 pontos)
    if (product.title.length > 20 && product.title.length < 80) {
      score += 10;
      reasons.push('Título adequado');
    } else if (product.title.length >= 80) {
      score -= 5;
      reasons.push('Título muito longo');
    }

    // 6. Tem descrição (0-5 pontos)
    if (product.description && product.description.length > 50) {
      score += 5;
      reasons.push('Com descrição');
    }

    // 7. Tem especificações (0-5 pontos)
    if (product.technical_specs && product.technical_specs.length > 30) {
      score += 5;
      reasons.push('Com ficha técnica');
    }

    return {
      ...product,
      score: Math.max(0, score), // Não permitir score negativo
      scoreReasons: reasons
    };
  }

  /**
   * Calcula percentual de desconto
   */
  private calculateDiscount(product: Product): number {
    if (!product.old_price || product.old_price <= 0) return 0;
    
    const discount = ((product.old_price - product.price) / product.old_price) * 100;
    return Math.round(discount);
  }

  /**
   * Ordena produtos por score (maior primeiro)
   */
  sortByScore(products: ScoredProduct[]): ScoredProduct[] {
    return products.sort((a, b) => b.score - a.score);
  }

  /**
   * Filtra produtos com score mínimo
   */
  filterByMinScore(products: ScoredProduct[], minScore: number = 30): ScoredProduct[] {
    return products.filter(product => product.score >= minScore);
  }

  /**
   * Seleciona melhor produto
   */
  selectBestProduct(products: Product[], recentCategories: string[], recentBrands: string[]): ScoredProduct | null {
    if (products.length === 0) return null;

    // Calcular scores
    const scoredProducts = products.map(product => 
      this.calculateScore(product, recentCategories, recentBrands)
    );

    // Ordenar e retornar melhor
    const sorted = this.sortByScore(scoredProducts);
    return sorted[0];
  }

  /**
   * Retorna top N produtos
   */
  getTopProducts(products: Product[], recentCategories: string[], recentBrands: string[], topN: number = 5): ScoredProduct[] {
    const scoredProducts = products.map(product => 
      this.calculateScore(product, recentCategories, recentBrands)
    );

    const sorted = this.sortByScore(scoredProducts);
    return sorted.slice(0, topN);
  }

  /**
   * Análise simples dos scores
   */
  analyzeScores(products: ScoredProduct[]): {
    average: number;
    highest: ScoredProduct;
    lowest: ScoredProduct;
    distribution: Record<string, number>;
  } {
    if (products.length === 0) {
      throw new Error('Nenhum produto para analisar');
    }

    const totalScore = products.reduce((sum, p) => sum + p.score, 0);
    const average = totalScore / products.length;

    const highest = products.reduce((max, p) => p.score > max.score ? p : max);
    const lowest = products.reduce((min, p) => p.score < min.score ? p : min);

    // Distribuição por faixa de score
    const distribution: Record<string, number> = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    products.forEach(product => {
      if (product.score <= 20) distribution['0-20']++;
      else if (product.score <= 40) distribution['21-40']++;
      else if (product.score <= 60) distribution['41-60']++;
      else if (product.score <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    return {
      average: Math.round(average * 100) / 100,
      highest,
      lowest,
      distribution
    };
  }
}
