import { OllamaService } from '../social-ai/ollama/ollama.service';

export interface Persona {
  id: string;
  name: string;
  description: string;
  characteristics: {
    tone: string;
    language_style: string;
    expertise_level: string;
    communication_approach: string;
    typical_phrases: string[];
    avoid_phrases: string[];
  };
  strengths: string[];
  weaknesses: string[];
  best_for: string[];
  avoid_situations: string[];
  engagement_patterns: {
    peak_hours: number[];
    preferred_content_types: string[];
    avg_engagement: number;
    spam_risk: number;
  };
  recent_usage: {
    last_used: string;
    usage_count_7days: number;
    saturation_score: number;
  };
}

export interface PersonaSelection {
  persona: Persona;
  confidence: number;
  reasoning: string;
  alternatives: Persona[];
  saturation_warning: boolean;
}

export interface PersonaContext {
  content_type: string;
  target_audience: string;
  time_of_day: string;
  product_category?: string;
  urgency_level?: string;
  recent_personas?: string[];
  performance_goal?: 'engagement' | 'conversion' | 'branding';
}

export class PersonaSelector {
  private ollamaService: OllamaService;
  private personas: Persona[];
  private usageHistory: Map<string, Date[]>;
  private performanceData: Map<string, any>;
  private saturationThresholds: {
    max_daily_usage: number;
    max_weekly_usage: number;
    saturation_score_limit: number;
  };

  constructor() {
    this.ollamaService = new OllamaService();
    this.personas = [];
    this.usageHistory = new Map();
    this.performanceData = new Map();
    this.saturationThresholds = {
      max_daily_usage: 2,
      max_weekly_usage: 5,
      saturation_score_limit: 70
    };
    this.initializePersonas();
  }

