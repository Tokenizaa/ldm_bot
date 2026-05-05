import { OllamaService } from '../social-ai/ollama/ollama.service';
import { Product } from '../../types';

export interface DailyEditorialPlan {
  date: string;
  posts: DailyPost[];
  strategy: 'conservative' | 'balanced' | 'aggressive';
  overall_confidence: number;
  risk_assessment: {
    spam_score: number;
    saturation_score: number;
    compliance_score: number;
  };
  created_at: string;
}

export interface DailyPost {
  id: string;
  position: number; // 1-4 (ordem fixa)
  type: 'interaction' | 'promotion' | 'video_branding' | 'promotion_premium';
  time_window: {
    start_hour: number;
    end_hour: number;
    optimal_hour: number;
  };
  objective: string;
  persona: string;
  content: {
    text: string;
    hashtags: string[];
    cta: string;
    media_type: 'text' | 'image' | 'video';
    media_url?: string;
  };
  target_groups: string[];
  product_id?: string;
  spam_score: number;
  engagement_prediction: number;
  ctr_prediction: number;
  status: 'planned' | 'generating' | 'ready' | 'published' | 'failed';
  published_at?: string;
  metrics?: {
    reach: number;
    engagement: number;
    clicks: number;
    conversions: number;
  };
}

export interface EditorialPolicy {
  daily_posts: number;
  distribution: {
    interaction: number;
    promotion: number;
    video_branding: number;
    promotion_premium: number;
  };
  time_windows: {
    morning: { start: 8; end: 10 };
    midday: { start: 11; end: 13 };
    afternoon: { start: 16; end: 18 };
    evening: { start: 19; end: 21 };
  };
  objectives: {
    interaction: 'engajamento grupo';
    promotion: 'CTR/conversão';
    video_branding: 'branding/retenção/confiança';
    promotion_premium: 'conversão principal do dia';
  };
  meta_safe_rules: {
    max_similar_cta: 2;
    max_same_category: 2;
    max_same_persona: 2;
    min_content_variation: 0.7;
  };
}

export class DailyPlanner {
  private ollamaService: OllamaService;
  private editorialPolicy: EditorialPolicy;
  private recentPosts: DailyPost[];
  private performanceHistory: Map<string, any>;

  constructor() {
    this.ollamaService = new OllamaService();
    this.editorialPolicy = this.initializeEditorialPolicy();
    this.recentPosts = [];
    this.performanceHistory = new Map();
  }

  /**
   * Inicializa política editorial oficial
   */
  private initializeEditorialPolicy(): EditorialPolicy {
    return {
      daily_posts: 4,
      distribution: {
        interaction: 1,
        promotion: 1,
        video_branding: 1,
        promotion_premium: 1
      },
      time_windows: {
        morning: { start: 8, end: 10 },
        midday: { start: 11, end: 13 },
        afternoon: { start: 16, end: 18 },
        evening: { start: 19, end: 21 }
      },
      objectives: {
        interaction: 'engajamento grupo',
        promotion: 'CTR/conversão',
        video_branding: 'branding/retenção/confiança',
        promotion_premium: 'conversão principal do dia'
      },
      meta_safe_rules: {
        max_similar_cta: 2,
        max_same_category: 2,
        max_same_persona: 2,
        min_content_variation: 0.7
      }
    };
  }

  /**
   * Gera plano editorial diário completo
   */
  async generateDailyPlan(
    date: string,
    availableProducts: Product[],
    systemPerformance: any
  ): Promise<DailyEditorialPlan> {
    // 1. Analisar contexto e disponibilidade
    const contextAnalysis = await this.analyzeDailyContext(
      date,
      availableProducts,
      systemPerformance
    );

    // 2. Determinar estratégia do dia
    const strategy = await this.determineDailyStrategy(contextAnalysis);

    // 3. Gerar posts para cada posição fixa
    const posts = await this.generateFixedPosts(date, availableProducts, strategy);

    // 4. Validar compliance Meta Safe
    const validatedPosts = await this.validateMetaSafeCompliance(posts);

    // 5. Calcular métricas de risco
    const riskAssessment = await this.calculateRiskAssessment(validatedPosts);

    // 6. Calcular confiança geral
    const overallConfidence = this.calculateOverallConfidence(
      validatedPosts,
      riskAssessment,
      contextAnalysis
    );

    const plan: DailyEditorialPlan = {
      date,
      posts: validatedPosts,
      strategy,
      overall_confidence: overallConfidence,
      risk_assessment: riskAssessment,
      created_at: new Date().toISOString()
    };

    // Salvar no histórico
    this.performanceHistory.set(date, plan);

    return plan;
  }

