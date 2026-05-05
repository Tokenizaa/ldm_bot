import { OllamaService } from '../social-ai/ollama/ollama.service';

export interface FrequencyRule {
  id: string;
  type: 'daily_limit' | 'hourly_limit' | 'weekly_limit' | 'group_cooldown';
  condition: string;
  limit: number;
  current_usage: number;
  reset_period: 'hourly' | 'daily' | 'weekly';
  last_reset: string;
  priority: number;
  active: boolean;
}

export interface FrequencyMetrics {
  posts_today: number;
  posts_this_hour: number;
  posts_this_week: number;
  average_daily: number;
  peak_hour: number;
  frequency_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface PostingWindow {
  start_hour: number;
  end_hour: number;
  optimal_hours: number[];
  avoid_hours: number[];
  max_posts_per_window: number;
  current_posts_in_window: number;
  window_efficiency: number;
}

export class FrequencyController {
  private ollamaService: OllamaService;
  private frequencyRules: FrequencyRule[];
  private postingHistory: Array<{
    timestamp: string;
    hour: number;
    day: number;
    week: number;
    type: string;
    persona: string;
    group: string;
  }>;
  private postingWindows: PostingWindow[];
  private adaptiveLimits: Map<string, number>;

  constructor() {
    this.ollamaService = new OllamaService();
    this.frequencyRules = [];
    this.postingHistory = [];
    this.postingWindows = [];
    this.adaptiveLimits = new Map();
    this.initializeFrequencyRules();
    this.initializePostingWindows();
  }

  /**
   * Inicializa regras de frequência base
   */
  private initializeFrequencyRules(): void {
    const baseRules = [
      {
        id: 'daily_limit_conservative',
        type: 'daily_limit' as const,
        condition: 'strategy = "conservative"',
        limit: 3,
        current_usage: 0,
        reset_period: 'daily' as const,
        last_reset: new Date().toISOString(),
        priority: 10,
        active: true
      },
      {
        id: 'daily_limit_balanced',
        type: 'daily_limit' as const,
        condition: 'strategy = "balanced"',
        limit: 5,
        current_usage: 0,
        reset_period: 'daily' as const,
        last_reset: new Date().toISOString(),
        priority: 9,
        active: true
      },
      {
        id: 'daily_limit_aggressive',
        type: 'daily_limit' as const,
        condition: 'strategy = "aggressive"',
        limit: 8,
        current_usage: 0,
        reset_period: 'daily' as const,
        last_reset: new Date().toISOString(),
        priority: 8,
        active: true
      },
      {
        id: 'hourly_limit_general',
        type: 'hourly_limit' as const,
        condition: 'always',
        limit: 2,
        current_usage: 0,
        reset_period: 'hourly' as const,
        last_reset: new Date().toISOString(),
        priority: 10,
        active: true
      },
      {
        id: 'hourly_limit_peak',
        type: 'hourly_limit' as const,
        condition: 'hour BETWEEN 10 AND 18',
        limit: 3,
        current_usage: 0,
        reset_period: 'hourly' as const,
        last_reset: new Date().toISOString(),
        priority: 9,
        active: true
      },
      {
        id: 'weekly_limit_total',
        type: 'weekly_limit' as const,
        condition: 'always',
        limit: 35,
        current_usage: 0,
        reset_period: 'weekly' as const,
        last_reset: this.getWeekStart().toISOString(),
        priority: 7,
        active: true
      },
      {
        id: 'group_cooldown_standard',
        type: 'group_cooldown' as const,
        condition: 'group_type = "standard"',
        limit: 30, // minutos
        current_usage: 0,
        reset_period: 'hourly' as const,
        last_reset: new Date().toISOString(),
        priority: 8,
        active: true
      },
      {
        id: 'group_cooldown_premium',
        type: 'group_cooldown' as const,
        condition: 'group_type = "premium"',
        limit: 15, // minutos
        current_usage: 0,
        reset_period: 'hourly' as const,
        last_reset: new Date().toISOString(),
        priority: 7,
        active: true
      }
    ];

    this.frequencyRules = baseRules;
  }

