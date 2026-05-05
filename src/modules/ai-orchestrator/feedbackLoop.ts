import { OllamaService } from '../social-ai/ollama/ollama.service';
import { PerformanceMetrics } from './performanceLearner';

export interface FeedbackData {
  post_id: string;
  predicted_performance: {
    engagement: number;
    ctr: number;
    spam_risk: number;
  };
  actual_performance: {
    engagement: number;
    ctr: number;
    spam_risk: number;
    reach: number;
    conversions: number;
  };
  content_metadata: {
    type: string;
    persona: string;
    category: string;
    posting_hour: number;
    content_length: number;
    has_images: boolean;
    has_video: boolean;
    cta_type: string;
  };
  feedback_timestamp: string;
  accuracy_score: number;
}

export interface OptimizationFeedback {
  type: 'timing' | 'persona' | 'content' | 'frequency' | 'format';
  original_strategy: string;
  performance_gap: number;
  recommended_adjustment: string;
  expected_improvement: number;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export interface LearningCycle {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  posts_analyzed: number;
  accuracy_improvement: number;
  key_learnings: string[];
  optimizations_applied: string[];
  next_cycle_recommendations: string[];
  success_rate: number;
}

export class FeedbackLoop {
  private ollamaService: OllamaService;
  private feedbackHistory: FeedbackData[];
  private optimizationFeedback: OptimizationFeedback[];
  private learningCycles: LearningCycle[];
  private currentCycle: LearningCycle | null;
  private feedbackThresholds: {
    accuracy_min: number;
    performance_gap_min: number;
    confidence_min: number;
  };

  constructor() {
    this.ollamaService = new OllamaService();
    this.feedbackHistory = [];
    this.optimizationFeedback = [];
    this.learningCycles = [];
    this.currentCycle = null;
    this.feedbackThresholds = {
      accuracy_min: 70,
      performance_gap_min: 20,
      confidence_min: 75
    };
    this.initializeLearningCycle();
  }

  /**
   * Inicializa ciclo de aprendizado
   */
  private initializeLearningCycle(): void {
    this.currentCycle = {
      id: `cycle_${Date.now()}`,
      cycle_number: this.learningCycles.length + 1,
      start_date: new Date().toISOString(),
      end_date: '',
      posts_analyzed: 0,
      accuracy_improvement: 0,
      key_learnings: [],
      optimizations_applied: [],
      next_cycle_recommendations: [],
      success_rate: 0
    };
  }

  /**
   * Coleta feedback de performance real vs predita
   */
  async collectFeedback(
    postId: string,
    predictedPerformance: any,
    actualPerformance: any,
    contentMetadata: any
  ): Promise<void> {
    const accuracyScore = this.calculateAccuracyScore(predictedPerformance, actualPerformance);
    
    const feedbackData: FeedbackData = {
      post_id: postId,
      predicted_performance: predictedPerformance,
      actual_performance: actualPerformance,
      content_metadata: contentMetadata,
      feedback_timestamp: new Date().toISOString(),
      accuracy_score: accuracyScore
    };

    this.feedbackHistory.push(feedbackData);
    
    // Manter apenas os últimos 500 feedbacks
    if (this.feedbackHistory.length > 500) {
      this.feedbackHistory = this.feedbackHistory.slice(-500);
    }

    // Atualizar ciclo atual
    if (this.currentCycle) {
      this.currentCycle.posts_analyzed++;
    }

    // Gerar feedback de otimização se necessário
    await this.generateOptimizationFeedback(feedbackData);
    
    // Verificar se precisa fechar ciclo
    await this.checkCycleCompletion();
  }

  /**
   * Calcula score de acurácia entre predição e realidade
   */
  private calculateAccuracyScore(predicted: any, actual: any): number {
    const engagementAccuracy = 100 - Math.abs(predicted.engagement - actual.engagement);
    const ctrAccuracy = 100 - Math.abs(predicted.ctr - actual.ctr);
    const spamAccuracy = 100 - Math.abs(predicted.spam_risk - actual.spam_risk);
    
    return Math.round((engagementAccuracy + ctrAccuracy + spamAccuracy) / 3);
  }