  /**
   * Analisa contexto diário
   */
  private async analyzeDailyContext(
    date: string,
    products: Product[],
    performance: any
  ): Promise<any> {
    const dayOfWeek = new Date(date).getDay();
    const recentPerformance = this.getRecentPerformance();

    const prompt =`
Analise o contexto editorial para o dia ${date}:

DATA: ${date}
DIA DA SEMANA: ${dayOfWeek}
PRODUTOS DISPONÍVEIS: ${products?.length || 0}
PERFORMANCE RECENTE: ${JSON.stringify(recentPerformance)}

CONSIDERE:
- Dia da semana (fim de semana vs dia útil)
- Disponibilidade de produtos
- Performance recente (CTR, engajamento, spam)
- Sazonalidade e tendências

Retorne JSON com análise:
{
  "market_opportunities": ["oportunidade1", "oportunidade2"],
  "risk_factors": ["risco1", "risco2"],
  "audience_state": "engajado|normal|fatigado",
  "recommended_strategy": "conservative|balanced|aggressive",
  "product_priorities": ["categoria1", "categoria2"],
  "timing_optimization": {
    "morning_efficiency": 0-100,
    "midday_efficiency": 0-100,
    "afternoon_efficiency": 0-100,
    "evening_efficiency": 0-100
  },
  "content_focus": ["foco1", "foco2"],
  "confidence_score": 0-100
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing daily context:', error);
      return this.createFallbackContextAnalysis();
    }
  }

  /**
   * Determina estratégia diária
   */
  private async determineDailyStrategy(contextAnalysis: any): Promise<'conservative' | 'balanced' | 'aggressive'> {
    // Se a IA já recomendou, usar
    if (contextAnalysis.recommended_strategy) {
      return contextAnalysis.recommended_strategy;
    }

    // Lógica de decisão baseada em fatores
    let strategy: 'conservative' | 'balanced' | 'aggressive' = 'balanced';

    // Se audiência fatigada, ser conservador
    if (contextAnalysis.audience_state === 'fatigado') {
      strategy = 'conservative';
    }
    // Se muitas oportunidades, ser agressivo
    else if (contextAnalysis.market_opportunities?.length > 3) {
      strategy = 'aggressive';
    }
    // Se performance ruim, ser conservador
    else if (contextAnalysis.risk_factors?.length > 2) {
      strategy = 'conservative';
    }

    return strategy;
  }

  /**
   * Gera posts para as 4 posições fixas
   */
  private async generateFixedPosts(
    date: string,
    products: Product[],
    strategy: string
  ): Promise<DailyPost[]> {
    const posts: DailyPost[] = [];

    // POST 1: Interação (08h-10h)
    const interactionPost = await this.generateInteractionPost(
      1,
      this.editorialPolicy.time_windows.morning,
      this.editorialPolicy.objectives.interaction,
      products,
      strategy
    );
    posts.push(interactionPost);

    // POST 2: Promoção (11h-13h)
    const promotionPost = await this.generatePromotionPost(
      2,
      this.editorialPolicy.time_windows.midday,
      this.editorialPolicy.objectives.promotion,
      products,
      strategy
    );
    posts.push(promotionPost);

    // POST 3: Vídeo Branding (16h-18h)
    const videoPost = await this.generateVideoBrandingPost(
      3,
      this.editorialPolicy.time_windows.afternoon,
      this.editorialPolicy.objectives.video_branding,
      products,
      strategy
    );
    posts.push(videoPost);

    // POST 4: Promoção Premium (19h-21h)
    const premiumPost = await this.generatePromotionPremiumPost(
      4,
      this.editorialPolicy.time_windows.evening,
      this.editorialPolicy.objectives.promotion_premium,
      products,
      strategy
    );
    posts.push(premiumPost);

    return posts;
  }

  /**
   * Gera post de interação/enquete
   */
  private async generateInteractionPost(
    position: number,
    timeWindow: { start: number; end: number },
    objective: string,
    products: Product[],
    strategy: string
  ): Promise<DailyPost> {
    const prompt =`
Gere um post de interação/enquete para Facebook Groups:

OBJETIVO: ${objective}
HORÁRIO: ${timeWindow.start}h-${timeWindow.end}h
ESTRATÉGIA: ${strategy}

REGRAS:
- Máximo 280 caracteres
- Deve gerar comentários naturais
- Pode ser enquete, pergunta ou evento
- Tom conversacional e engajador
- Incluir 2-3 hashtags relevantes
- Sem links afiliados (foco em engajamento)

Retorne JSON:
{
  "text": "texto do post",
  "hashtags": ["#tag1", "#tag2"],
  "cta": "tipo de CTA",
  "engagement_prediction": 0-100,
  "spam_score": 0-100,
  "persona": "persona_escolhida"
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      const result = JSON.parse(response);

      return {
        id: `post_${Date.now()}_interaction`,
        position,
        type: 'interaction',
        time_window: {
          ...timeWindow,
          optimal_hour: this.selectOptimalHour(timeWindow, 'interaction')
        },
        objective,
        persona: result.persona || 'mecanico_raiz',
        content: {
          text: result.text,
          hashtags: result.hashtags,
          cta: result.cta,
          media_type: 'text'
        },
        target_groups: this.selectTargetGroups('interaction'),
        spam_score: result.spam_score,
        engagement_prediction: result.engagement_prediction,
        ctr_prediction: 0, // Posts de interação não focam em CTR
        status: 'planned'
      };
    } catch (error) {
      console.error('Error generating interaction post:', error);
      return this.createFallbackInteractionPost(position, timeWindow, objective);
    }
  }