  /**
   * Inicializa janelas de postagem
   */
  private initializePostingWindows(): void {
    this.postingWindows = [
      {
        start_hour: 6,
        end_hour: 9,
        optimal_hours: [8, 9],
        avoid_hours: [6],
        max_posts_per_window: 1,
        current_posts_in_window: 0,
        window_efficiency: 0.7
      },
      {
        start_hour: 10,
        end_hour: 12,
        optimal_hours: [10, 11],
        avoid_hours: [],
        max_posts_per_window: 2,
        current_posts_in_window: 0,
        window_efficiency: 0.9
      },
      {
        start_hour: 13,
        end_hour: 15,
        optimal_hours: [14],
        avoid_hours: [13],
        max_posts_per_window: 1,
        current_posts_in_window: 0,
        window_efficiency: 0.6
      },
      {
        start_hour: 16,
        end_hour: 18,
        optimal_hours: [16, 17],
        avoid_hours: [],
        max_posts_per_window: 2,
        current_posts_in_window: 0,
        window_efficiency: 0.85
      },
      {
        start_hour: 19,
        end_hour: 21,
        optimal_hours: [20],
        avoid_hours: [19],
        max_posts_per_window: 1,
        current_posts_in_window: 0,
        window_efficiency: 0.8
      },
      {
        start_hour: 22,
        end_hour: 23,
        optimal_hours: [],
        avoid_hours: [22, 23],
        max_posts_per_window: 0,
        current_posts_in_window: 0,
        window_efficiency: 0.3
      }
    ];
  }

  /**
   * Verifica se pode postar agora
   */
  async canPostNow(context: {
    strategy: string;
    current_hour: number;
    group_type?: string;
    persona?: string;
    content_type?: string;
  }): Promise<{
    can_post: boolean;
    reason?: string;
    next_available_time?: string;
    recommendations: string[];
    risk_level: 'low' | 'medium' | 'high' | 'critical';
  }> {
    // Resetar contadores se necessário
    this.resetCountersIfNeeded();

    // Verificar todas as regras ativas
    const activeRules = this.getActiveRules(context);
    const violations = [];

    for (const rule of activeRules) {
      if (rule.current_usage >= rule.limit) {
        violations.push({
          rule: rule.id,
          type: rule.type,
          limit: rule.limit,
          current: rule.current_usage,
          reset_time: this.getNextResetTime(rule)
        });
      }
    }

    // Verificar janelas de postagem
    const windowCheck = this.checkPostingWindow(context.current_hour);
    
    // Verificar cooldown de grupos
    const groupCooldown = await this.checkGroupCooldown(context);

    // Calcular risco geral
    const riskLevel = this.calculateRiskLevel(violations, windowCheck, groupCooldown);

    // Gerar recomendações
    const recommendations = await this.generateRecommendations(context, violations, riskLevel);

    if (violations.length > 0 || !windowCheck.can_post || groupCooldown.cooldown_active) {
      const reasons = [];
      if (violations.length > 0) {
        reasons.push(`Limite de frequência excedido: ${violations[0].type}`);
      }
      if (!windowCheck.can_post) {
        reasons.push('Fora da janela de postagem ideal');
      }
      if (groupCooldown.cooldown_active) {
        reasons.push('Grupo em cooldown');
      }

      return {
        can_post: false,
        reason: reasons.join(' | '),
        next_available_time: this.getNextAvailableTime(violations, windowCheck, groupCooldown),
        recommendations,
        risk_level
      };
    }

    return {
      can_post: true,
      recommendations,
      risk_level
    };
  }

  /**
   * Registra um post para controle de frequência
   */
  registerPost(postData: {
    timestamp: string;
    type: string;
    persona: string;
    group: string;
    group_type?: string;
    strategy?: string;
  }): void {
    const now = new Date(postData.timestamp);
    const hour = now.getHours();
    const day = now.getDay();
    const week = this.getWeekNumber(now);

    // Adicionar ao histórico
    this.postingHistory.push({
      timestamp: postData.timestamp,
      hour,
      day,
      week,
      type: postData.type,
      persona: postData.persona,
      group: postData.group
    });

    // Manter apenas os últimos 1000 registros
    if (this.postingHistory.length > 1000) {
      this.postingHistory = this.postingHistory.slice(-1000);
    }

    // Atualizar contadores de regras
    this.updateRuleCounters(postData);

    // Atualizar janelas de postagem
    this.updatePostingWindows(hour);

    // Ajustar limites adaptativos
    this.adjustAdaptiveLimits(postData);
  }

