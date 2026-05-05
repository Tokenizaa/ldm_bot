import { OllamaService } from '../social-ai/ollama/ollama.service';
import { Product } from '../../types';

export interface PromotionContent {
  id: string;
  type: 'standard' | 'premium' | 'flash' | 'bundle';
  product_id: string;
  product: Product;
  title: string;
  content: string;
  hashtags: string[];
  cta: string;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  discount_percentage: number;
  original_price: number;
  current_price: number;
  savings_amount: number;
  engagement_prediction: number;
  ctr_prediction: number;
  conversion_prediction: number;
  spam_score: number;
  persona: string;
  target_groups: string[];
  media_type: 'image' | 'video' | 'carousel';
  media_url?: string;
  created_at: string;
}

export interface PromotionCriteria {
  min_discount: number;
  max_discount: number;
  min_ai_score: number;
  preferred_brands: string[];
  excluded_categories: string[];
  price_range: {
    min: number;
    max: number;
  };
  stock_availability: boolean;
  affiliate_commission_min: number;
}

export interface PromotionStrategy {
  type: 'conservative' | 'balanced' | 'aggressive';
  focus: 'discount' | 'quality' | 'brand' | 'variety';
  urgency_tactics: boolean;
  comparison_allowed: boolean;
  max_price_mention: boolean;
}

export class PromotionEngine {
  private ollamaService: OllamaService;
  private promotionHistory: PromotionContent[];
  private performanceMetrics: Map<string, any>;
  private selectionCriteria: PromotionCriteria;
  private currentStrategy: PromotionStrategy;

  constructor() {
    this.ollamaService = new OllamaService();
    this.promotionHistory = [];
    this.performanceMetrics = new Map();
    this.selectionCriteria = this.initializeCriteria();
    this.currentStrategy = this.initializeStrategy();
  }

  /**
   * Inicializa critérios de seleção
   */
  private initializeCriteria(): PromotionCriteria {
    return {
      min_discount: 10,
      max_discount: 80,
      min_ai_score: 60,
      preferred_brands: ['Bosch', 'Ferramentas', 'Tramontina', 'Vonder'],
      excluded_categories: ['peças', 'serviços'],
      price_range: {
        min: 50,
        max: 2000
      },
      stock_availability: true,
      affiliate_commission_min: 5
    };
  }

  /**
   * Inicializa estratégia padrão
   */
  private initializeStrategy(): PromotionStrategy {
    return {
      type: 'balanced',
      focus: 'discount',
      urgency_tactics: true,
      comparison_allowed: true,
      max_price_mention: true
    };
  }

  /**
   * Seleciona produtos ideais para promoção
   */
  async selectOptimalProducts(
    availableProducts: Product[],
    promotionType: 'standard' | 'premium' | 'flash' | 'bundle',
    quantity: number = 2
  ): Promise<Product[]> {
    // 1. Filtrar produtos baseado nos critérios
    const filteredProducts = this.filterProductsByCriteria(availableProducts, promotionType);

    // 2. Rankear produtos baseado em múltiplos fatores
    const rankedProducts = await this.rankProducts(filteredProducts, promotionType);

    // 3. Aplicar diversificação
    const diversifiedProducts = this.applyDiversification(rankedProducts, quantity);

    return diversifiedProducts.slice(0, quantity);
  }

  /**
   * Filtra produtos baseado nos critérios
   */
  private filterProductsByCriteria(
    products: Product[],
    promotionType: string
  ): Product[] {
    let filtered = [...products];

    // Aplicar filtros básicos
    filtered = filtered.filter(product => {
      // Desconto mínimo
      if (product.discount < this.selectionCriteria.min_discount) return false;
      
      // Score IA mínimo
      if (product.ai_score && product.ai_score < this.selectionCriteria.min_ai_score) return false;
      
      // Faixa de preço
      if (product.price < this.selectionCriteria.price_range.min || 
          product.price > this.selectionCriteria.price_range.max) return false;
      
      // Categorias excluídas
      if (this.selectionCriteria.excluded_categories.includes(product.category.toLowerCase())) return false;
      
      return true;
    });

    // Aplicar filtros específicos por tipo
    switch (promotionType) {
      case 'premium':
        // Produtos premium precisam de maior desconto e score
        filtered = filtered.filter(p => 
          p.discount >= 25 && 
          (p.ai_score || 0) >= 75 &&
          this.selectionCriteria.preferred_brands.includes(p.brand)
        );
        break;
        
      case 'flash':
        // Flash promoções precisam de desconto muito alto
        filtered = filtered.filter(p => p.discount >= 40);
        break;
        
      case 'bundle':
        // Bundles precisam de preço intermediário
        filtered = filtered.filter(p => 
          p.price >= 100 && p.price <= 800
        );
        break;
    }

    return filtered;
  }