  /**
   * Gera post de promoção padrão
   */
  private async generatePromotionPost(
    position: number,
    timeWindow: { start: number; end: number },
    objective: string,
    products: Product[],
    strategy: string
  ): Promise<DailyPost> {
    const selectedProduct = this.selectOptimalProduct(products, 'promotion');
    
    const prompt =`
Gere um post de promoção para Facebook Groups:

PRODUTO: ${selectedProduct?.title || 'Produto selecionado'}
PREÇO: R$${selectedProduct?.price || 0}
DESCONTO: ${selectedProduct?.discount || 0}%
MARCA: ${selectedProduct?.brand || 'Marca'}
LINK: ${selectedProduct?.affiliate_url || ''}

OBJETIVO: ${objective}
HORÁRIO: ${timeWindow.start}h-${timeWindow.end}h
ESTRATÉGIA: ${strategy}

REGRAS:
- Máximo 280 caracteres
- Focar em CTR e conversão
- Incluir link afiliado discretamente
- 2-3 hashtags
- CTA claro mas não agressivo

Retorne JSON:
{
  "text": "texto do post",
  "hashtags": ["#tag1", "#tag2"],
  "cta": "CTA usado",
  "engagement_prediction": 0-100,
  "spam_score": 0-100,
  "persona": "persona_escolhida"
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      const result = JSON.parse(response);

      return {
        id: `post_${Date.now()}_promotion`,
        position,
        type: 'promotion',
        time_window: {
          ...timeWindow,
          optimal_hour: this.selectOptimalHour(timeWindow, 'promotion')
        },
        objective,
        persona: result.persona || 'cacador_promocoes',
        content: {
          text: result.text,
          hashtags: result.hashtags,
          cta: result.cta,
          media_type: 'image',
          media_url: selectedProduct?.image
        },
        target_groups: this.selectTargetGroups('promotion'),
        product_id: selectedProduct?.id,
        spam_score: result.spam_score,
        engagement_prediction: result.engagement_prediction,
        ctr_prediction: Math.min(result.engagement_prediction * 0.8, 8),
        status: 'planned'
      };
    } catch (error) {
      console.error('Error generating promotion post:', error);
      return this.createFallbackPromotionPost(position, timeWindow, objective, selectedProduct);
    }
  }

  /**
   * Gera post de vídeo branding
   */
  private async generateVideoBrandingPost(
    position: number,
    timeWindow: { start: number; end: number },
    objective: string,
    products: Product[],
    strategy: string
  ): Promise<DailyPost> {
    const prompt =`
Gere um post de vídeo/branding institucional para Facebook Groups:

OBJETIVO: ${objective}
HORÁRIO: ${timeWindow.start}h-${timeWindow.end}h
ESTRATÉGIA: ${strategy}

CONTEÚDO:
- Foco em branding e confiança
- Pode ser sobre ForgeDeals ou dicas gerais
- Tom profissional mas acessível
- Sem promoções diretas
- Incluir chamada para seguir página

REGRAS:
- Máximo 280 caracteres
- 2-3 hashtags institucionais
- CTA focado em branding
- Indicar tipo de vídeo

Retorne JSON:
{
  "text": "texto do post",
  "hashtags": ["#tag1", "#tag2"],
  "cta": "CTA usado",
  "video_type": "dicas|institucional|tutorial",
  "engagement_prediction": 0-100,
  "spam_score": 0-100,
  "persona": "persona_escolhida"
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'mistral');
      const result = JSON.parse(response);

      return {
        id: `post_${Date.now()}_video`,
        position,
        type: 'video_branding',
        time_window: {
          ...timeWindow,
          optimal_hour: this.selectOptimalHour(timeWindow, 'video')
        },
        objective,
        persona: result.persona || 'tecnico_profissional',
        content: {
          text: result.text,
          hashtags: result.hashtags,
          cta: result.cta,
          media_type: 'video',
          media_url: this.generateBrandingVideoUrl(result.video_type)
        },
        target_groups: this.selectTargetGroups('branding'),
        spam_score: result.spam_score,
        engagement_prediction: result.engagement_prediction,
        ctr_prediction: 0, // Posts de branding não focam em CTR
        status: 'planned'
      };
    } catch (error) {
      console.error('Error generating video branding post:', error);
      return this.createFallbackVideoBrandingPost(position, timeWindow, objective);
    }
  }

  /**
   * Gera post de promoção premium
   */
  private async generatePromotionPremiumPost(
    position: number,
    timeWindow: { start: number; end: number },
    objective: string,
    products: Product[],
    strategy: string
  ): Promise<DailyPost> {
    const selectedProduct = this.selectOptimalProduct(products, 'premium');
    
    const prompt =`
Gere um post de promoção premium para Facebook Groups:

PRODUTO: ${selectedProduct?.title || 'Produto selecionado'}
PREÇO: R$${selectedProduct?.price || 0}
DESCONTO: ${selectedProduct?.discount || 0}%
MARCA: ${selectedProduct?.brand || 'Marca'}
LINK: ${selectedProduct?.affiliate_url || ''}

OBJETIVO: ${objective} (CONVERSÃO PRINCIPAL)
HORÁRIO: ${timeWindow.start}h-${timeWindow.end}h
ESTRATÉGIA: ${strategy}

REGRAS:
- Máximo 280 caracteres
- Foco máximo em conversão
- CTA forte e direto
- Destaque desconto吸引
- 2-3 hashtags de promoção

Retorne JSON:
{
  "text": "texto do post",
  "hashtags": ["#tag1", "#tag2"],
  "cta": "CTA usado",
  "urgency_level": "baixo|médio|alto",
  "engagement_prediction": 0-100,
  "spam_score": 0-100,
  "persona": "persona_escolhida"
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      const result = JSON.parse(response);

      return {
        id: `post_${Date.now()}_premium`,
        position,
        type: 'promotion_premium',
        time_window: {
          ...timeWindow,
          optimal_hour: this.selectOptimalHour(timeWindow, 'premium')
        },
        objective,
        persona: result.persona || 'especialista_bosch',
        content: {
          text: result.text,
          hashtags: result.hashtags,
          cta: result.cta,
          media_type: 'image',
          media_url: selectedProduct?.image
        },
        target_groups: this.selectTargetGroups('premium'),
        product_id: selectedProduct?.id,
        spam_score: result.spam_score,
        engagement_prediction: result.engagement_prediction,
        ctr_prediction: Math.min(result.engagement_prediction, 10),
        status: 'planned'
      };
    } catch (error) {
      console.error('Error generating premium promotion post:', error);
      return this.createFallbackPremiumPost(position, timeWindow, objective, selectedProduct);
    }
  }

  /**
   * Valida compliance Meta Safe
   */
  private async validateMetaSafeCompliance(posts: DailyPost[]): Promise<DailyPost[]> {
    const validatedPosts = [...posts];
    
    // Verificar regras Meta Safe
    const violations = this.checkMetaSafeViolations(posts);
    
    if (violations.length > 0) {
      // Aplicar correções automáticas
      for (const violation of violations) {
        const correctedPost = await this.applyMetaSafeCorrection(
          validatedPosts[violation.post_index],
          violation.violation_type
        );
        if (correctedPost) {
          validatedPosts[violation.post_index] = correctedPost;
        }
      }
    }

    return validatedPosts;
  }

  /**
   * Verifica violações Meta Safe
   */
  private checkMetaSafeViolations(posts: DailyPost[]): Array<{
    post_index: number;
    violation_type: string;
    description: string;
  }> {
    const violations = [];

    // Verificar CTA repetidos
    const ctaCounts = posts.reduce((acc, post) => {
      const cta = post.content.cta.toLowerCase();
      acc[cta] = (acc[cta] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(ctaCounts).forEach(([cta, count]) => {
      if (count > this.editorialPolicy.meta_safe_rules.max_similar_cta) {
        violations.push({
          post_index: posts.findIndex(p => p.content.cta.toLowerCase() === cta),
          violation_type: 'cta_repetition',
          description: `CTA "${cta}" repetido ${count} vezes`
        });
      }
    });

    // Verificar personas repetidas
    const personaCounts = posts.reduce((acc, post) => {
      acc[post.persona] = (acc[post.persona] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(personaCounts).forEach(([persona, count]) => {
      if (count > this.editorialPolicy.meta_safe_rules.max_same_persona) {
        violations.push({
          post_index: posts.findIndex(p => p.persona === persona),
          violation_type: 'persona_repetition',
          description: `Persona "${persona}" repetida ${count} vezes`
        });
      }
    });

    // Verificar categorias repetidas
    const categoryCounts = posts.reduce((acc, post) => {
      const category = this.getProductCategory(post.product_id);
      if (category) {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > this.editorialPolicy.meta_safe_rules.max_same_category) {
        violations.push({
          post_index: posts.findIndex(p => this.getProductCategory(p.product_id) === category),
          violation_type: 'category_repetition',
          description: `Categoria "${category}" repetida ${count} vezes`
        });
      }
    });

    return violations;
  }

  /**
   * Aplica correção Meta Safe
   */
  private async applyMetaSafeCorrection(
    post: DailyPost,
    violationType: string
  ): Promise<DailyPost | null> {
    switch (violationType) {
      case 'cta_repetition':
        return await this.correctCTARepetition(post);
      case 'persona_repetition':
        return await this.correctPersonaRepetition(post);
      case 'category_repetition':
        return await this.correctCategoryRepetition(post);
      default:
        return null;
    }
  }

  /**
   * Corrige repetição de CTA
   */
  private async correctCTARepetition(post: DailyPost): Promise<DailyPost> {
    const alternativeCTAs = ['confira agora', 'veja mais', 'saiba mais', 'clique aqui', 'acessar'];
    const currentCTA = post.content.cta.toLowerCase();
    
    const availableCTAs = alternativeCTAs.filter(cta => cta !== currentCTA);
    const newCTA = availableCTAs[Math.floor(Math.random() * availableCTAs.length)];

    return {
      ...post,
      content: {
        ...post.content,
        cta: newCTA,
        text: post.content.text.replace(new RegExp(currentCTA, 'gi'), newCTA)
      }
    };
  }

  /**
   * Corrige repetição de persona
   */
  private async correctPersonaRepetition(post: DailyPost): Promise<DailyPost> {
    const availablePersonas = ['tecnico_profissional', 'mecanico_raiz', 'especialista_bosch', 'cacador_promocoes', 'review_honesto'];
    const newPersona = availablePersonas.find(p => p !== post.persona) || 'mecanico_raiz';

    // Regenerar conteúdo com nova persona
    // Implementar lógica de regeneração aqui
    
    return {
      ...post,
      persona: newPersona
    };
  }

  /**
   * Corrige repetição de categoria
   */
  private async correctCategoryRepetition(post: DailyPost): Promise<DailyPost> {
    // Se for post de promoção, selecionar produto de categoria diferente
    if (post.type === 'promotion' || post.type === 'promotion_premium') {
      // Implementar lógica para selecionar produto de categoria diferente
    }
    
    return post;
  }

  /**
   * Calcula avaliação de risco
   */
  private async calculateRiskAssessment(posts: DailyPost[]): Promise<{
    spam_score: number;
    saturation_score: number;
    compliance_score: number;
  }> {
    const avgSpamScore = posts.reduce((sum, post) => sum + post.spam_score, 0) / posts.length;
    
    const saturationScore = this.calculateSaturationScore(posts);
    
    const complianceScore = this.calculateComplianceScore(posts);

    return {
      spam_score: Math.round(avgSpamScore),
      saturation_score: saturationScore,
      compliance_score: complianceScore
    };
  }

  /**
   * Calcula score de saturação
   */
  private calculateSaturationScore(posts: DailyPost[]): number {
    // Implementar lógica de cálculo de saturação
    return 25; // Placeholder
  }

  /**
   * Calcula score de compliance
   */
  private calculateComplianceScore(posts: DailyPost[]): number {
    const violations = this.checkMetaSafeViolations(posts);
    const baseScore = 100;
    const penaltyPerViolation = 15;
    
    return Math.max(0, baseScore - (violations.length * penaltyPerViolation));
  }

  /**
   * Calcula confiança geral
   */
  private calculateOverallConfidence(
    posts: DailyPost[],
    riskAssessment: any,
    contextAnalysis: any
  ): number {
    const avgEngagementPrediction = posts.reduce((sum, post) => sum + post.engagement_prediction, 0) / posts.length;
    const riskFactor = (100 - (riskAssessment.spam_score + riskAssessment.saturation_score) / 2) / 100;
    const contextFactor = contextAnalysis.confidence_score / 100;

    return Math.round(avgEngagementPrediction * riskFactor * contextFactor);
  }

  // Métodos utilitários

  private selectOptimalHour(
    timeWindow: { start: number; end: number },
    postType: string
  ): number {
    // Lógica simples para selecionar hora ótima dentro da janela
    const midPoint = Math.floor((timeWindow.start + timeWindow.end) / 2);
    
    // Ajustar baseado no tipo de post
    if (postType === 'interaction' && timeWindow.start === 8) return 9;
    if (postType === 'promotion' && timeWindow.start === 11) return 12;
    if (postType === 'video' && timeWindow.start === 16) return 17;
    if (postType === 'premium' && timeWindow.start === 19) return 20;
    
    return midPoint;
  }

  private selectTargetGroups(postType: string): string[] {
    const groupMappings = {
      interaction: ['Mecânicos Brasil', 'Ferramentas Profissionais', 'Dúvidas Oficina'],
      promotion: ['Promoções Ferramentas', 'Oportunidades', 'Compras Inteligentes'],
      branding: ['ForgeDeals Oficial', 'Parceiros ForgeDeals', 'Comunidade VIP'],
      premium: ['Clientes Premium', 'Compradores Ouro', 'Membros Exclusivos']
    };
    
    return groupMappings[postType as keyof typeof groupMappings] || [];
  }

  private selectOptimalProduct(
    products: Product[],
    postType: 'promotion' | 'premium'
  ): Product | undefined {
    if (!products || products.length === 0) return undefined;

    let filtered = [...products];

    if (postType === 'premium') {
      // Priorizar produtos com maior desconto e score alto
      filtered = filtered
        .filter(p => p.discount > 20 && (p.ai_score || 0) > 70)
        .sort((a, b) => (b.discount * (b.ai_score || 50)) - (a.discount * (a.ai_score || 50)));
    } else {
      // Promoção padrão - bom equilíbrio
      filtered = filtered
        .filter(p => p.discount > 10)
        .sort((a, b) => b.discount - a.discount);
    }

    return filtered[0];
  }

  private generateBrandingVideoUrl(videoType: string): string {
    // Gerar URL para vídeo branding (placeholder)
    return `https://forge-deals.com.br/videos/${videoType}_${Date.now()}.mp4`;
  }

  private getProductCategory(productId?: string): string {
    // Implementar lógica para obter categoria do produto
    return 'ferramentas';
  }

  private getRecentPerformance(): any {
    // Implementar lógica para obter performance recente
    return {
      avg_ctr: 4.2,
      avg_engagement: 65,
      avg_spam_score: 22,
      recent_posts: 12
    };
  }

  // Métodos fallback

  private createFallbackContextAnalysis(): any {
    return {
      market_opportunities: ['products_available'],
      risk_factors: ['standard_risk'],
      audience_state: 'normal',
      recommended_strategy: 'balanced',
      product_priorities: ['ferramentas', 'acessórios'],
      timing_optimization: {
        morning_efficiency: 75,
        midday_efficiency: 85,
        afternoon_efficiency: 70,
        evening_efficiency: 90
      },
      content_focus: ['promoções', 'engajamento'],
      confidence_score: 70
    };
  }

  private createFallbackInteractionPost(
    position: number,
    timeWindow: { start: number; end: number },
    objective: string
  ): DailyPost {
    return {
      id: `fallback_interaction_${Date.now()}`,
      position,
      type: 'interaction',
      time_window: {
        ...timeWindow,
        optimal_hour: timeWindow.start + 1
      },
      objective,
      persona: 'mecanico_raiz',
      content: {
        text: 'Qual ferramenta você mais usa na oficina? Compartilhe nos comentários! 👇 #Mecânica #Ferramentas',
        hashtags: ['#Mecânica', '#Ferramentas'],
        cta: 'comente',
        media_type: 'text'
      },
      target_groups: ['Mecânicos Brasil'],
      spam_score: 15,
      engagement_prediction: 75,
      ctr_prediction: 0,
      status: 'planned'
    };
  }

  private createFallbackPromotionPost(
    position: number,
    timeWindow: { start: number; end: number },
    objective: string,
    product?: Product
  ): DailyPost {
    return {
      id: `fallback_promotion_${Date.now()}`,
      position,
      type: 'promotion',
      time_window: {
        ...timeWindow,
        optimal_hour: timeWindow.start + 1
      },
      objective,
      persona: 'cacador_promocoes',
      content: {
        text: `🔥 OFERTA! ${product?.title || 'Produto selecionado'} por apenas R$${product?.price || 0}! Aproveite agora! 🎯`,
        hashtags: ['#Promoção', '#Desconto'],
        cta: 'confira',
        media_type: 'image',
        media_url: product?.image
      },
      target_groups: ['Promoções Ferramentas'],
      product_id: product?.id,
      spam_score: 25,
      engagement_prediction: 70,
      ctr_prediction: 5,
      status: 'planned'
    };
  }

  private createFallbackVideoBrandingPost(
    position: number,
    timeWindow: { start: number; end: number },
    objective: string
  ): DailyPost {
    return {
      id: `fallback_video_${Date.now()}`,
      position,
      type: 'video_branding',
      time_window: {
        ...timeWindow,
        optimal_hour: timeWindow.start + 1
      },
      objective,
      persona: 'tecnico_profissional',
      content: {
        text: 'Dica profissional do dia! Veja como escolher a ferramenta certa para cada serviço. Siga nossa página para mais! 🔧 #ForgeDeals #Profissional',
        hashtags: ['#ForgeDeals', '#Dicas'],
        cta: 'siga',
        media_type: 'video',
        media_url: 'https://forge-deals.com.br/videos/dica_profissional.mp4'
      },
      target_groups: ['ForgeDeals Oficial'],
      spam_score: 10,
      engagement_prediction: 60,
      ctr_prediction: 0,
      status: 'planned'
    };
  }

  private createFallbackPremiumPost(
    position: number,
    timeWindow: { start: number; end: number },
    objective: string,
    product?: Product
  ): DailyPost {
    return {
      id: `fallback_premium_${Date.now()}`,
      position,
      type: 'promotion_premium',
      time_window: {
        ...timeWindow,
        optimal_hour: timeWindow.start + 1
      },
      objective,
      persona: 'especialista_bosch',
      content: {
        text: `⚡ SUPER PROMOÇÃO! ${product?.title || 'Produto premium'} com ${product?.discount || 0}% OFF! Últimas unidades! 🏃‍♂️`,
        hashtags: ['#SuperPromoção', '#Urgente'],
        cta: 'corre',
        media_type: 'image',
        media_url: product?.image
      },
      target_groups: ['Clientes Premium'],
      product_id: product?.id,
      spam_score: 30,
      engagement_prediction: 80,
      ctr_prediction: 8,
      status: 'planned'
    };
  }

  /**
   * Obtém plano editorial do dia
   */
  getDailyPlan(date: string): DailyEditorialPlan | undefined {
    return this.performanceHistory.get(date);
  }

  /**
   * Obtém política editorial
   */
  getEditorialPolicy(): EditorialPolicy {
    return this.editorialPolicy;
  }

  /**
   * Exporta dados do planner
   */
  exportPlannerData(): {
    policy: EditorialPolicy;
    recentPosts: DailyPost[];
    performanceHistory: Map<string, DailyEditorialPlan>;
  } {
    return {
      policy: this.editorialPolicy,
      recentPosts: this.recentPosts,
      performanceHistory: this.performanceHistory
    };
  }
}