  /**
   * Obtém métricas atuais de frequência
   */
  getCurrentMetrics(): FrequencyMetrics {
    const now = new Date();
    const today = now.toDateString();
    const currentHour = now.getHours();
    const currentWeek = this.getWeekNumber(now);

    const postsToday = this.postingHistory.filter(p => 
      new Date(p.timestamp).toDateString() === today
    ).length;

    const postsThisHour = this.postingHistory.filter(p => 
      new Date(p.timestamp).getHours() === currentHour &&
      new Date(p.timestamp).toDateString() === today
    ).length;

    const postsThisWeek = this.postingHistory.filter(p => 
      p.week === currentWeek
    ).length;

    const averageDaily = this.calculateAverageDaily();

    const peakHour = this.calculatePeakHour();

    const frequencyScore = this.calculateFrequencyScore(postsToday, postsThisHour, postsThisWeek);

    const riskLevel = this.calculateRiskLevel([], { can_post: true }, { cooldown_active: false });

    const recommendations = this.generateFrequencyRecommendations(postsToday, postsThisHour, frequencyScore);

    return {
      posts_today: postsToday,
      posts_this_hour: postsThisHour,
      posts_this_week: postsThisWeek,
      average_daily: averageDaily,
      peak_hour: peakHour,
      frequency_score: frequencyScore,
      risk_level,
      recommendations
    };
  }

  /**
   * Ajusta limites de forma adaptativa baseada na performance
   */
  async adjustLimitsAdaptively(performanceData: {
    recent_ctr: number;
    recent_engagement: number;
    recent_spam_score: number;
    audience_fatigue: number;
  }): Promise<{
    adjustments: Array<{
      rule_id: string;
      old_limit: number;
      new_limit: number;
      reason: string;
      confidence: number;
    }>;
    overall_strategy: 'increase' | 'decrease' | 'maintain';
  }> {
    const adjustments = [];
    let overallStrategy: 'increase' | 'decrease' | 'maintain' = 'maintain';

    // Analisar performance para determinar estratégia
    if (performanceData.recent_ctr > 5 && performanceData.recent_spam_score < 30) {
      overallStrategy = 'increase';
    } else if (performanceData.recent_spam_score > 60 || performanceData.audience_fatigue > 70) {
      overallStrategy = 'decrease';
    }

    // Ajustar regras baseado na estratégia
    for (const rule of this.frequencyRules) {
      if (rule.type === 'daily_limit') {
        const adjustment = this.calculateRuleAdjustment(rule, performanceData, overallStrategy);
        if (adjustment.should_adjust) {
          adjustments.push({
            rule_id: rule.id,
            old_limit: rule.limit,
            new_limit: adjustment.new_limit,
            reason: adjustment.reason,
            confidence: adjustment.confidence
          });
          rule.limit = adjustment.new_limit;
        }
      }
    }

    return { adjustments, overall_strategy };
  }

  /**
   * Prediz capacidade de postagem para as próximas horas
   */
  predictPostingCapacity(hoursAhead: number = 24): Array<{
    hour: number;
    can_post: boolean;
    confidence: number;
    recommended_posts: number;
    risk_level: string;
  }> {
    const predictions = [];
    const now = new Date();

    for (let i = 1; i <= hoursAhead; i++) {
      const futureHour = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = futureHour.getHours();
      
      const window = this.postingWindows.find(w => 
        hour >= w.start_hour && hour <= w.end_hour
      );

      const predictedUsage = this.predictHourlyUsage(hour);
      const capacity = window ? window.max_posts_per_window : 0;
      const available = capacity - predictedUsage;

      predictions.push({
        hour,
        can_post: available > 0,
        confidence: window ? window.window_efficiency : 0.3,
        recommended_posts: Math.max(0, available),
        risk_level: this.predictHourRisk(hour, predictedUsage, capacity)
      });
    }

    return predictions;
  }