  /**
   * Gera feedback de otimização baseado no desempenho
   */
  private async generateOptimizationFeedback(feedback: FeedbackData): Promise<void> {
    const performanceGap = Math.abs(
      feedback.predicted_performance.engagement - feedback.actual_performance.engagement
    );

    // Apenas gerar feedback se a gap for significativa
    if (performanceGap < this.feedbackThresholds.performance_gap_min) return;

    const feedbackType = this.determineFeedbackType(feedback, performanceGap);
    
    const prompt =`
Baseado neste feedback de performance:

PREDICTED: ${JSON.stringify(feedback.predicted_performance)}
ACTUAL: ${JSON.stringify(feedback.actual_performance)}
GAP: ${performanceGap.toFixed(1)}
CONTENT TYPE: ${feedback.content_metadata.type}
PERSONA: ${feedback.content_metadata.persona}
HOUR: ${feedback.content_metadata.posting_hour}

Gere feedback de otimização em JSON:
{
  "type": "${feedbackType}",
  "original_strategy": "estratégia original usada",
  "performance_gap": ${performanceGap},
  "recommended_adjustment": "ajuste recomendado específico",
  "expected_improvement": 0-100,
  "confidence": 0-100,
  "priority": "low|medium|high|critical",
  "reasoning": "explicação detalhada"
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      const result = JSON.parse(response);

      const optimizationFeedback: OptimizationFeedback = {
        type: result.type,
        original_strategy: result.original_strategy,
        performance_gap: performanceGap,
        recommended_adjustment: result.recommended_adjustment,
        expected_improvement: result.expected_improvement,
        confidence: result.confidence,
        priority: result.priority,
        created_at: new Date().toISOString()
      };

      this.optimizationFeedback.push(optimizationFeedback);
      
      // Manter apenas os 100 feedbacks mais recentes
      if (this.optimizationFeedback.length > 100) {
        this.optimizationFeedback = this.optimizationFeedback.slice(-100);
      }
    } catch (error) {
      console.error('Error generating optimization feedback:', error);
    }
  }

  /**
   * Determina tipo de feedback baseado no desempenho
   */
  private determineFeedbackType(feedback: FeedbackData, gap: number): 'timing' | 'persona' | 'content' | 'frequency' | 'format' {
    const { actual_performance, content_metadata } = feedback;
    
    // Se CTR baixo, pode ser problema de conteúdo ou CTA
    if (actual_performance.ctr < 2) {
      return 'content';
    }
    
    // Se engagement baixo em horário específico, pode ser timing
    if (actual_performance.engagement < 50 && (content_metadata.posting_hour < 8 || content_metadata.posting_hour > 22)) {
      return 'timing';
    }
    
    // Se spam risk alto, pode ser frequência ou formato
    if (actual_performance.spam_risk > 60) {
      return 'frequency';
    }
    
    // Problema geral de persona
    return 'persona';
  }

  /**
   * Verifica se o ciclo de aprendizado deve ser fechado
   */
  private async checkCycleCompletion(): Promise<void> {
    if (!this.currentCycle) return;

    const cycleDuration = Date.now() - new Date(this.currentCycle.start_date).getTime();
    const daysInCycle = cycleDuration / (1000 * 60 * 60 * 24);

    // Fechar ciclo após 7 dias ou 50 posts analisados
    if (daysInCycle >= 7 || this.currentCycle.posts_analyzed >= 50) {
      await this.closeLearningCycle();
    }
  }

  /**
   * Fecha ciclo de aprendizado e gera relatório
   */
  private async closeLearningCycle(): Promise<void> {
    if (!this.currentCycle) return;

    const cycleFeedbacks = this.feedbackHistory.filter(f => 
      new Date(f.feedback_timestamp) >= new Date(this.currentCycle!.start_date)
    );

    // Calcular métricas do ciclo
    const avgAccuracy = cycleFeedbacks.reduce((sum, f) => sum + f.accuracy_score, 0) / cycleFeedbacks.length;
    
    // Gerar key learnings
    const keyLearnings = await this.generateKeyLearnings(cycleFeedbacks);
    
    // Identificar otimizações aplicadas
    const optimizationsApplied = this.optimizationFeedback
      .filter(f => new Date(f.created_at) >= new Date(this.currentCycle!.start_date))
      .map(f => `${f.type}: ${f.recommended_adjustment}`);

    // Gerar recomendações para próximo ciclo
    const nextCycleRecommendations = await this.generateNextCycleRecommendations(cycleFeedbacks);

    // Finalizar ciclo
    this.currentCycle.end_date = new Date().toISOString();
    this.currentCycle.accuracy_improvement = avgAccuracy;
    this.currentCycle.key_learnings = keyLearnings;
    this.currentCycle.optimizations_applied = optimizationsApplied;
    this.currentCycle.next_cycle_recommendations = nextCycleRecommendations;
    this.currentCycle.success_rate = this.calculateCycleSuccessRate(cycleFeedbacks);

    this.learningCycles.push(this.currentCycle);
    
    // Iniciar novo ciclo
    this.initializeLearningCycle();
  }

  /**
   * Gera key learnings do ciclo
   */
  private async generateKeyLearnings(feedbacks: FeedbackData[]): Promise<string[]> {
    const prompt =`
Baseado nos feedbacks deste ciclo de aprendizado:

FEEDBACKS: ${JSON.stringify(feedbacks.slice(-20), null, 2)}

Gere os principais aprendizados em JSON array:
{
  "key_learnings": [
    "aprendizado1 sobre timing",
    "aprendizado2 sobre personas",
    "aprendizado3 sobre conteúdo",
    "aprendizado4 sobre otimização"
  ]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      const result = JSON.parse(response);
      return result.key_learnings || [];
    } catch (error) {
      console.error('Error generating key learnings:', error);
      return [];
    }
  }