  /**
   * Inicializa personas editoriais
   */
  private initializePersonas(): void {
    this.personas = [
      {
        id: 'tecnico_profissional',
        name: 'Técnico Profissional',
        description: 'Especialista técnico com linguagem precisa e foco em qualidade',
        characteristics: {
          tone: 'formal mas acessível',
          language_style: 'técnico, preciso, educativo',
          expertise_level: 'especialista',
          communication_approach: 'didático, autoritário',
          typical_phrases: ['especificações técnicas', 'padrão de qualidade', 'recomendação profissional', 'segurança operacional'],
          avoid_phrases: ['super promoção', 'corre lá', 'urgente demais']
        },
        strengths: ['credibilidade', 'autoridade técnica', 'confiança', 'educação'],
        weaknesses: ['pode ser muito formal', 'menos engajador para leigos'],
        best_for: ['reviews técnicos', 'dicas profissionais', 'comparações de qualidade', 'conteúdo educativo'],
        avoid_situations: ['promoções agressivas', 'linguagem muito informal', 'conteúdo viral'],
        engagement_patterns: {
          peak_hours: [10, 14, 16],
          preferred_content_types: ['review', 'tutorial', 'comparison'],
          avg_engagement: 75,
          spam_risk: 15
        },
        recent_usage: {
          last_used: '',
          usage_count_7days: 0,
          saturation_score: 0
        }
      },
      {
        id: 'mecanico_raiz',
        name: 'Mecânico Raiz',
        description: 'Profissional experiente com linguagem informal e prática',
        characteristics: {
          tone: 'informal, descontraído',
          language_style: 'coloquial, prático, direto',
          expertise_level: 'experiente',
          communication_approach: 'camarada, compartilhador',
          typical_phrases: ['na prática', 'povoa da oficina', 'dia a dia', 'bom e barato'],
          avoid_phrases: ['especificações complexas', 'linguagem corporativa']
        },
        strengths: ['autenticidade', 'proximidade', 'confiança', 'praticidade'],
        weaknesses: ['pode ser muito informal', 'menos autoridade técnica'],
        best_for: ['dicas práticas', 'interações', 'promoções realistas', 'conteúdo do dia a dia'],
        avoid_situations: ['conteúdo muito técnico', 'análises complexas', 'linguagem formal'],
        engagement_patterns: {
          peak_hours: [8, 11, 17, 20],
          preferred_content_types: ['interaction', 'promotion', 'question'],
          avg_engagement: 85,
          spam_risk: 20
        },
        recent_usage: {
          last_used: '',
          usage_count_7days: 0,
          saturation_score: 0
        }
      },
      {
        id: 'especialista_bosch',
        name: 'Especialista Bosch',
        description: 'Focado em qualidade Bosch e produtos premium',
        characteristics: {
          tone: 'premium, confiante',
          language_style: 'sofisticado, focado em marca',
          expertise_level: 'especialista de marca',
          communication_approach: 'autoritário, aspiracional',
          typical_phrases: ['qualidade Bosch', 'padrão alemão', 'investimento inteligente', 'tecnologia superior'],
          avoid_phrases: ['barato', 'promoção', 'desconto agressivo']
        },
        strengths: ['valor de marca', 'confiança premium', 'justificação de preço', 'autoridade'],
        weaknesses: ['pode ser elitista', 'limitado a produtos Bosch'],
        best_for: ['produtos premium', 'justificação de preço', 'conteúdo de marca', 'promoções de qualidade'],
        avoid_situations: ['produtos baratos', 'promoções agressivas', 'conteúdo genérico'],
        engagement_patterns: {
          peak_hours: [14, 16, 19],
          preferred_content_types: ['promotion_premium', 'branding', 'review'],
          avg_engagement: 70,
          spam_risk: 25
        },
        recent_usage: {
          last_used: '',
          usage_count_7days: 0,
          saturation_score: 0
        }
      },
      {
        id: 'cacador_promocoes',
        name: 'Caçador de Promoções',
        description: 'Focado em ofertas e oportunidades de economia',
        characteristics: {
          tone: 'energético, urgente',
          language_style: 'promocional, persuasivo',
          expertise_level: 'especialista em ofertas',
          communication_approach: 'empolgador, pressivo',
          typical_phrases: ['super oferta', 'não perca', 'última chance', 'economia garantida'],
          avoid_phrases: ['análise técnica', 'qualidade vs preço', 'esperar']
        },
        strengths: ['urgência', 'conversão', 'empolgação', 'clareza'],
        weaknesses: ['pode ser spam', 'baixa credibilidade', 'estresse'],
        best_for: ['promoções agressivas', 'ofertas limitadas', 'conteúdo de urgência', 'flash sales'],
        avoid_situations: ['conteúdo educativo', 'branding sutil', 'análises profundas'],
        engagement_patterns: {
          peak_hours: [9, 12, 18, 21],
          preferred_content_types: ['promotion', 'flash', 'motion_slide'],
          avg_engagement: 80,
          spam_risk: 35
        },
        recent_usage: {
          last_used: '',
          usage_count_7days: 0,
          saturation_score: 0
        }
      },
      {
        id: 'review_honesto',
        name: 'Review Honesto',
        description: 'Focado em análises transparentes e verdadeiras',
        characteristics: {
          tone: 'sincero, transparente',
          language_style: 'analítico, honesto, equilibrado',
          expertise_level: 'analista',
          communication_approach: 'objetivo, confiável',
          typical_phrases: ['análise honesta', 'pontos fortes e fracos', 'sem rodeios', 'veredito final'],
          avoid_phrases: ['perfeito', 'melhor do mundo', 'compre sem pensar']
        },
        strengths: ['credibilidade', 'confiança', 'transparência', 'utilidade'],
        weaknesses: ['pode ser negativo', 'menos vendedor', 'complexidade'],
        best_for: ['reviews detalhados', 'comparações honestas', 'análises críticas', 'vereditos'],
        avoid_situations: ['promoções puras', 'conteúdo positivo apenas', 'marketing agressivo'],
        engagement_patterns: {
          peak_hours: [11, 15, 20],
          preferred_content_types: ['review', 'comparison', 'product_review'],
          avg_engagement: 78,
          spam_risk: 10
        },
        recent_usage: {
          last_used: '',
          usage_count_7days: 0,
          saturation_score: 0
        }
      },
      {
        id: 'influenciador_ferramentas',
        name: 'Influenciador de Ferramentas',
        description: 'Jovem, moderno, focado em tendências e engajamento',
        characteristics: {
          tone: 'energético, moderno',
          language_style: 'juvenil, trend, engajador',
          expertise_level: 'entusiasta',
          communication_approach: 'inspirador, viral',
          typical_phrases: ['trending', 'viral', 'estilo', 'confia', 'transforma'],
          avoid_phrases: ['técnico demais', 'tradicional', 'complexo']
        },
        strengths: ['engajamento', 'atualidade', 'viralidade', 'alcance'],
        weaknesses: ['pode ser superficial', 'menos autoridade', 'fugaz'],
        best_for: ['conteúdo viral', 'shorts', 'reels', 'tendências', 'interações jovens'],
        avoid_situations: ['conteúdo técnico profundo', 'análises complexas', 'público tradicional'],
        engagement_patterns: {
          peak_hours: [16, 18, 20, 22],
          preferred_content_types: ['short', 'reel', 'interaction', 'tutorial'],
          avg_engagement: 90,
          spam_risk: 18
        },
        recent_usage: {
          last_used: '',
          usage_count_7days: 0,
          saturation_score: 0
        }
      }
    ];

    // Inicializar histórico de uso
    this.personas.forEach(persona => {
      this.usageHistory.set(persona.id, []);
    });
  }