  /**
   * Gera relatório de frequência
   */
  async generateFrequencyReport(): Promise<any> {
    const metrics = this.getCurrentMetrics();
    const recentHistory = this.postingHistory.slice(-50);
    const capacity = this.predictPostingCapacity(24);

    const prompt =`
Baseado nos dados de frequência:

MÉTRICAS ATUAIS: ${JSON.stringify(metrics, null, 2)}
HISTÓRICO RECENTE: ${JSON.stringify(recentHistory.slice(-10), null, 2)}
CAPACIDADE PREVISTA: ${JSON.stringify(capacity.slice(0, 12), null, 2)}

Gere relatório de frequência em JSON:
{
  "executive_summary": "resumo executivo",
  "key_metrics": {
    "current_frequency_score": ${metrics.frequency_score},
    "posts_today": ${metrics.posts_today},
    "risk_level": "${metrics.risk_level}",
    "efficiency": "percentual"
  },
  "patterns": {
    "peak_hours": [hora1, hora2],
    "optimal_windows": ["janela1", "janela2"],
    "avoid_periods": ["período1", "período2"]
  },
  "recommendations": ["rec1", "rec2", "rec3"],
  "optimization_opportunities": ["oportunidade1", "oportunidade2"],
  "next_24h_capacity": "capacidade prevista"
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating frequency report:', error);
      return {
        executive_summary: 'Relatório de controle de frequência',
        key_metrics: metrics,
        patterns: {},
        recommendations: [],
        optimization_opportunities: [],
        next_24h_capacity: 'Desconhecido'
      };
    }
  }

  // Métodos privados

  private resetCountersIfNeeded(): void {
    const now = new Date();
    
    this.frequencyRules.forEach(rule => {
      const lastReset = new Date(rule.last_reset);
      let shouldReset = false;

      switch (rule.reset_period) {
        case 'hourly':
          shouldReset = now.getHours() !== lastReset.getHours() || 
                        now.getDate() !== lastReset.getDate();
          break;
        case 'daily':
          shouldReset = now.toDateString() !== lastReset.toDateString();
          break;
        case 'weekly':
          shouldReset = this.getWeekNumber(now) !== this.getWeekNumber(lastReset);
          break;
      }

      if (shouldReset) {
        rule.current_usage = 0;
        rule.last_reset = now.toISOString();
      }
    });
  }

  private getActiveRules(context: any): FrequencyRule[] {
    return this.frequencyRules.filter(rule => {
      if (!rule.active) return false;
      
      // Lógica simples de condição (pode ser expandida)
      if (rule.condition === 'always') return true;
      if (rule.condition.includes('strategy') && context.strategy) {
        return rule.condition.includes(context.strategy);
      }
      if (rule.condition.includes('hour') && context.current_hour !== undefined) {
        // Implementar lógica de range de horas
        return true; // Simplificado
      }
      
      return false;
    });
  }

  private checkPostingWindow(currentHour: number): { can_post: boolean; efficiency: number } {
    const window = this.postingWindows.find(w => 
      currentHour >= w.start_hour && currentHour <= w.end_hour
    );

    if (!window) {
      return { can_post: false, efficiency: 0.1 };
    }

    if (window.avoid_hours.includes(currentHour)) {
      return { can_post: false, efficiency: 0.2 };
    }

    if (window.current_posts_in_window >= window.max_posts_per_window) {
      return { can_post: false, efficiency: 0.3 };
    }

    const efficiency = window.optimal_hours.includes(currentHour) ? 
      window.window_efficiency : window.window_efficiency * 0.7;

    return { can_post: true, efficiency };
  }

  private async checkGroupCooldown(context: any): Promise<{ cooldown_active: boolean; remaining_minutes?: number }> {
    // Implementar verificação de cooldown de grupos
    // Por enquanto, retorna sempre false (sem cooldown)
    return { cooldown_active: false };
  }

  private calculateRiskLevel(
    violations: any[], 
    windowCheck: any, 
    groupCooldown: any
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (violations.length > 2) return 'critical';
    if (violations.length > 0 || !windowCheck.can_post) return 'high';
    if (groupCooldown.cooldown_active) return 'medium';
    return 'low';
  }

  private async generateRecommendations(
    context: any, 
    violations: any[], 
    riskLevel: string
  ): Promise<string[]> {
    const recommendations = [];

    if (riskLevel === 'critical') {
      recommendations.push('Reduza drasticamente a frequência de postagem');
      recommendations.push('Aguarde pelo menos 2 horas antes do próximo post');
    } else if (riskLevel === 'high') {
      recommendations.push('Considere reduzir a frequência para evitar spam');
      recommendations.push('Foque em conteúdo de engajamento');
    } else if (riskLevel === 'medium') {
      recommendations.push('Mantenha frequência atual com monitoramento');
    } else {
      recommendations.push('Frequência ideal para crescimento');
    }

    return recommendations;
  }

  private getNextResetTime(rule: FrequencyRule): string {
    const now = new Date();
    let nextReset = new Date(now);

    switch (rule.reset_period) {
      case 'hourly':
        nextReset.setHours(nextReset.getHours() + 1);
        nextReset.setMinutes(0, 0, 0);
        break;
      case 'daily':
        nextReset.setDate(nextReset.getDate() + 1);
        nextReset.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        const daysUntilNextWeek = 7 - now.getDay() + 1;
        nextReset.setDate(nextReset.getDate() + daysUntilNextWeek);
        nextReset.setHours(0, 0, 0, 0);
        break;
    }

    return nextReset.toISOString();
  }

  private getNextAvailableTime(
    violations: any[], 
    windowCheck: any, 
    groupCooldown: any
  ): string {
    const now = new Date();
    let nextAvailable = new Date(now);

    // Adicionar tempo baseado nas violações
    if (violations.length > 0) {
      const violation = violations[0];
      const resetTime = new Date(this.getNextResetTime(violation.rule));
      nextAvailable = new Date(Math.max(nextAvailable.getTime(), resetTime.getTime()));
    }

    // Adicionar tempo se fora da janela
    if (!windowCheck.can_post) {
      nextAvailable.setHours(nextAvailable.getHours() + 1);
    }

    return nextAvailable.toISOString();
  }

  private updateRuleCounters(postData: any): void {
    this.frequencyRules.forEach(rule => {
      if (this.shouldApplyRule(rule, postData)) {
        rule.current_usage++;
      }
    });
  }

  private shouldApplyRule(rule: FrequencyRule, postData: any): boolean {
    // Lógica simples para aplicar regra ao post
    if (rule.type === 'daily_limit') return true;
    if (rule.type === 'hourly_limit') return true;
    if (rule.type === 'weekly_limit') return true;
    return false;
  }

  private updatePostingWindows(hour: number): void {
    this.postingWindows.forEach(window => {
      if (hour >= window.start_hour && hour <= window.end_hour) {
        window.current_posts_in_window++;
      } else if (hour === window.end_hour + 1) {
        // Reset no final da janela
        window.current_posts_in_window = 0;
      }
    });
  }

  private adjustAdaptiveLimits(postData: any): void {
    // Implementar lógica de ajuste adaptativo
    // Baseado na performance recente do post
  }

  private calculateAverageDaily(): number {
    if (this.postingHistory.length < 7) return 0;
    
    const lastWeek = this.postingHistory.slice(-7);
    const daysCounted = new Set(lastWeek.map(p => new Date(p.timestamp).toDateString()));
    
    return Math.round(lastWeek.length / daysCounted.size);
  }

  private calculatePeakHour(): number {
    if (this.postingHistory.length === 0) return 12;

    const hourCounts = this.postingHistory.reduce((acc, post) => {
      const hour = post.hour;
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  private calculateFrequencyScore(
    postsToday: number, 
    postsThisHour: number, 
    postsThisWeek: number
  ): number {
    let score = 100;

    // Penalizar excesso diário
    if (postsToday > 8) score -= 30;
    else if (postsToday > 5) score -= 15;

    // Penalizar excesso horário
    if (postsThisHour > 3) score -= 25;
    else if (postsThisHour > 2) score -= 10;

    // Bonus por consistência semanal
    if (postsThisWeek >= 20 && postsThisWeek <= 35) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private generateFrequencyRecommendations(
    postsToday: number, 
    postsThisHour: number, 
    frequencyScore: number
  ): string[] {
    const recommendations = [];

    if (frequencyScore < 50) {
      recommendations.push('Alta frequência detectada - considere reduzir');
    } else if (frequencyScore > 80) {
      recommendations.push('Frequência ideal - mantenha o ritmo');
    }

    if (postsThisHour >= 2) {
      recommendations.push('Aguarde antes de postar novamente nesta hora');
    }

    return recommendations;
  }

  private calculateRuleAdjustment(
    rule: FrequencyRule, 
    performanceData: any, 
    strategy: 'increase' | 'decrease' | 'maintain'
  ): any {
    if (strategy === 'maintain') {
      return { should_adjust: false };
    }

    const adjustment = Math.round(rule.limit * (strategy === 'increase' ? 0.2 : -0.2));
    const newLimit = Math.max(1, rule.limit + adjustment);

    return {
      should_adjust: true,
      new_limit,
      reason: strategy === 'increase' ? 'Performance boa permite aumento' : 'Performance ruim requer redução',
      confidence: 75
    };
  }

  private predictHourlyUsage(hour: number): number {
    // Predição simples baseada no histórico
    const hourHistory = this.postingHistory.filter(p => p.hour === hour);
    return hourHistory.length > 0 ? hourHistory.length / Math.min(7, this.postingHistory.length) : 0;
  }

  private predictHourRisk(hour: number, predictedUsage: number, capacity: number): string {
    const utilization = capacity > 0 ? predictedUsage / capacity : 0;
    
    if (utilization > 0.8) return 'high';
    if (utilization > 0.5) return 'medium';
    return 'low';
  }

  private getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Exporta dados de frequência
   */
  exportFrequencyData(): {
    rules: FrequencyRule[];
    history: any[];
    windows: PostingWindow[];
    adaptiveLimits: Map<string, number>;
  } {
    return {
      rules: this.frequencyRules,
      history: this.postingHistory,
      windows: this.postingWindows,
      adaptiveLimits: this.adaptiveLimits
    };
  }
}