  /**
   * Gera recomendações para próximo ciclo
   */
  private async generateNextCycleRecommendations(feedbacks: FeedbackData[]): Promise<string[]> {
    const prompt =`
Baseado na performance dos feedbacks, gere recomendações para o próximo ciclo:

FEEDBACKS: ${JSON.stringify(feedbacks.slice(-15), null, 2)}

Retorne JSON com recomendações:
{
  "recommendations": [
    "recomendação1 específica",
    "recomendação2 para timing",
    "recomendação3 para conteúdo",
    "recomendação4 para personas"
  ]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      const result = JSON.parse(response);
      return result.recommendations || [];
    } catch (error) {
      console.error('Error generating next cycle recommendations:', error);
      return [];
    }
  }

  /**
   * Calcula taxa de sucesso do ciclo
   */
  private calculateCycleSuccessRate(feedbacks: FeedbackData[]): number {
    if (feedbacks.length === 0) return 0;
    
    const successfulFeedbacks = feedbacks.filter(f => 
      f.accuracy_score >= this.feedbackThresholds.accuracy_min
    );
    
    return Math.round((successfulFeedbacks.length / feedbacks.length) * 100);
  }

  /**
   * Aplica otimizações baseadas no feedback
   */
  async applyOptimizations(): Promise<{
    applied: string[];
    skipped: string[];
    results: any[];
  }> {
    const recentFeedback = this.optimizationFeedback
      .filter(f => f.confidence >= this.feedbackThresholds.confidence_min)
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    const applied: string[] = [];
    const skipped: string[] = [];
    const results: any[] = [];

    for (const feedback of recentFeedback.slice(0, 5)) { // Limitar a 5 otimizações por ciclo
      try {
        const result = await this.executeOptimization(feedback);
        if (result.success) {
          applied.push(`${feedback.type}: ${feedback.recommended_adjustment}`);
          results.push(result);
        } else {
          skipped.push(`${feedback.type}: ${feedback.recommended_adjustment} - ${result.reason}`);
        }
      } catch (error) {
        skipped.push(`${feedback.type}: ${feedback.recommended_adjustment} - Erro na execução`);
      }
    }

    return { applied, skipped, results };
  }

  /**
   * Executa otimização específica
   */
  private async executeOptimization(feedback: OptimizationFeedback): Promise<{
    success: boolean;
    result: any;
    reason?: string;
  }> {
    switch (feedback.type) {
      case 'timing':
        return this.executeTimingOptimization(feedback);
      case 'persona':
        return this.executePersonaOptimization(feedback);
      case 'content':
        return this.executeContentOptimization(feedback);
      case 'frequency':
        return this.executeFrequencyOptimization(feedback);
      case 'format':
        return this.executeFormatOptimization(feedback);
      default:
        return { success: false, result: null, reason: 'Tipo de otimização desconhecido' };
    }
  }

  /**
   * Executa otimização de timing
   */
  private async executeTimingOptimization(feedback: OptimizationFeedback): Promise<any> {
    // Aqui implementaria a lógica para ajustar horários de postagem
    // Por exemplo: ajustar preferências de horário no scheduler
    
    return {
      success: true,
      result: {
        action: 'timing_adjustment',
        adjustment: feedback.recommended_adjustment,
        expected_improvement: feedback.expected_improvement
      }
    };
  }

  /**
   * Executa otimização de persona
   */
  private async executePersonaOptimization(feedback: OptimizationFeedback): Promise<any> {
    // Ajustar pesos de personas no content mixer
    
    return {
      success: true,
      result: {
        action: 'persona_weight_adjustment',
        adjustment: feedback.recommended_adjustment,
        expected_improvement: feedback.expected_improvement
      }
    };
  }

  /**
   * Executa otimização de conteúdo
   */
  private async executeContentOptimization(feedback: OptimizationFeedback): Promise<any> {
    // Ajustar templates ou regras de geração de conteúdo
    
    return {
      success: true,
      result: {
        action: 'content_template_adjustment',
        adjustment: feedback.recommended_adjustment,
        expected_improvement: feedback.expected_improvement
      }
    };
  }

  /**
   * Executa otimização de frequência
   */
  private async executeFrequencyOptimization(feedback: OptimizationFeedback): Promise<any> {
    // Ajustar limites de frequência de postagem
    
    return {
      success: true,
      result: {
        action: 'frequency_limit_adjustment',
        adjustment: feedback.recommended_adjustment,
        expected_improvement: feedback.expected_improvement
      }
    };
  }

  /**
   * Executa otimização de formato
   */
  private async executeFormatOptimization(feedback: OptimizationFeedback): Promise<any> {
    // Ajustar formatos de conteúdo (ex: mais imagens, menos texto)
    
    return {
      success: true,
      result: {
        action: 'content_format_adjustment',
        adjustment: feedback.recommended_adjustment,
        expected_improvement: feedback.expected_improvement
      }
    };
  }

  /**
   * Gera relatório completo de feedback loop
   */
  async generateFeedbackReport(): Promise<any> {
    const recentCycles = this.learningCycles.slice(-3);
    const recentFeedback = this.feedbackHistory.slice(-50);
    const recentOptimizations = this.optimizationFeedback.slice(-20);

    const avgAccuracy = recentFeedback.reduce((sum, f) => sum + f.accuracy_score, 0) / recentFeedback.length;
    
    const performanceTrends = this.calculatePerformanceTrends(recentFeedback);
    
    const optimizationEffectiveness = this.calculateOptimizationEffectiveness(recentOptimizations);

    const prompt =`
Baseado em todo o histórico do feedback loop:

CICLOS RECENTES: ${JSON.stringify(recentCycles, null, 2)}
ACCURACY MÉDIA: ${avgAccuracy.toFixed(1)}
TENDÊNCIAS: ${JSON.stringify(performanceTrends)}

Gere relatório executivo em JSON:
{
  "executive_summary": "resumo executivo do desempenho",
  "key_metrics": {
    "average_accuracy": ${avgAccuracy},
    "cycles_completed": ${this.learningCycles.length},
    "optimizations_applied": ${recentOptimizations.length},
    "improvement_rate": "taxa de melhoria"
  },
  "performance_trends": {
    "engagement": "melhorando|estável|piorando",
    "ctr": "melhorando|estável|piorando",
    "accuracy": "melhorando|estável|piorando"
  },
  "top_insights": ["insight1", "insight2", "insight3"],
  "optimization_success_rate": percentual,
  "next_priorities": ["prioridade1", "prioridade2"],
  "recommendations": ["rec1", "rec2", "rec3"]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating feedback report:', error);
      return {
        executive_summary: 'Relatório de feedback loop',
        key_metrics: {
          average_accuracy: avgAccuracy,
          cycles_completed: this.learningCycles.length,
          optimizations_applied: recentOptimizations.length
        },
        performance_trends: {},
        top_insights: [],
        optimization_success_rate: 0,
        next_priorities: [],
        recommendations: []
      };
    }
  }