  /**
   * Seleciona persona ideal baseada no contexto
   */
  async selectOptimalPersona(context: PersonaContext): Promise<PersonaSelection> {
    // 1. Filtrar personas disponíveis (sem saturação)
    const availablePersonas = this.filterAvailablePersonas(context);

    if (availablePersonas.length === 0) {
      // Se não houver personas disponíveis, resetar saturação
      this.resetSaturationScores();
      return this.selectOptimalPersona(context);
    }

    // 2. Rankear personas baseado no contexto
    const rankedPersonas = await this.rankPersonasByContext(availablePersonas, context);

    // 3. Selecionar melhor persona
    const selectedPersona = rankedPersonas[0];

    // 4. Calcular confiança
    const confidence = this.calculateSelectionConfidence(selectedPersona, context);

    // 5. Gerar reasoning
    const reasoning = await this.generateSelectionReasoning(selectedPersona, context);

    // 6. Verificar saturação
    const saturationWarning = this.checkSaturationWarning(selectedPersona);

    // 7. Obter alternativas
    const alternatives = rankedPersonas.slice(1, 3);

    // 8. Registrar uso
    this.registerPersonaUsage(selectedPersona.persona.id);

    return {
      persona: selectedPersona.persona,
      confidence,
      reasoning,
      alternatives: alternatives.map(a => a.persona),
      saturation_warning: saturationWarning
    };
  }

  /**
   * Filtra personas disponíveis (sem saturação)
   */
  private filterAvailablePersonas(context: PersonaContext): Array<{ persona: Persona; score: number }> {
    const available: Array<{ persona: Persona; score: number }> = [];

    for (const persona of this.personas) {
      const saturationScore = this.calculateSaturationScore(persona.id);
      const recentUsage = this.getRecentUsage(persona.id);

      // Verificar se persona está saturada
      if (saturationScore >= this.saturationThresholds.saturation_score_limit) {
        continue;
      }

      // Verificar limites de uso
      if (recentUsage.daily >= this.saturationThresholds.max_daily_usage) {
        continue;
      }

      // Verificar se está na lista de avoid
      if (context.recent_personas?.includes(persona.id)) {
        continue;
      }

      // Verificar se é adequada para o tipo de conteúdo
      if (!this.isPersonaSuitableForContentType(persona, context.content_type)) {
        continue;
      }

      // Calcular score base
      let score = this.calculateBasePersonaScore(persona, context);

      available.push({ persona, score });
    }

    return available;
  }

  /**
   * Ranqueia personas baseado no contexto
   */
  private async rankPersonasByContext(
    availablePersonas: Array<{ persona: Persona; score: number }>,
    context: PersonaContext
  ): Promise<Array<{ persona: Persona; score: number; reasoning: string }>> {
    const ranked = [];

    for (const item of availablePersonas) {
      const persona = item.persona;
      let score = item.score;

      // Ajustar score baseado no contexto específico
      score += this.calculateContextualScore(persona, context);

      // Análise adicional com IA
      const aiAnalysis = await this.analyzePersonaWithContext(persona, context);
      score += aiAnalysis.score_adjustment;

      ranked.push({
        persona,
        score,
        reasoning: aiAnalysis.reasoning
      });
    }

    return ranked.sort((a, b) => b.score - a.score);
  }

