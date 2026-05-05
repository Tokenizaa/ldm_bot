import { OllamaService } from '../social-ai/ollama/ollama.service';
import { Product } from '../../types';

export interface PublicationPlan {
  id: string;
  date: string;
  total_posts: number;
  content_mix: {
    offer: number;
    interaction: number;
    review: number;
    branding: number;
  };
  schedule: {
    time: string;
    type: 'offer' | 'interaction' | 'review' | 'branding';
    persona: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    product_id?: string;
  }[];
  strategy: 'conservative' | 'balanced' | 'aggressive';
  risk_assessment: {
    spam_risk: number;
    saturation_risk: number;
    frequency_risk: number;
  };
  ai_confidence: number;
  created_at: string;
}

export interface EditorialMemory {
  recent_posts: {
    content: string;
    type: string;
    persona: string;
    category: string;
    cta: string;
    timestamp: string;
  }[];
  recent_ctas: string[];
  recent_personas: string[];
  recent_categories: string[];
  recent_hours: number[];
  frequency_7days: number[];
  saturation_scores: Map<string, number>;
}

export class PublicationPlanner {
  private ollamaService: OllamaService;
  private memory: EditorialMemory;

  constructor() {
    this.ollamaService = new OllamaService();
    this.memory = {
      recent_posts: [],
      recent_ctas: [],
      recent_personas: [],
      recent_categories: [],
      recent_hours: [],
      frequency_7days: [],
      saturation_scores: new Map()
    };
  }

  /**
   * Planejamento editorial autônomo completo
   */
  async planDailyPublication(context: {
    products: Product[];
    current_date: string;
    system_performance: any;
    market_conditions: any;
  }): Promise<PublicationPlan> {
    // 1. Análise de contexto e memória
    const contextAnalysis = await this.analyzeContext(context);
    
    // 2. Decisão de estratégia
    const strategy = await this.decideStrategy(contextAnalysis);
    
    // 3. Definição de quantidade
    const postCount = await this.decidePostCount(contextAnalysis, strategy);
    
    // 4. Mix de conteúdo
    const contentMix = await this.calculateContentMix(contextAnalysis, strategy);
    
    // 5. Agendamento inteligente
    const schedule = await this.createIntelligentSchedule(
      context,
      postCount,
      contentMix,
      strategy
    );
    
    // 6. Avaliação de risco
    const riskAssessment = await this.assessRisks(schedule, contextAnalysis);
    
    // 7. Confiança geral
    const aiConfidence = this.calculateOverallConfidence(
      strategy,
      riskAssessment,
      contextAnalysis
    );

    const plan: PublicationPlan = {
      id: `plan_${Date.now()}`,
      date: context.current_date,
      total_posts: postCount,
      content_mix: contentMix,
      schedule,
      strategy,
      risk_assessment: riskAssessment,
      ai_confidence,
      created_at: new Date().toISOString()
    };

    // Salvar na memória para aprendizado
    this.updateMemory(plan);

    return plan;
  }

  /**
   * Análise completa do contexto
   */
  private async analyzeContext(context: any): Promise<any> {
    const prompt = `
Analise o contexto editorial completo:

DATA ATUAL: ${context.current_date}
PRODUTOS DISPONÍVEIS: ${context.products?.length || 0}
PERFORMANCE RECENTE: ${JSON.stringify(context.system_performance)}
CONDIÇÕES DE MERCADO: ${JSON.stringify(context.market_conditions)}

MEMÓRIA RECENTE:
- Posts últimos 7 dias: ${this.memory.recent_posts.length}
- Frequência média: ${this.calculateAverageFrequency()}
- Personas usadas: ${this.memory.recent_personas.join(', ')}
- Categorias recentes: ${this.memory.recent_categories.join(', ')}
- Horários pico: ${this.memory.recent_hours.join(', ')}

Retorne JSON com análise completa:
{
  "market_opportunities": ["oportunidade1", "oportunidade2"],
  "risk_factors": ["risco1", "risco2"],
  "saturation_warnings": ["categoria1", "categoria2"],
  "timing_factors": {
    "best_hours": [hora1, hora2],
    "avoid_hours": [hora3, hora4],
    "peak_engagement": "manhã|tarde|noite"
  },
  "content_gaps": ["gap1", "gap2"],
  "audience_state": "engajado|fatigado|neutro",
  "competitive_landscape": "baixo|médio|alto",
  "seasonal_factors": ["fator1", "fator2"],
  "recommendations": ["rec1", "rec2"],
  "confidence_score": 0-100
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing context:', error);
      return this.createFallbackContextAnalysis();
    }
  }

  /**
   * Decisão autônoma de estratégia
   */
  private async decideStrategy(contextAnalysis: any): Promise<'conservative' | 'balanced' | 'aggressive'> {
    const prompt =`
Baseado na análise de contexto, decida a estratégia editorial ideal:

ANÁLISE: ${JSON.stringify(contextAnalysis, null, 2)}

REGRAS ESTRATÉGICAS:
- CONSERVATIVE: 2-3 posts/dia, foco em segurança, baixo risco
- BALANCED: 4-5 posts/dia, equilíbrio crescimento/safety
- AGGRESSIVE: 6-8 posts/dia, maximização, risco calculado

CONSIDERE:
- Score confiança análise
- Fatores de risco
- Oportunidades de mercado
- Estado da audiência
- Saturação recente

Retorne JSON:
{
  "recommended_strategy": "conservative|balanced|aggressive",
  "reasoning": "explicação detalhada",
  "key_factors": ["fator1", "fator2"],
  "risk_mitigation": ["mitigação1", "mitigação2"],
  "expected_outcomes": {
    "reach": "estimativa",
    "engagement": "estimativa",
    "conversion": "estimativa",
    "spam_risk": "baixo|médio|alto"
  },
  "confidence": 0-100
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      const result = JSON.parse(response);
      return result.recommended_strategy;
    } catch (error) {
      console.error('Error deciding strategy:', error);
      return 'balanced'; // Fallback seguro
    }
  }