  /**
   * Rankeia produtos baseado em múltiplos fatores
   */
  private async rankProducts(
    products: Product[],
    promotionType: string
  ): Promise<Array<{ product: Product; score: number; reasoning: string }>> {
    const rankedProducts = [];

    for (const product of products) {
      const score = await this.calculateProductScore(product, promotionType);
      rankedProducts.push(score);
    }

    return rankedProducts.sort((a, b) => b.score - a.score);
  }

  /**
   * Calcula score do produto
   */
  private async calculateProductScore(
    product: Product,
    promotionType: string
  ): Promise<{ product: Product; score: number; reasoning: string }> {
    let score = 0;
    const factors = [];

    // Fator 1: Desconto (30%)
    const discountScore = Math.min(product.discount / 50, 1) * 30;
    score += discountScore;
    factors.push(`Desconto: ${discountScore.toFixed(1)}`);

    // Fator 2: Score IA (25%)
    const aiScore = ((product.ai_score || 60) / 100) * 25;
    score += aiScore;
    factors.push(`IA Score: ${aiScore.toFixed(1)}`);

    // Fator 3: Preço (20%)
    const priceScore = this.calculatePriceScore(product.price, promotionType) * 20;
    score += priceScore;
    factors.push(`Preço: ${priceScore.toFixed(1)}`);

    // Fator 4: Marca (15%)
    const brandScore = this.calculateBrandScore(product.brand) * 15;
    score += brandScore;
    factors.push(`Marca: ${brandScore.toFixed(1)}`);

    // Fator 5: Categoria (10%)
    const categoryScore = this.calculateCategoryScore(product.category) * 10;
    score += categoryScore;
    factors.push(`Categoria: ${categoryScore.toFixed(1)}`);

    // Análise adicional com IA
    const aiAnalysis = await this.analyzeProductWithAI(product, promotionType);
    score += aiAnalysis.bonus;
    factors.push(`IA Analysis: ${aiAnalysis.bonus.toFixed(1)}`);

    const reasoning = factors.join(', ');

    return { product, score, reasoning };
  }

  /**
   * Calcula score baseado no preço
   */
  private calculatePriceScore(price: number, promotionType: string): number {
    const priceRanges = {
      standard: { min: 50, max: 500, optimal: 200 },
      premium: { min: 200, max: 1500, optimal: 600 },
      flash: { min: 100, max: 800, optimal: 300 },
      bundle: { min: 150, max: 1000, optimal: 400 }
    };

    const range = priceRanges[promotionType];
    if (!range) return 0.5;

    // Score mais alto próximo do preço ótimo
    const distance = Math.abs(price - range.optimal);
    const maxDistance = Math.max(range.optimal - range.min, range.max - range.optimal);
    
    return Math.max(0, 1 - (distance / maxDistance));
  }

  /**
   * Calcula score da marca
   */
  private calculateBrandScore(brand: string): number {
    const brandScores: Record<string, number> = {
      'Bosch': 1.0,
      'Ferramentas': 0.9,
      'Tramontina': 0.85,
      'Vonder': 0.8,
      'Stanley': 0.85,
      'DeWalt': 0.9,
      'Makita': 0.85
    };

    return brandScores[brand] || 0.6;
  }

  /**
   * Calcula score da categoria
   */
  private calculateCategoryScore(category: string): number {
    const categoryScores: Record<string, number> = {
      'ferramentas elétricas': 1.0,
      'ferramentas manuais': 0.9,
      'organização': 0.8,
      'segurança': 0.85,
      'medição': 0.75,
      'acessórios': 0.7
    };

    return categoryScores[category.toLowerCase()] || 0.6;
  }