  /**
   * Verifica se persona é adequada para tipo de conteúdo
   */
  private isPersonaSuitableForContentType(persona: Persona, contentType: string): boolean {
    const suitabilityMap: Record<string, string[]> = {
      'interaction': ['mecanico_raiz', 'influenciador_ferramentas', 'tecnico_profissional'],
      'promotion': ['cacador_promocoes', 'especialista_bosch', 'mecanico_raiz'],
      'promotion_premium': ['especialista_bosch', 'tecnico_profissional', 'review_honesto'],
      'video_branding': ['tecnico_profissional', 'especialista_bosch', 'influenciador_ferramentas'],
      'review': ['review_honesto', 'tecnico_profissional', 'especialista_bosch'],
      'tutorial': ['tecnico_profissional', 'mecanico_raiz', 'influenciador_ferramentas'],
      'comparison': ['review_honesto', 'tecnico_profissional', 'especialista_bosch'],
      'short': ['influenciador_ferramentas', 'mecanico_raiz', 'cacador_promocoes'],
      'reel': ['influenciador_ferramentas', 'tecnico_profissional', 'especialista_bosch']
    };

    const suitablePersonas = suitabilityMap[contentType] || [];
    return suitablePersonas.includes(persona.id);
  }

  /**
   * Calcula score base da persona
   */
  private calculateBasePersonaScore(persona: Persona, context: PersonaContext): number {
    let score = 50; // Base score

    // Ajustar baseado no objetivo de performance
    if (context.performance_goal === 'engagement') {
      score += (persona.engagement_patterns.avg_engagement - 70) * 0.5;
    } else if (context.performance_goal === 'conversion') {
      score += (100 - persona.engagement_patterns.spam_risk) * 0.3;
    } else if (context.performance_goal === 'branding') {
      score += persona.id === 'tecnico_profissional' ? 10 : 
                persona.id === 'especialista_bosch' ? 8 : 0;
    }

    // Ajustar baseado no horário
    const currentHour = new Date().getHours();
    if (persona.engagement_patterns.peak_hours.includes(currentHour)) {
      score += 5;
    }

    // Ajustar baseado na saturação
    const saturationScore = this.calculateSaturationScore(persona.id);
    score -= saturationScore * 0.2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcula score contextual
   */
  private calculateContextualScore(persona: Persona, context: PersonaContext): number {
    let score = 0;

    // Tipo de conteúdo
    if (persona.engagement_patterns.preferred_content_types.includes(context.content_type)) {
      score += 10;
    }

    // Categoria do produto
    if (context.product_category) {
      if (persona.id === 'especialista_bosch' && context.product_category.includes('elétricas')) {
        score += 8;
      }
      if (persona.id === 'mecanico_raiz' && context.product_category.includes('manuais')) {
        score += 8;
      }
    }

    // Nível de urgência
    if (context.urgency_level === 'high' && persona.id === 'cacador_promocoes') {
      score += 12;
    }
    if (context.urgency_level === 'low' && persona.id === 'tecnico_profissional') {
      score += 8;
    }

    // Hora do dia
    const timeOfDay = this.getTimeOfDay(new Date().getHours());
    if (timeOfDay === 'morning' && persona.id === 'tecnico_profissional') score += 5;
    if (timeOfDay === 'afternoon' && persona.id === 'review_honesto') score += 5;
    if (timeOfDay === 'evening' && persona.id === 'influenciador_ferramentas') score += 5;

    return score;
  }

  /**
   * Análise da persona com IA
   */
  private async analyzePersonaWithContext(
    persona: Persona,
    context: PersonaContext
  ): Promise<{ score_adjustment: number; reasoning: string }> {
    const prompt =`
Analise esta persona para o contexto atual:

PERSONA: ${persona.name} (${persona.id})
CARACTERÍSTICAS: ${JSON.stringify(persona.characteristics)}
FORÇAS: ${persona.strengths.join(', ')}
IDEAL PARA: ${persona.best_for.join(', ')}

CONTEXTO:
- Tipo de conteúdo: ${context.content_type}
- Público alvo: ${context.target_audience}
- Hora: ${context.time_of_day}
- Categoria: ${context.product_category || 'geral'}
- Urgência: ${context.urgency_level || 'média'}
- Objetivo: ${context.performance_goal || 'engajamento'}

Retorne JSON com análise:
{
  "score_adjustment": -20 a +20,
  "reasoning": "explicação detalhada da escolha",
  "fit_level": "excellent|good|moderate|poor",
  "key_factors": ["fator1", "fator2"]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      const result = JSON.parse(response);
      
      return {
        score_adjustment: result.score_adjustment,
        reasoning: result.reasoning
      };
    } catch (error) {
      console.error('Error analyzing persona with AI:', error);
      return {
        score_adjustment: 0,
        reasoning: 'Análise padrão baseada nas características da persona'
      };
    }
  }

  /**
   * Calcula confiança da seleção
   */
  private calculateSelectionConfidence(
    selectedPersona: { persona: Persona; score: number; reasoning: string },
    context: PersonaContext
  ): number {
    let confidence = 70; // Base confidence

    // Ajustar baseado no score
    confidence += (selectedPersona.score - 50) * 0.3;

    // Ajustar baseado na adequação
    if (this.isPersonaSuitableForContentType(selectedPersona.persona, context.content_type)) {
      confidence += 10;
    }

    // Ajustar baseado na saturação
    const saturationScore = this.calculateSaturationScore(selectedPersona.persona.id);
    confidence -= saturationScore * 0.2;

    // Ajustar baseado no histórico de performance
    const performance = this.getPersonaPerformance(selectedPersona.persona.id);
    if (performance.avg_engagement > 80) {
      confidence += 5;
    }

    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  /**
   * Gera reasoning da seleção
   */
  private async generateSelectionReasoning(
    selectedPersona: { persona: Persona; score: number; reasoning: string },
    context: PersonaContext
  ): Promise<string> {
    if (selectedPersona.reasoning && selectedPersona.reasoning.length > 20) {
      return selectedPersona.reasoning;
    }

    // Gerar reasoning fallback
    const reasons = [];
    
    if (selectedPersona.persona.engagement_patterns.preferred_content_types.includes(context.content_type)) {
      reasons.push(`Ideal para ${context.content_type}`);
    }
    
    if (selectedPersona.persona.strengths.some(s => s.includes('engajamento'))) {
      reasons.push('Alto potencial de engajamento');
    }
    
    if (selectedPersona.score > 70) {
      reasons.push('Score de adequação elevado');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Seleção baseada em análise contextual';
  }

  /**
   * Verifica aviso de saturação
   */
  private checkSaturationWarning(selectedPersona: { persona: Persona; score: number }): boolean {
    const saturationScore = this.calculateSaturationScore(selectedPersona.persona.id);
    const recentUsage = this.getRecentUsage(selectedPersona.persona.id);

    return saturationScore >= 60 || recentUsage.daily >= this.saturationThresholds.max_daily_usage - 1;
  }

  /**
   * Registra uso da persona
   */
  private registerPersonaUsage(personaId: string): void {
    const now = new Date();
    const usage = this.usageHistory.get(personaId) || [];
    
    usage.push(now);
    
    // Manter apenas os últimos 30 dias
    const cutoff = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const filtered = usage.filter(date => date > cutoff);
    
    this.usageHistory.set(personaId, filtered);
    
    // Atualizar persona
    const persona = this.personas.find(p => p.id === personaId);
    if (persona) {
      persona.recent_usage.last_used = now.toISOString();
      persona.recent_usage.usage_count_7days = this.getRecentUsage(personaId).daily;
      persona.recent_usage.saturation_score = this.calculateSaturationScore(personaId);
    }
  }

  /**
   * Calcula score de saturação
   */
  private calculateSaturationScore(personaId: string): number {
    const recentUsage = this.getRecentUsage(personaId);
    
    // Calcular baseado em uso recente
    let score = 0;
    
    // Uso diário (peso 40%)
    score += (recentUsage.daily / this.saturationThresholds.max_daily_usage) * 40;
    
    // Uso semanal (peso 40%)
    score += (recentUsage.weekly / this.saturationThresholds.max_weekly_usage) * 40;
    
    // Uso nas últimas 24h (peso 20%)
    const last24h = this.getUsageInLastHours(personaId, 24);
    score += Math.min(last24h / 3, 1) * 20;

    return Math.min(100, Math.round(score));
  }

  /**
   * Obtém uso recente
   */
  private getRecentUsage(personaId: string): {
    daily: number;
    weekly: number;
    hourly: number;
  } {
    const now = new Date();
    const usage = this.usageHistory.get(personaId) || [];

    const daily = usage.filter(date => 
      date.toDateString() === now.toDateString()
    ).length;

    const weekly = usage.filter(date => {
      const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      return date > weekAgo;
    }).length;

    const hourly = usage.filter(date => {
      const hourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      return date > hourAgo;
    }).length;

    return { daily, weekly, hourly };
  }

  /**
   * Obtém uso nas últimas N horas
   */
  private getUsageInLastHours(personaId: string, hours: number): number {
    const now = new Date();
    const cutoff = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    const usage = this.usageHistory.get(personaId) || [];
    
    return usage.filter(date => date > cutoff).length;
  }

  /**
   * Obtém performance da persona
   */
  private getPersonaPerformance(personaId: string): any {
    return this.performanceData.get(personaId) || {
      avg_engagement: 75,
      avg_ctr: 4.5,
      avg_spam_score: 20,
      total_posts: 0
    };
  }

  /**
   * Reseta scores de saturação
   */
  private resetSaturationScores(): void {
    this.personas.forEach(persona => {
      persona.recent_usage.saturation_score = 0;
      persona.recent_usage.usage_count_7days = 0;
    });
  }

  /**
   * Obtém hora do dia
   */
  private getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Atualiza performance da persona
   */
  updatePersonaPerformance(personaId: string, metrics: {
    engagement: number;
    ctr: number;
    spam_score: number;
  }): void {
    const current = this.getPersonaPerformance(personaId);
    const total = current.total_posts + 1;
    
    const updated = {
      avg_engagement: (current.avg_engagement * current.total_posts + metrics.engagement) / total,
      avg_ctr: (current.avg_ctr * current.total_posts + metrics.ctr) / total,
      avg_spam_score: (current.avg_spam_score * current.total_posts + metrics.spam_score) / total,
      total_posts: total
    };
    
    this.performanceData.set(personaId, updated);
    
    // Atualizar persona
    const persona = this.personas.find(p => p.id === personaId);
    if (persona) {
      persona.engagement_patterns.avg_engagement = Math.round(updated.avg_engagement);
      persona.engagement_patterns.spam_risk = Math.round(updated.avg_spam_score);
    }
  }

  /**
   * Obtém persona por ID
   */
  getPersonaById(personaId: string): Persona | undefined {
    return this.personas.find(p => p.id === personaId);
  }

  /**
   * Obtém todas as personas
   */
  getAllPersonas(): Persona[] {
    return this.personas;
  }

  /**
   * Obtém personas disponíveis
   */
  getAvailablePersonas(context?: PersonaContext): Persona[] {
    if (!context) {
      return this.personas.filter(p => 
        this.calculateSaturationScore(p.id) < this.saturationThresholds.saturation_score_limit
      );
    }

    const available = this.filterAvailablePersonas(context);
    return available.map(a => a.persona);
  }

  /**
   * Obtém estatísticas de uso
   */
  getUsageStats(): {
    total_usage: number;
    most_used: string;
    least_used: string;
    saturation_levels: Record<string, number>;
    performance_comparison: Record<string, any>;
  } {
    const totalUsage = Array.from(this.usageHistory.values())
      .reduce((sum, usage) => sum + usage.length, 0);

    const usageCounts = Array.from(this.usageHistory.entries())
      .map(([id, usage]) => ({ id, count: usage.length }))
      .sort((a, b) => b.count - a.count);

    const mostUsed = usageCounts[0]?.id || '';
    const leastUsed = usageCounts[usageCounts.length - 1]?.id || '';

    const saturationLevels: Record<string, number> = {};
    this.personas.forEach(persona => {
      saturationLevels[persona.id] = persona.recent_usage.saturation_score;
    });

    const performanceComparison: Record<string, any> = {};
    this.personas.forEach(persona => {
      performanceComparison[persona.id] = this.getPersonaPerformance(persona.id);
    });

    return {
      total_usage: totalUsage,
      most_used: mostUsed,
      least_used: leastUsed,
      saturation_levels: saturationLevels,
      performance_comparison: performanceComparison
    };
  }

  /**
   * Força reset de saturação de persona específica
   */
  forceResetPersonaSaturation(personaId: string): void {
    const persona = this.personas.find(p => p.id === personaId);
    if (persona) {
      persona.recent_usage.saturation_score = 0;
      persona.recent_usage.usage_count_7days = 0;
      persona.recent_usage.last_used = '';
    }
  }

  /**
   * Exporta dados do selector
   */
  exportSelectorData(): {
    personas: Persona[];
    usageHistory: Map<string, Date[]>;
    performanceData: Map<string, any>;
    thresholds: typeof this.saturationThresholds;
  } {
    return {
      personas: this.personas,
      usageHistory: this.usageHistory,
      performanceData: this.performanceData,
      thresholds: this.saturationThresholds
    };
  }
}