  /**
   * Decisão autônoma de quantidade de posts
   */
  private async decidePostCount(
    contextAnalysis: any,
    strategy: 'conservative' | 'balanced' | 'aggressive'
  ): Promise<number> {
    const baseCounts = {
      conservative: { min: 2, max: 3 },
      balanced: { min: 4, max: 5 },
      aggressive: { min: 6, max: 8 }
    };

    const baseRange = baseCounts[strategy];
    
    // Ajustes baseados no contexto
    let adjustment = 0;
    
    // Reduzir se audiência fatigada
    if (contextAnalysis.audience_state === 'fatigado') {
      adjustment -= 1;
    }
    
    // Aumentar se oportunidades altas
    if (contextAnalysis.market_opportunities?.length > 3) {
      adjustment += 1;
    }
    
    // Reduzir se saturação alta
    if (contextAnalysis.saturation_warnings?.length > 2) {
      adjustment -= 1;
    }

    const adjustedMin = Math.max(baseRange.min + adjustment, 1);
    const adjustedMax = Math.max(baseRange.max + adjustment, adjustedMin);

    // Decisão final via IA
    const prompt =`
Estratégia: ${strategy}
Range base: ${adjustedMin}-${adjustedMax} posts
Contexto: ${JSON.stringify(contextAnalysis, null, 2)}

Decida a quantidade ideal de posts para hoje.

Retorne JSON:
{
  "recommended_count": número,
  "reasoning": "explicação",
  "confidence": 0-100
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'mistral');
      const result = JSON.parse(response);
      return Math.min(Math.max(result.recommended_count, adjustedMin), adjustedMax);
    } catch (error) {
      console.error('Error deciding post count:', error);
      return Math.floor((adjustedMin + adjustedMax) / 2);
    }
  }

  /**
   * Cálculo autônomo de mix de conteúdo
   */
  private async calculateContentMix(
    contextAnalysis: any,
    strategy: 'conservative' | 'balanced' | 'aggressive'
  ): Promise<{ offer: number; interaction: number; review: number; branding: number }> {
    const baseMixes = {
      conservative: { offer: 30, interaction: 40, review: 25, branding: 5 },
      balanced: { offer: 40, interaction: 30, review: 20, branding: 10 },
      aggressive: { offer: 50, interaction: 25, review: 15, branding: 10 }
    };

    let mix = { ...baseMixes[strategy] };

    // Ajustes baseados em contexto
    if (contextAnalysis.content_gaps?.includes('branding')) {
      mix.branding += 5;
      mix.offer -= 5;
    }

    if (contextAnalysis.audience_state === 'fatigado') {
      mix.interaction += 10;
      mix.offer -= 10;
    }

    if (contextAnalysis.market_opportunities?.length > 3) {
      mix.offer += 5;
      mix.review -= 5;
    }

    // Normalizar para 100%
    const total = Object.values(mix).reduce((sum, val) => sum + val, 0);
    Object.keys(mix).forEach(key => {
      mix[key] = Math.round((mix[key] / total) * 100);
    });

    return mix;
  }

  /**
   * Criação autônoma de schedule inteligente
   */
  private async createIntelligentSchedule(
    context: any,
    postCount: number,
    contentMix: any,
    strategy: string
  ): Promise<any[]> {
    const schedule = [];
    const availableHours = this.getOptimalHours(contentMix, strategy);
    
    // Distribuir posts pelos horários ótimos
    const timeSlots = this.distributeTimeSlots(postCount, availableHours);
    
    // Para cada slot, decidir tipo e persona
    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i];
      const contentType = this.selectContentType(contentMix, schedule);
      const persona = await this.selectPersona(contentType, context);
      const product = this.selectProduct(context.products, contentType);
      
      schedule.push({
        time: slot,
        type: contentType,
        persona,
        priority: this.calculatePriority(contentType, product, context),
        product_id: product?.id
      });
    }

    return schedule;
  }

  /**
   * Seleção autônoma de persona baseada em contexto
   */
  private async selectPersona(contentType: string, context: any): Promise<string> {
    const personas = [
      'tecnico_profissional',
      'mecanico_raiz',
      'especialista_bosch',
      'cacador_promocoes',
      'review_honesto',
      'influenciador_ferramentas'
    ];

    // Evitar repetição de personas recentes
    const availablePersonas = personas.filter(p => 
      !this.memory.recent_personas.slice(-3).includes(p)
    );

    const prompt =`
Tipo de conteúdo: ${contentType}
Personas disponíveis: ${availablePersonas.join(', ')}
Personas recentes: ${this.memory.recent_personas.join(', ')}

Selecione a persona ideal para este conteúdo.

Retorne JSON:
{
  "selected_persona": "persona_escolhida",
  "reasoning": "explicação",
  "confidence": 0-100
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'phi');
      const result = JSON.parse(response);
      return result.selected_persona;
    } catch (error) {
      console.error('Error selecting persona:', error);
      return availablePersonas[0]; // Fallback
    }
  }

  /**
   * Seleção autônoma de produto baseado em tipo de conteúdo
   */
  private selectProduct(products: Product[], contentType: string): Product | undefined {
    if (!products || products.length === 0) return undefined;

    // Priorizar produtos com base no tipo de conteúdo
    let filtered = [...products];

    if (contentType === 'offer') {
      // Priorizar produtos com bom desconto
      filtered = filtered
        .filter(p => p.discount > 15)
        .sort((a, b) => b.discount - a.discount);
    } else if (contentType === 'review') {
      // Priorizar produtos bem avaliados
      filtered = filtered
        .filter(p => p.ai_score && p.ai_score > 70)
        .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
    }

    // Evitar repetição de produtos recentes
    const recentProductIds = this.memory.recent_posts
      .slice(-5)
      .map(p => p.product_id)
      .filter(Boolean);

    filtered = filtered.filter(p => !recentProductIds.includes(p.id));

    return filtered[0];
  }

  /**
   * Avaliação autônoma de riscos
   */
  private async assessRisks(schedule: any[], contextAnalysis: any): Promise<any> {
    const spamRisk = this.calculateSpamRisk(schedule, contextAnalysis);
    const saturationRisk = this.calculateSaturationRisk(schedule);
    const frequencyRisk = this.calculateFrequencyRisk(schedule);

    return {
      spam_risk: spamRisk,
      saturation_risk: saturationRisk,
      frequency_risk: frequencyRisk,
      overall_risk: (spamRisk + saturationRisk + frequencyRisk) / 3
    };
  }

  // Métodos utilitários
  private getOptimalHours(contentMix: any, strategy: string): number[] {
    const baseHours = {
      conservative: [9, 11, 14, 16, 18, 20],
      balanced: [8, 10, 12, 14, 16, 18, 20, 22],
      aggressive: [7, 9, 11, 13, 15, 17, 19, 21, 23]
    };

    return baseHours[strategy as keyof typeof baseHours];
  }

  private distributeTimeSlots(postCount: number, availableHours: number[]): number[] {
    const slots = [];
    const interval = Math.floor(availableHours.length / postCount);
    
    for (let i = 0; i < postCount; i++) {
      const index = i * interval;
      slots.push(availableHours[Math.min(index, availableHours.length - 1)]);
    }
    
    return slots;
  }

  private selectContentType(contentMix: any, currentSchedule: any[]): string {
    const types = ['offer', 'interaction', 'review', 'branding'];
    const targetMix = { ...contentMix };
    
    // Ajustar baseado no que já foi agendado
    currentSchedule.forEach(item => {
      targetMix[item.type] = Math.max(0, targetMix[item.type] - 1);
    });
    
    // Selecionar tipo com maior necessidade
    let selectedType = 'offer';
    let maxNeed = 0;
    
    Object.entries(targetMix).forEach(([type, need]) => {
      if (need > maxNeed) {
        maxNeed = need;
        selectedType = type;
      }
    });
    
    return selectedType;
  }

  private calculatePriority(contentType: string, product?: Product, context?: any): 'low' | 'medium' | 'high' | 'urgent' {
    if (!product) return 'low';
    
    if (product.discount > 40) return 'urgent';
    if (product.discount > 25) return 'high';
    if (product.discount > 15) return 'medium';
    return 'low';
  }

  private calculateSpamRisk(schedule: any[], contextAnalysis: any): number {
    let risk = 0;
    
    // Risco por excesso de ofertas
    const offerCount = schedule.filter(s => s.type === 'offer').length;
    if (offerCount > schedule.length * 0.6) risk += 30;
    
    // Risco por repetição de personas
    const personaCounts = schedule.reduce((acc, item) => {
      acc[item.persona] = (acc[item.persona] || 0) + 1;
      return acc;
    }, {});
    
    Object.values(personaCounts).forEach((count: any) => {
      if (count > 2) risk += 15;
    });
    
    return Math.min(risk, 100);
  }

  private calculateSaturationRisk(schedule: any[]): number {
    let risk = 0;
    
    // Verificar saturação de categorias
    const categoryCounts = schedule.reduce((acc, item) => {
      const category = this.getCategoryFromPersona(item.persona);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(categoryCounts).forEach(([category, count]: [string, any]) => {
      if (count > 2) risk += 20;
    });
    
    return Math.min(risk, 100);
  }

  private calculateFrequencyRisk(schedule: any[]): number {
    // Risco baseado na frequência horária
    const hourGroups = schedule.reduce((acc, item) => {
      const hour = Math.floor(item.time / 3) * 3; // Agrupar em blocos de 3 horas
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    
    let risk = 0;
    Object.values(hourGroups).forEach((count: any) => {
      if (count > 2) risk += 25;
    });
    
    return Math.min(risk, 100);
  }

  private calculateOverallConfidence(
    strategy: string,
    riskAssessment: any,
    contextAnalysis: any
  ): number {
    let confidence = 80; // Base
    
    // Ajustar baseado na estratégia
    if (strategy === 'conservative') confidence += 10;
    if (strategy === 'aggressive') confidence -= 10;
    
    // Ajustar baseado nos riscos
    confidence -= riskAssessment.overall_risk / 2;
    
    // Ajustar baseado na análise de contexto
    if (contextAnalysis.confidence_score) {
      confidence = (confidence + contextAnalysis.confidence_score) / 2;
    }
    
    return Math.max(Math.min(confidence, 100), 0);
  }

  private updateMemory(plan: PublicationPlan): void {
    // Atualizar memória com o novo plano
    plan.schedule.forEach(item => {
      this.memory.recent_personas.push(item.persona);
      this.memory.recent_hours.push(parseInt(item.time.toString()));
    });
    
    // Manter apenas os registros recentes
    this.memory.recent_personas = this.memory.recent_personas.slice(-20);
    this.memory.recent_hours = this.memory.recent_hours.slice(-50);
  }

  private calculateAverageFrequency(): number {
    if (this.memory.frequency_7days.length === 0) return 0;
    return this.memory.frequency_7days.reduce((sum, val) => sum + val, 0) / this.memory.frequency_7days.length;
  }

  private getCategoryFromPersona(persona: string): string {
    const categoryMap: Record<string, string> = {
      'tecnico_profissional': 'profissional',
      'mecanico_raiz': 'pratico',
      'especialista_bosch': 'premium',
      'cacador_promocoes': 'promocional',
      'review_honesto': 'avaliacao',
      'influenciador_ferramentas': 'tendencia'
    };
    return categoryMap[persona] || 'geral';
  }

  private createFallbackContextAnalysis(): any {
    return {
      market_opportunities: ['products_available'],
      risk_factors: ['standard_risk'],
      saturation_warnings: [],
      timing_factors: {
        best_hours: [10, 14, 18],
        avoid_hours: [6, 23],
        peak_engagement: 'tarde'
      },
      content_gaps: [],
      audience_state: 'neutro',
      competitive_landscape: 'médio',
      seasonal_factors: [],
      recommendations: ['proceed_with_caution'],
      confidence_score: 60
    };
  }

  /**
   * Obter memória atual
   */
  getMemory(): EditorialMemory {
    return this.memory;
  }

  /**
   * Adicionar post à memória
   */
  addPostToMemory(post: any): void {
    this.memory.recent_posts.push({
      content: post.content,
      type: post.type,
      persona: post.persona,
      category: post.category,
      cta: post.cta,
      timestamp: new Date().toISOString()
    });
    
    // Manter apenas os 100 posts mais recentes
    this.memory.recent_posts = this.memory.recent_posts.slice(-100);
  }
}
