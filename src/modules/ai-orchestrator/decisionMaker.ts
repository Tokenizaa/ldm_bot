import { AIDecision, AutonomousAction } from './orchestrator.engine';
import { OllamaService } from '../social-ai/ollama/ollama.service';

export interface DecisionContext {
  products: any[];
  currentPosts: any[];
  systemStatus: any;
  recentPerformance: any;
  userPreferences: any;
  marketConditions: any;
}

export interface DecisionWeights {
  discount_importance: number;
  brand_recognition: number;
  engagement_history: number;
  timing_optimal: number;
  spam_safety: number;
  audience_relevance: number;
}

export class DecisionMaker {
  private ollamaService: OllamaService;
  private weights: DecisionWeights;
  private learningHistory: Map<string, any> = new Map();

  constructor() {
    this.ollamaService = new OllamaService();
    this.weights = {
      discount_importance: 0.25,
      brand_recognition: 0.20,
      engagement_history: 0.20,
      timing_optimal: 0.15,
      spam_safety: 0.15,
      audience_relevance: 0.05
    };
  }

  /**
   * Motor principal de tomada de decisão
   */
  async makeDecisions(context: DecisionContext): Promise<{
    priorityDecisions: AIDecision[];
    publicationDecisions: AIDecision[];
    contentDecisions: AIDecision[];
    riskDecisions: AIDecision[];
    overallStrategy: any;
  }> {
    // 1. Análise de prioridade de produtos
    const priorityDecisions = await this.analyzeProductPriorities(context);
    
    // 2. Decisões de publicação
    const publicationDecisions = await this.makePublicationDecisions(context);
    
    // 3. Decisões de conteúdo
    const contentDecisions = await this.makeContentDecisions(context);
    
    // 4. Decisões de risco
    const riskDecisions = await this.makeRiskDecisions(context);
    
    // 5. Estratégia geral
    const overallStrategy = await this.defineOverallStrategy(context, {
      priorityDecisions,
      publicationDecisions,
      contentDecisions,
      riskDecisions
    });

    return {
      priorityDecisions,
      publicationDecisions,
      contentDecisions,
      riskDecisions,
      overallStrategy
    };
  }