  /**
   * Análise do produto com IA
   */
  private async analyzeProductWithAI(
    product: Product,
    promotionType: string
  ): Promise<{ bonus: number; insights: string[] }> {
    const prompt =`
Analise este produto para promoção do tipo ${promotionType}:

PRODUTO: ${product.title}
PREÇO: R$${product.price}
DESCONTO: ${product.discount}%
MARCA: ${product.brand}
CATEGORIA: ${product.category}
SCORE IA: ${product.ai_score}

Retorne JSON com análise:
{
  "market_appeal": 0-100,
  "urgency_potential": 0-100,
  "conversion_probability": 0-100,
  "spam_risk": 0-100,
  "insights": ["insight1", "insight2"],
  "recommended_cta": "CTA sugerido",
  "bonus_score": 0-20
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      const result = JSON.parse(response);
      
      return {
        bonus: result.bonus_score || 0,
        insights: result.insights || []
      };
    } catch (error) {
      console.error('Error analyzing product with AI:', error);
      return {
        bonus: 0,
        insights: []
      };
    }
  }

  /**
   * Aplica diversificação de produtos
   */
  private applyDiversification(
    rankedProducts: Array<{ product: Product; score: number; reasoning: string }>,
    quantity: number
  ): Product[] {
    const diversified: Product[] = [];
    const usedCategories = new Set<string>();
    const usedBrands = new Set<string>();

    for (const item of rankedProducts) {
      if (diversified.length >= quantity) break;

      const product = item.product;
      
      // Evitar repetição de categoria (máximo 2 por categoria)
      const categoryCount = diversified.filter(p => p.category === product.category).length;
      if (categoryCount >= 2) continue;

      // Evitar repetição de marca (máximo 1 por marca em promoções standard)
      if (quantity <= 2 && usedBrands.has(product.brand)) continue;

      diversified.push(product);
      usedCategories.add(product.category);
      usedBrands.add(product.brand);
    }

    return diversified;
  }

  /**
   * Gera conteúdo de promoção
   */
  async generatePromotionContent(
    product: Product,
    promotionType: 'standard' | 'premium' | 'flash' | 'bundle',
    context: {
      time_of_day: string;
      target_audience: string;
      strategy?: PromotionStrategy;
      recent_ctas?: string[];
    }
  ): Promise<PromotionContent> {
    const strategy = context.strategy || this.currentStrategy;

    // 1. Gerar copy principal
    const copy = await this.generatePromotionCopy(product, promotionType, strategy, context);

    // 2. Gerar CTA
    const cta = await this.generateCTA(product, promotionType, strategy, context.recent_ctas);

    // 3. Gerar hashtags
    const hashtags = await this.generateHashtags(product, promotionType, strategy);

    // 4. Calcular métricas
    const metrics = await this.calculatePromotionMetrics(copy, product, promotionType);

    // 5. Determinar persona
    const persona = this.selectPersonaForPromotion(product, promotionType, strategy);

    // 6. Selecionar grupos alvo
    const targetGroups = this.selectTargetGroups(promotionType, product.category);

    const promotionContent: PromotionContent = {
      id: `promotion_${Date.now()}_${product.id}`,
      type: promotionType,
      product_id: product.id,
      product,
      title: this.extractTitle(copy),
      content: copy,
      hashtags,
      cta,
      urgency_level: this.calculateUrgencyLevel(promotionType, product.discount),
      discount_percentage: product.discount,
      original_price: product.old_price || product.price,
      current_price: product.price,
      savings_amount: (product.old_price || product.price) - product.price,
      engagement_prediction: metrics.engagement_prediction,
      ctr_prediction: metrics.ctr_prediction,
      conversion_prediction: metrics.conversion_prediction,
      spam_score: metrics.spam_score,
      persona,
      target_groups,
      media_type: this.selectMediaType(promotionType, product),
      media_url: product.image,
      created_at: new Date().toISOString()
    };

    // Salvar no histórico
    this.promotionHistory.push(promotionContent);
    this.updatePerformanceMetrics(promotionContent);

    return promotionContent;
  }

  /**
   * Gera copy de promoção
   */
  private async generatePromotionCopy(
    product: Product,
    promotionType: string,
    strategy: PromotionStrategy,
    context: any
  ): Promise<string> {
    const urgencyTactics = strategy.urgency_tactics ? 'com urgência' : 'sem urgência';
    const comparisonAllowed = strategy.comparison_allowed ? 'comparação permitida' : 'sem comparação';
    const maxPriceMention = strategy.max_price_mention ? 'mencionar preço' : 'foco no desconto';

    const prompt =`
Gere copy de promoção para Facebook Groups:

TIPO: ${promotionType}
PRODUTO: ${product.title}
PREÇO: R$${product.price}
PREÇO ORIGINAL: R$${product.old_price || product.price}
DESCONTO: ${product.discount}%
MARCA: ${product.brand}
CATEGORIA: ${product.category}

ESTRATÉGIA:
- Foco: ${strategy.focus}
- Urgência: ${urgencyTactics}
- Comparação: ${comparisonAllowed}
- Preço: ${maxPriceMention}

PÚBLICO: ${context.target_audience}
HORÁRIO: ${context.time_of_day}

REGRAS:
- Máximo 280 caracteres
- Tom adequado para ${promotionType}
- Incluir CTA natural
- 2-3 hashtags relevantes
- Evitar linguagem de spam

Retorne apenas a copy, sem JSON:
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return response.trim().substring(0, 280);
    } catch (error) {
      console.error('Error generating promotion copy:', error);
      return this.generateFallbackCopy(product, promotionType);
    }
  }

  /**
   * Gera CTA
   */
  private async generateCTA(
    product: Product,
    promotionType: string,
    strategy: PromotionStrategy,
    recentCTAs?: string[]
  ): Promise<string> {
    const baseCTAs = {
      standard: ['confira agora', 'veja mais', 'saiba mais'],
      premium: ['acessar agora', 'garantir seu', 'não perca'],
      flash: ['corre lá', 'últimas unidades', 'aproveite já'],
      bundle: ['comprar kit', 'economizar agora', 'super oferta']
    };

    const availableCTAs = baseCTAs[promotionType as keyof typeof baseCTAs];
    
    // Evitar repetição de CTAs recentes
    if (recentCTAs) {
      const filteredCTAs = availableCTAs.filter(cta => 
        !recentCTAs.some(recent => recent.toLowerCase().includes(cta.toLowerCase()))
      );
      
      if (filteredCTAs.length > 0) {
        return filteredCTAs[Math.floor(Math.random() * filteredCTAs.length)];
      }
    }

    return availableCTAs[Math.floor(Math.random() * availableCTAs.length)];
  }

  /**
   * Gera hashtags
   */
  private async generateHashtags(
    product: Product,
    promotionType: string,
    strategy: PromotionStrategy
  ): Promise<string[]> {
    const baseHashtags = [
      `#${product.brand.replace(/\s+/g, '')}`,
      `#${product.category.replace(/\s+/g, '')}`,
      '#Promoção',
      '#Desconto',
      '#ForgeDeals'
    ];

    // Adicionar hashtags específicas por tipo
    const typeHashtags = {
      standard: ['#Oferta', '#Oportunidade'],
      premium: ['#Premium', '#Qualidade'],
      flash: ['#Flash', '#Urgente'],
      bundle: ['#Kit', '#Economia']
    };

    baseHashtags.push(...(typeHashtags[promotionType as keyof typeof typeHashtags] || []));

    // Limitar a 5 hashtags
    return baseHashtags.slice(0, 5);
  }

  /**
   * Calcula métricas da promoção
   */
  private async calculatePromotionMetrics(
    copy: string,
    product: Product,
    promotionType: string
  ): Promise<{
    engagement_prediction: number;
    ctr_prediction: number;
    conversion_prediction: number;
    spam_score: number;
  }> {
    const prompt =`
Analise esta copy de promoção:

COPY: "${copy}"
PRODUTO: ${product.title}
DESCONTO: ${product.discount}%
TIPO: ${promotionType}

Retorne JSON com métricas:
{
  "engagement_prediction": 0-100,
  "ctr_prediction": 0-100,
  "conversion_prediction": 0-100,
  "spam_score": 0-100,
  "optimization_suggestions": ["sugestão1", "sugestão2"]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      const result = JSON.parse(response);
      
      return {
        engagement_prediction: result.engagement_prediction,
        ctr_prediction: result.ctr_prediction,
        conversion_prediction: result.conversion_prediction,
        spam_score: result.spam_score
      };
    } catch (error) {
      console.error('Error calculating promotion metrics:', error);
      return {
        engagement_prediction: 70,
        ctr_prediction: 5,
        conversion_prediction: 3,
        spam_score: 20
      };
    }
  }

  /**
   * Seleciona persona para promoção
   */
  private selectPersonaForPromotion(
    product: Product,
    promotionType: string,
    strategy: PromotionStrategy
  ): string {
    const personaMapping = {
      standard: 'cacador_promocoes',
      premium: 'especialista_bosch',
      flash: 'mecanico_raiz',
      bundle: 'review_honesto'
    };

    // Ajustar baseado na estratégia
    if (strategy.focus === 'quality') {
      return 'tecnico_profissional';
    } else if (strategy.focus === 'brand') {
      return 'especialista_bosch';
    }

    return personaMapping[promotionType as keyof typeof personaMapping] || 'cacador_promocoes';
  }

  /**
   * Seleciona grupos alvo
   */
  private selectTargetGroups(promotionType: string, category: string): string[] {
    const groupMappings = {
      standard: ['Promoções Ferramentas', 'Oportunidades', 'Compras Inteligentes'],
      premium: ['Clientes Premium', 'Compradores Ouro', 'Qualidade Premium'],
      flash: ['Promoções Relâmpago', 'Urgentes', 'Ofertas Limitadas'],
      bundle: ['Kits Econômicos', 'Compras em Volume', 'Super Ofertas']
    };

    const baseGroups = groupMappings[promotionType as keyof typeof groupMappings] || [];
    
    // Adicionar grupos específicos da categoria
    const categoryGroups = {
      'ferramentas elétricas': ['Profissionais Elétricas', 'Ferramentas Potência'],
      'ferramentas manuais': ['Ferramentas Manuais', 'Kit Básico'],
      'organização': ['Organização Oficina', 'Armazenamento'],
      'segurança': ['Segurança Trabalho', 'EPIs']
    };

    const specificGroups = categoryGroups[category.toLowerCase() as keyof typeof categoryGroups] || [];
    
    return [...baseGroups, ...specificGroups].slice(0, 3);
  }

  /**
   * Seleciona tipo de mídia
   */
  private selectMediaType(promotionType: string, product: Product): 'image' | 'video' | 'carousel' {
    // Promoções premium usam vídeo
    if (promotionType === 'premium') return 'video';
    
    // Bundles usam carousel
    if (promotionType === 'bundle') return 'carousel';
    
    // Flash usa image com destaque
    if (promotionType === 'flash') return 'image';
    
    // Standard usa image
    return 'image';
  }

  /**
   * Calcula nível de urgência
   */
  private calculateUrgencyLevel(promotionType: string, discount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (promotionType === 'flash' || discount >= 50) return 'critical';
    if (promotionType === 'premium' || discount >= 30) return 'high';
    if (discount >= 20) return 'medium';
    return 'low';
  }

  /**
   * Extrai título da copy
   */
  private extractTitle(copy: string): string {
    const lines = copy.split('\n');
    const firstLine = lines[0].trim();
    
    // Remover emojis e caracteres especiais
    const cleanTitle = firstLine.replace(/[^\w\s]/g, '').trim();
    
    return cleanTitle.length > 50 ? cleanTitle.substring(0, 50) + '...' : cleanTitle;
  }

  /**
   * Gera copy fallback
   */
  private generateFallbackCopy(product: Product, promotionType: string): string {
    const fallbacks = {
      standard: `🔥 OFERTA! ${product.title} por apenas R$${product.price}! Desconto de ${product.discount}%! Aproveite! 🎯`,
      premium: `⚡ PREMIUM! ${product.title} com super desconto! Qualidade ${product.brand}! Confira! 🏆`,
      flash: `🚀 FLASH! ${product.title} com ${product.discount}% OFF! Últimas unidades! Corre! 🏃‍♂️`,
      bundle: `💎 KIT ECONÔMICO! ${product.title} em promoção! Economia garantida! Adquira já! 🛒`
    };

    return fallbacks[promotionType as keyof typeof fallbacks] || fallbacks.standard;
  }

  /**
   * Atualiza métricas de performance
   */
  private updatePerformanceMetrics(promotion: PromotionContent): void {
    const key = `${promotion.type}_${promotion.persona}`;
    const current = this.performanceMetrics.get(key) || {
      count: 0,
      total_engagement: 0,
      total_ctr: 0,
      total_conversions: 0,
      avg_spam_score: 0
    };

    current.count++;
    current.total_engagement += promotion.engagement_prediction;
    current.total_ctr += promotion.ctr_prediction;
    current.total_conversions += promotion.conversion_prediction;
    current.avg_spam_score = (current.avg_spam_score + promotion.spam_score) / 2;

    this.performanceMetrics.set(key, current);
  }

  /**
   * Obtém melhores produtos por categoria
   */
  async getBestProductsByCategory(
    products: Product[],
    category: string,
    limit: number = 5
  ): Promise<Product[]> {
    const categoryProducts = products.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );

    const ranked = await this.rankProducts(categoryProducts, 'standard');
    
    return ranked.slice(0, limit).map(item => item.product);
  }

  /**
   * Obtém estatísticas de promoções
   */
  getPromotionStats(): {
    total_promotions: number;
    avg_engagement: number;
    avg_ctr: number;
    best_type: string;
    best_persona: string;
    conversion_rate: number;
    type_distribution: Record<string, number>;
  } {
    const total = this.promotionHistory.length;
    
    if (total === 0) {
      return {
        total_promotions: 0,
        avg_engagement: 0,
        avg_ctr: 0,
        best_type: 'standard',
        best_persona: 'cacador_promocoes',
        conversion_rate: 0,
        type_distribution: {}
      };
    }

    const avgEngagement = this.promotionHistory.reduce((sum, p) => sum + p.engagement_prediction, 0) / total;
    const avgCTR = this.promotionHistory.reduce((sum, p) => sum + p.ctr_prediction, 0) / total;
    const conversionRate = this.promotionHistory.reduce((sum, p) => sum + p.conversion_prediction, 0) / total;

    // Melhor tipo
    const typeStats = this.promotionHistory.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const bestType = Object.entries(typeStats)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'standard';

    // Melhor persona
    const personaStats = this.promotionHistory.reduce((acc, p) => {
      acc[p.persona] = (acc[p.persona] || 0) + p.ctr_prediction;
      return acc;
    }, {} as Record<string, number>);
    
    const bestPersona = Object.entries(personaStats)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'cacador_promocoes';

    return {
      total_promotions: total,
      avg_engagement: Math.round(avgEngagement),
      avg_ctr: Math.round(avgCTR * 10) / 10,
      best_type: bestType,
      best_persona: bestPersona,
      conversion_rate: Math.round(conversionRate * 10) / 10,
      type_distribution: typeStats
    };
  }

  /**
   * Atualiza estratégia baseada em performance
   */
  async updateStrategyBasedOnPerformance(): Promise<PromotionStrategy> {
    const stats = this.getPromotionStats();
    
    // Se CTR baixo, focar mais em desconto
    if (stats.avg_ctr < 3) {
      this.currentStrategy.focus = 'discount';
      this.currentStrategy.urgency_tactics = true;
    }
    
    // Se spam score alto, ser mais conservador
    const avgSpamScore = this.promotionHistory.reduce((sum, p) => sum + p.spam_score, 0) / this.promotionHistory.length;
    if (avgSpamScore > 40) {
      this.currentStrategy.type = 'conservative';
      this.currentStrategy.urgency_tactics = false;
    }

    return this.currentStrategy;
  }

  /**
   * Exporta dados do engine
   */
  exportEngineData(): {
    criteria: PromotionCriteria;
    strategy: PromotionStrategy;
    promotionHistory: PromotionContent[];
    performanceMetrics: Map<string, any>;
  } {
    return {
      criteria: this.selectionCriteria,
      strategy: this.currentStrategy,
      promotionHistory: this.promotionHistory,
      performanceMetrics: this.performanceMetrics
    };
  }
}