  /**
   * Calcula tendências de performance
   */
  private calculatePerformanceTrends(feedbacks: FeedbackData[]): any {
    if (feedbacks.length < 10) return {};

    const recent = feedbacks.slice(-10);
    const older = feedbacks.slice(-20, -10);

    const recentAvg = recent.reduce((sum, f) => sum + f.actual_performance.engagement, 0) / recent.length;
    const olderAvg = older.reduce((sum, f) => sum + f.actual_performance.engagement, 0) / older.length;

    return {
      engagement: recentAvg > olderAvg ? 'melhorando' : recentAvg < olderAvg ? 'piorando' : 'estável',
      trend_value: recentAvg - olderAvg
    };
  }

  /**
   * Calcula efetividade das otimizações
   */
  private calculateOptimizationEffectiveness(optimizations: OptimizationFeedback[]): number {
    if (optimizations.length === 0) return 0;

    const successfulOptimizations = optimizations.filter(o => o.confidence >= 80);
    return Math.round((successfulOptimizations.length / optimizations.length) * 100);
  }

  /**
   * Obtém status atual do ciclo de aprendizado
   */
  getCurrentCycleStatus(): any {
    if (!this.currentCycle) return null;

    const cycleDuration = Date.now() - new Date(this.currentCycle.start_date).getTime();
    const daysInCycle = cycleDuration / (1000 * 60 * 60 * 24);

    return {
      cycle_number: this.currentCycle.cycle_number,
      days_in_cycle: Math.round(daysInCycle),
      posts_analyzed: this.currentCycle.posts_analyzed,
      target_posts: 50,
      target_days: 7,
      progress: Math.min(
        Math.round((this.currentCycle.posts_analyzed / 50) * 100),
        Math.round((daysInCycle / 7) * 100)
      )
    };
  }

  /**
   * Obtém feedbacks recentes
   */
  getRecentFeedback(limit: number = 20): FeedbackData[] {
    return this.feedbackHistory
      .sort((a, b) => new Date(b.feedback_timestamp).getTime() - new Date(a.feedback_timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Obtém otimizações pendentes
   */
  getPendingOptimizations(): OptimizationFeedback[] {
    return this.optimizationFeedback
      .filter(f => f.confidence >= this.feedbackThresholds.confidence_min)
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  /**
   * Exporta dados completos do feedback loop
   */
  exportFeedbackData(): {
    feedbackHistory: FeedbackData[];
    optimizationFeedback: OptimizationFeedback[];
    learningCycles: LearningCycle[];
    currentCycle: LearningCycle | null;
  } {
    return {
      feedbackHistory: this.feedbackHistory,
      optimizationFeedback: this.optimizationFeedback,
      learningCycles: this.learningCycles,
      currentCycle: this.currentCycle
    };
  }
}