  /**
   * Analisa prioridade de produtos com pesos personalizados
   */
  private async analyzeProductPriorities(context: DecisionContext): Promise<AIDecision[]> {
    const decisions: AIDecision[] = [];

    for (const product of context.products) {
      const score = this.calculateProductScore(product, context);
      
      if (score > 60) { // Apenas produtos com score relevante
        const decision = await this.createPriorityDecision(product, score, context);
        decisions.push(decision);
      }
    }

    // Ordenar por score
    return decisions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calcula score do produto baseado em múltiplos fatores
   */
  private calculateProductScore(product: any, context: DecisionContext): number {
    let score = 0;

    // Fator 1: Desconto (25%)
    const discountScore = Math.min(product.discount / 50 * 100, 100);
    score += discountScore * this.weights.discount_importance;

    // Fator 2: Reconhecimento de marca (20%)
    const brandScore = this.getBrandScore(product.brand);
    score += brandScore * this.weights.brand_recognition;

    // Fator 3: Histórico de engajamento (20%)
    const engagementScore = this.getEngagementScore(product.id, context);
    score += engagementScore * this.weights.engagement_history;

    // Fator 4: Timing ótimo (15%)
    const timingScore = this.getTimingScore(context);
    score += timingScore * this.weights.timing_optimal;

    // Fator 5: Segurança anti-spam (15%)
    const safetyScore = this.getSafetyScore(product, context);
    score += safetyScore * this.weights.spam_safety;

    // Fator 6: Relevância para audiência (5%)
    const relevanceScore = this.getRelevanceScore(product, context);
    score += relevanceScore * this.weights.audience_relevance;

    return Math.round(score);
  }

  /**
   * Cria decisão de prioridade para um produto
   */
  private async createPriorityDecision(product: any, score: number, context: DecisionContext): Promise<AIDecision> {
    const prompt = `
Produto analisado:
${JSON.stringify(product, null, 2)}

Score calculado: ${score}/100

Contexto atual:
- Posts recentes: ${context.currentPosts?.length || 0}
- Score spam sistema: ${context.systemStatus?.spamScore || 0}
- Performance recente: ${JSON.stringify(context.recentPerformance)}

Gere uma decisão de prioridade detalhada em JSON:
{
  "priority_level": "alta|média|baixa",
  "reasoning": "explicação detalhada da prioridade",
  "recommended_actions": ["ação1", "ação2", "ação3"],
  "best_posting_time": "HH:MM",
  "suggested_persona": "persona_ideal",
  "content_strategy": "estratégia de conteúdo",
  "risk_assessment": {
    "spam_risk": "low|medium|high",
    "engagement_prediction": "baixo|médio|alto",
    "conversion_probability": 0-100
  },
  "confidence": 0-100
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      const analysis = JSON.parse(response);

      return {
        type: 'priority',
        confidence: analysis.confidence / 100,
        reasoning: analysis.reasoning,
        action: {
          product_id: product.id,
          priority_level: analysis.priority_level,
          score: score,
          recommended_actions: analysis.recommended_actions,
          best_time: analysis.best_posting_time,
          suggested_persona: analysis.suggested_persona,
          content_strategy: analysis.content_strategy,
          risk_assessment: analysis.risk_assessment
        },
        risk_level: analysis.risk_assessment.spam_risk
      };
    } catch (error) {
      console.error('Error creating priority decision:', error);
      return this.createFallbackDecision(product, score);
    }
  }

  /**
   * Tomada de decisões de publicação
   */
  private async makePublicationDecisions(context: DecisionContext): Promise<AIDecision[]> {
    const decisions: AIDecision[] = [];

    // Decisão de quantidade
    const quantityDecision = await this.decidePublicationQuantity(context);
    decisions.push(quantityDecision);

    // Decisão de timing
    const timingDecisions = await this.decidePublicationTiming(context);
    decisions.push(...timingDecisions);

    // Decisão de frequência
    const frequencyDecision = await this.decidePublicationFrequency(context);
    decisions.push(frequencyDecision);

    return decisions;
  }

  /**
   * Decide quantidade ótima de publicações
   */
  private async decidePublicationQuantity(context: DecisionContext): Promise<AIDecision> {
    const currentHour = new Date().getHours();
    const postsToday = context.currentPosts?.filter(p => 
      new Date(p.created_at).toDateString() === new Date().toDateString()
    ).length || 0;

    const prompt = `
Contexto para decisão de quantidade:
- Hora atual: ${currentHour}:00
- Posts hoje: ${postsToday}
- Score spam sistema: ${context.systemStatus?.spamScore || 0}
- Warnings Meta: ${context.systemStatus?.metaWarnings || 0}
- Performance recente: ${JSON.stringify(context.recentPerformance)}

Analisar e decidir quantidade ideal de posts para hoje.

Retorne JSON:
{
  "strategy": "conservative|balanced|aggressive",
  "recommended_total": número,
  "remaining_posts": número,
  "reasoning": "explicação da estratégia",
  "risk_factors": ["fator1", "fator2"],
  "optimal_hours": [hora1, hora2, hora3],
  "confidence": 0-100
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      const analysis = JSON.parse(response);

      return {
        type: 'publication',
        confidence: analysis.confidence / 100,
        reasoning: analysis.reasoning,
        action: {
          strategy: analysis.strategy,
          recommended_total: analysis.recommended_total,
          remaining_posts: analysis.remaining_posts,
          optimal_hours: analysis.optimal_hours,
          risk_factors: analysis.risk_factors
        },
        risk_level: analysis.strategy === 'aggressive' ? 'high' : 
                   analysis.strategy === 'balanced' ? 'medium' : 'low'
      };
    } catch (error) {
      console.error('Error deciding publication quantity:', error);
      return this.createFallbackQuantityDecision(postsToday);
    }
  }

  /**
   * Tomada de decisões de conteúdo
   */
  private async makeContentDecisions(context: DecisionContext): Promise<AIDecision[]> {
    const decisions: AIDecision[] = [];

    // Decisão de mix de conteúdo
    const contentMixDecision = await this.decideContentMix(context);
    decisions.push(contentMixDecision);

    // Decisão de personas
    const personaDecisions = await this.decidePersonas(context);
    decisions.push(...personaDecisions);

    // Decisão de formatos
    const formatDecisions = await this.decideFormats(context);
    decisions.push(...formatDecisions);

    return decisions;
  }

  /**
   * Decide mix ideal de tipos de conteúdo
   */
  private async decideContentMix(context: DecisionContext): Promise<AIDecision> {
    const recentContent = context.currentPosts?.slice(-20) || [];
    const currentMix = this.analyzeCurrentContentMix(recentContent);

    const prompt =`
Mix atual de conteúdo (últimos 20 posts):
${JSON.stringify(currentMix, null, 2)}

Contexto do sistema:
- Score spam: ${context.systemStatus?.spamScore || 0}
- Performance por tipo: ${JSON.stringify(context.recentPerformance?.byContentType || {})}
- Hora atual: ${new Date().getHours()}:00

Regras recomendadas:
- Ofertas: 40%
- Perguntas: 30% 
- Reviews: 20%
- Humor técnico: 10%

Retorne JSON com mix ideal:
{
  "recommended_mix": {
    "offer": percentual,
    "question": percentual,
    "review": percentual,
    "technical_humor": percentual
  },
  "reasoning": "explicação do mix",
  "adjustments_needed": ["ajuste1", "ajuste2"],
  "priority_content_types": ["tipo1", "tipo2"],
  "confidence": 0-100
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'mistral');
      const analysis = JSON.parse(response);

      return {
        type: 'content',
        confidence: analysis.confidence / 100,
        reasoning: analysis.reasoning,
        action: {
          recommended_mix: analysis.recommended_mix,
          current_mix: currentMix,
          adjustments_needed: analysis.adjustments_needed,
          priority_content_types: analysis.priority_content_types
        },
        risk_level: 'low'
      };
    } catch (error) {
      console.error('Error deciding content mix:', error);
      return this.createFallbackContentMixDecision();
    }
  }

  /**
   * Tomada de decisões de risco
   */
  private async makeRiskDecisions(context: DecisionContext): Promise<AIDecision[]> {
    const decisions: AIDecision[] = [];

    // Análise de risco de spam
    const spamRiskDecision = await this.analyzeSpamRisk(context);
    decisions.push(spamRiskDecision);

    // Análise de risco de timing
    const timingRiskDecision = await this.analyzeTimingRisk(context);
    decisions.push(timingRiskDecision);

    // Análise de risco de conteúdo
    const contentRiskDecision = await this.analyzeContentRisk(context);
    decisions.push(contentRiskDecision);

    return decisions;
  }

  /**
   * Define estratégia geral baseada em todas as decisões
   */
  private async defineOverallStrategy(
    context: DecisionContext,
    decisions: any
  ): Promise<any> {
    const prompt =`
Resumo de todas as decisões:
${JSON.stringify(decisions, null, 2)}

Contexto completo:
${JSON.stringify(context, null, 2)}

Defina estratégia geral operacional em JSON:
{
  "overall_strategy": "conservative|balanced|aggressive",
  "primary_focus": "foco_principal",
  "secondary_focus": "foco_secundário",
  "key_priorities": ["prioridade1", "prioridade2", "prioridade3"],
  "risk_tolerance": "low|medium|high",
  "success_metrics": ["métrica1", "métrica2"],
  "monitoring_points": ["ponto1", "ponto2"],
  "execution_plan": {
    "immediate_actions": ["ação1", "ação2"],
    "short_term_goals": ["meta1", "meta2"],
    "long_term_objectives": ["objetivo1", "objetivo2"]
  },
  "confidence": 0-100
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error defining overall strategy:', error);
      return this.createFallbackStrategy();
    }
  }

  // Métodos utilitários
  private getBrandScore(brand: string): number {
    const premiumBrands = ['Bosch', 'Makita', 'DeWalt', 'Milwaukee', 'Festool'];
    const goodBrands = ['Vonder', 'Tramontina', 'Stanley', 'Black & Decker'];
    
    if (premiumBrands.includes(brand)) return 90;
    if (goodBrands.includes(brand)) return 70;
    return 50;
  }

  private getEngagementScore(productId: string, context: DecisionContext): number {
    const history = context.recentPerformance?.byProduct?.[productId];
    if (!history) return 50; // Score médio para produtos novos
    
    return Math.min(history.avg_ctr * 100, 100);
  }

  private getTimingScore(context: DecisionContext): number {
    const hour = new Date().getHours();
    const optimalHours = [8, 10, 14, 16, 18, 20];
    
    return optimalHours.includes(hour) ? 80 : 50;
  }

  private getSafetyScore(product: any, context: DecisionContext): number {
    const systemSpamScore = context.systemStatus?.spamScore || 0;
    const productSpamRisk = product.discount > 50 ? 30 : 70;
    
    return Math.min((systemSpamScore + productSpamRisk) / 2, 100);
  }

  private getRelevanceScore(product: any, context: DecisionContext): number {
    // Implementar lógica de relevância baseada em tendências e preferências
    return 60;
  }

  private analyzeCurrentContentMix(posts: any[]): any {
    const mix = { offer: 0, question: 0, review: 0, technical_humor: 0 };
    
    posts.forEach(post => {
      mix[post.type] = (mix[post.type] || 0) + 1;
    });

    const total = posts.length || 1;
    Object.keys(mix).forEach(key => {
      mix[key] = Math.round((mix[key] / total) * 100);
    });

    return mix;
  }

  private createFallbackDecision(product: any, score: number): AIDecision {
    return {
      type: 'priority',
      confidence: 0.7,
      reasoning: 'Decisão fallback baseada em score calculado',
      action: { product_id: product.id, score },
      risk_level: 'medium'
    };
  }

  private createFallbackQuantityDecision(postsToday: number): AIDecision {
    const remaining = Math.max(4 - postsToday, 0);
    
    return {
      type: 'publication',
      confidence: 0.6,
      reasoning: 'Estratégia conservadora fallback',
      action: {
        strategy: 'conservative',
        recommended_total: 4,
        remaining_posts: remaining
      },
      risk_level: 'low'
    };
  }

  private createFallbackContentMixDecision(): AIDecision {
    return {
      type: 'content',
      confidence: 0.6,
      reasoning: 'Mix padrão recomendado',
      action: {
        recommended_mix: { offer: 40, question: 30, review: 20, technical_humor: 10 }
      },
      risk_level: 'low'
    };
  }

  private createFallbackStrategy(): any {
    return {
      overall_strategy: 'balanced',
      primary_focus: 'safe_growth',
      confidence: 60
    };
  }

  // Métodos placeholder para implementação futura
  private async decidePublicationTiming(context: DecisionContext): Promise<AIDecision[]> {
    return [];
  }

  private async decidePublicationFrequency(context: DecisionContext): Promise<AIDecision> {
    return {
      type: 'publication',
      confidence: 0.7,
      reasoning: 'Frequência padrão',
      action: { frequency: 'moderate' },
      risk_level: 'medium'
    };
  }

  private async decidePersonas(context: DecisionContext): Promise<AIDecision[]> {
    return [];
  }

  private async decideFormats(context: DecisionContext): Promise<AIDecision[]> {
    return [];
  }

  private async analyzeSpamRisk(context: DecisionContext): Promise<AIDecision> {
    return {
      type: 'spam_control',
      confidence: 0.8,
      reasoning: 'Análise padrão de risco',
      action: { risk_level: 'low' },
      risk_level: 'low'
    };
  }

  private async analyzeTimingRisk(context: DecisionContext): Promise<AIDecision> {
    return {
      type: 'timing',
      confidence: 0.7,
      reasoning: 'Timing seguro',
      action: { optimal: true },
      risk_level: 'low'
    };
  }

  private async analyzeContentRisk(context: DecisionContext): Promise<AIDecision> {
    return {
      type: 'content',
      confidence: 0.8,
      reasoning: 'Contúdo seguro',
      action: { approved: true },
      risk_level: 'low'
    };
  }
}
