import { OllamaService } from '../social-ai/ollama/ollama.service';

export interface PerformanceMetrics {
  post_id: string;
  content_type: string;
  persona: string;
  category: string;
  posting_hour: number;
  day_of_week: number;
  engagement_score: number;
  ctr: number;
  reach: number;
  conversions: number;
  spam_score: number;
  humanization_score: number;
  timestamp: string;
}

export interface LearningInsight {
  type: 'timing' | 'persona' | 'content_type' | 'category' | 'format' | 'cta';
  insight: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
  data_points: number;
  created_at: string;
}

export interface OptimizationRule {
  id: string;
  type: string;
  condition: string;
  action: string;
  priority: number;
  success_rate: number;
  last_applied: string;
  created_at: string;
}

export class PerformanceLearner {
  private ollamaService: OllamaService;
  private performanceHistory: PerformanceMetrics[];
  private insights: LearningInsight[];
  private optimizationRules: OptimizationRule[];
  private learningModels: Map<string, any>;

  constructor() {
    this.ollamaService = new OllamaService();
    this.performanceHistory = [];
    this.insights = [];
    this.optimizationRules = [];
    this.learningModels = new Map();
    this.initializeBaseRules();
  }

  /**
   * Inicializa regras de otimização base
   */
  private initializeBaseRules(): void {
    const baseRules = [
      {
        id: 'timing_morning_peak',
        type: 'timing',
        condition: 'engagement_score > 80 AND posting_hour BETWEEN 8 AND 11',
        action: 'increase_morning_posts',
        priority: 8,
        success_rate: 75
      },
      {
        id: 'persona_tecnico_success',
        type: 'persona',
        condition: 'persona = "tecnico_profissional" AND ctr > 5',
        action: 'prioritize_tecnico_persona',
        priority: 7,
        success_rate: 82
      },
      {
        id: 'content_review_high',
        type: 'content_type',
        condition: 'content_type = "review" AND engagement_score > 85',
        action: 'increase_review_content',
        priority: 6,
        success_rate: 78
      },
      {
        id: 'avoid_high_spam',
        type: 'spam',
        condition: 'spam_score > 70',
        action: 'reduce_posting_frequency',
        priority: 10,
        success_rate: 90
      },
      {
        id: 'weekend_optimization',
        type: 'timing',
        condition: 'day_of_week IN [6,7] AND reach > average_reach * 1.5',
        action: 'increase_weekend_posts',
        priority: 5,
        success_rate: 65
      }
    ];

    baseRules.forEach(rule => {
      this.optimizationRules.push({
        ...rule,
        last_applied: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    });
  }

  /**
   * Adiciona métricas de performance para aprendizado
   */
  async addPerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
    this.performanceHistory.push(metrics);
    
    // Manter apenas os últimos 1000 registros
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }

    // Gerar insights automaticamente
    await this.generateInsights(metrics);
    
    // Atualizar modelos de aprendizado
    await this.updateLearningModels();
  }

  /**
   * Geração automática de insights baseados nas métricas
   */
  private async generateInsights(metrics: PerformanceMetrics): Promise<void> {
    const recentMetrics = this.performanceHistory.slice(-50);
    
    if (recentMetrics.length < 10) return; // Precisa de dados suficientes

    // Analisar padrões de timing
    const timingInsight = await this.analyzeTimingPatterns(recentMetrics);
    if (timingInsight) this.insights.push(timingInsight);

    // Analisar performance de personas
    const personaInsight = await this.analyzePersonaPerformance(recentMetrics);
    if (personaInsight) this.insights.push(personaInsight);

    // Analisar tipos de conteúdo
    const contentTypeInsight = await this.analyzeContentTypePerformance(recentMetrics);
    if (contentTypeInsight) this.insights.push(contentTypeInsight);

    // Analisar categorias
    const categoryInsight = await this.analyzeCategoryPerformance(recentMetrics);
    if (categoryInsight) this.insights.push(categoryInsight);

    // Manter apenas os 100 insights mais recentes
    this.insights = this.insights.slice(-100);
  }

  /**
   * Análise de padrões de timing
   */
  private async analyzeTimingPatterns(metrics: PerformanceMetrics[]): Promise<LearningInsight | null> {
    const hourlyPerformance = metrics.reduce((acc, m) => {
      const hour = m.posting_hour;
      if (!acc[hour]) {
        acc[hour] = { total: 0, engagement: 0, ctr: 0, count: 0 };
      }
      acc[hour].total += m.engagement_score;
      acc[hour].engagement += m.engagement_score;
      acc[hour].ctr += m.ctr;
      acc[hour].count++;
      return acc;
    }, {} as Record<number, any>);

    // Encontrar horários de melhor performance
    const bestHours = Object.entries(hourlyPerformance)
      .filter(([_, data]: [string, any]) => data.count >= 3)
      .map(([hour, data]: [string, any]) => ({
        hour: parseInt(hour),
        avgEngagement: data.engagement / data.count,
        avgCTR: data.ctr / data.count,
        count: data.count
      }))
      .sort((a, b) => (b.avgEngagement + b.avgCTR) - (a.avgEngagement + a.avgCTR))
      .slice(0, 3);

    if (bestHours.length === 0) return null;

    const bestHour = bestHours[0];
    
    const prompt =`
Baseado nos dados de performance:

MELHOR HORÁRIO: ${bestHour.hour}:00
ENGAGEMENT MÉDIO: ${bestHour.avgEngagement.toFixed(1)}
CTR MÉDIO: ${bestHour.avgCTR.toFixed(1)}
AMOSTRAS: ${bestHour.count}

Gere um insight sobre timing em JSON:
{
  "insight": "insight detalhado sobre o horário",
  "confidence": 0-100,
  "impact": "low|medium|high",
  "recommendation": "recomendação acionável"
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      const result = JSON.parse(response);

      return {
        type: 'timing',
        insight: result.insight,
        confidence: result.confidence,
        impact: result.impact,
        recommendation: result.recommendation,
        data_points: bestHour.count,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing timing patterns:', error);
      return null;
    }
  }

  /**
   * Análise de performance de personas
   */
  private async analyzePersonaPerformance(metrics: PerformanceMetrics[]): Promise<LearningInsight | null> {
    const personaPerformance = metrics.reduce((acc, m) => {
      if (!acc[m.persona]) {
        acc[m.persona] = { total: 0, engagement: 0, ctr: 0, count: 0 };
      }
      acc[m.persona].total += m.engagement_score;
      acc[m.persona].engagement += m.engagement_score;
      acc[m.persona].ctr += m.ctr;
      acc[m.persona].count++;
      return acc;
    }, {} as Record<string, any>);

    const bestPersona = Object.entries(personaPerformance)
      .filter(([_, data]: [string, any]) => data.count >= 3)
      .map(([persona, data]: [string, any]) => ({
        persona,
        avgEngagement: data.engagement / data.count,
        avgCTR: data.ctr / data.count,
        count: data.count
      }))
      .sort((a, b) => (b.avgEngagement + b.avgCTR) - (a.avgEngagement + a.avgCTR))[0];

    if (!bestPersona) return null;

    const prompt =`
Baseado nos dados de performance de personas:

MELHOR PERSONA: ${bestPersona.persona}
ENGAGEMENT MÉDIO: ${bestPersona.avgEngagement.toFixed(1)}
CTR MÉDIO: ${bestPersona.avgCTR.toFixed(1)}
AMOSTRAS: ${bestPersona.count}

Gere um insight sobre personas em JSON:
{
  "insight": "insight detalhado sobre a persona",
  "confidence": 0-100,
  "impact": "low|medium|high",
  "recommendation": "recomendação acionável"
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      const result = JSON.parse(response);

      return {
        type: 'persona',
        insight: result.insight,
        confidence: result.confidence,
        impact: result.impact,
        recommendation: result.recommendation,
        data_points: bestPersona.count,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing persona performance:', error);
      return null;
    }
  }

  /**
   * Análise de performance de tipos de conteúdo
   */
  private async analyzeContentTypePerformance(metrics: PerformanceMetrics[]): Promise<LearningInsight | null> {
    const contentTypePerformance = metrics.reduce((acc, m) => {
      if (!acc[m.content_type]) {
        acc[m.content_type] = { total: 0, engagement: 0, ctr: 0, count: 0 };
      }
      acc[m.content_type].total += m.engagement_score;
      acc[m.content_type].engagement += m.engagement_score;
      acc[m.content_type].ctr += m.ctr;
      acc[m.content_type].count++;
      return acc;
    }, {} as Record<string, any>);

    const bestContentType = Object.entries(contentTypePerformance)
      .map(([type, data]: [string, any]) => ({
        type,
        avgEngagement: data.engagement / data.count,
        avgCTR: data.ctr / data.count,
        count: data.count
      }))
      .sort((a, b) => (b.avgEngagement + b.avgCTR) - (a.avgEngagement + a.avgCTR))[0];

    if (!bestContentType) return null;

    const prompt =`
Baseado nos dados de performance de conteúdo:

MELHOR TIPO: ${bestContentType.type}
ENGAGEMENT MÉDIO: ${bestContentType.avgEngagement.toFixed(1)}
CTR MÉDIO: ${bestContentType.avgCTR.toFixed(1)}
AMOSTRAS: ${bestContentType.count}

Gere um insight sobre tipos de conteúdo em JSON:
{
  "insight": "insight detalhado sobre o tipo de conteúdo",
  "confidence": 0-100,
  "impact": "low|medium|high",
  "recommendation": "recomendação acionável"
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'mistral');
      const result = JSON.parse(response);

      return {
        type: 'content_type',
        insight: result.insight,
        confidence: result.confidence,
        impact: result.impact,
        recommendation: result.recommendation,
        data_points: bestContentType.count,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing content type performance:', error);
      return null;
    }
  }

  /**
   * Análise de performance de categorias
   */
  private async analyzeCategoryPerformance(metrics: PerformanceMetrics[]): Promise<LearningInsight | null> {
    const categoryPerformance = metrics.reduce((acc, m) => {
      if (!acc[m.category]) {
        acc[m.category] = { total: 0, engagement: 0, ctr: 0, count: 0 };
      }
      acc[m.category].total += m.engagement_score;
      acc[m.category].engagement += m.engagement_score;
      acc[m.category].ctr += m.ctr;
      acc[m.category].count++;
      return acc;
    }, {} as Record<string, any>);

    const bestCategory = Object.entries(categoryPerformance)
      .filter(([_, data]: [string, any]) => data.count >= 2)
      .map(([category, data]: [string, any]) => ({
        category,
        avgEngagement: data.engagement / data.count,
        avgCTR: data.ctr / data.count,
        count: data.count
      }))
      .sort((a, b) => (b.avgEngagement + b.avgCTR) - (a.avgEngagement + a.avgCTR))[0];

    if (!bestCategory) return null;

    const prompt =`
Baseado nos dados de performance de categorias:

MELHOR CATEGORIA: ${bestCategory.category}
ENGAGEMENT MÉDIO: ${bestCategory.avgEngagement.toFixed(1)}
CTR MÉDIO: ${bestCategory.avgCTR.toFixed(1)}
AMOSTRAS: ${bestCategory.count}

Gere um insight sobre categorias em JSON:
{
  "insight": "insight detalhado sobre a categoria",
  "confidence": 0-100,
  "impact": "low|medium|high",
  "recommendation": "recomendação acionável"
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'phi');
      const result = JSON.parse(response);

      return {
        type: 'category',
        insight: result.insight,
        confidence: result.confidence,
        impact: result.impact,
        recommendation: result.recommendation,
        data_points: bestCategory.count,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing category performance:', error);
      return null;
    }
  }

  /**
   * Atualiza modelos de aprendizado
   */
  private async updateLearningModels(): Promise<void> {
    if (this.performanceHistory.length < 20) return;

    // Modelo de predição de engagement
    const engagementModel = await this.trainEngagementModel();
    this.learningModels.set('engagement', engagementModel);

    // Modelo de predição de CTR
    const ctrModel = await this.trainCTRModel();
    this.learningModels.set('ctr', ctrModel);

    // Modelo de predição de spam risk
    const spamModel = await this.trainSpamModel();
    this.learningModels.set('spam', spamModel);
  }

  /**
   * Treina modelo de predição de engagement
   */
  private async trainEngagementModel(): Promise<any> {
    const recentData = this.performanceHistory.slice(-100);
    
    const features = recentData.map(m => ({
      content_type: m.content_type,
      persona: m.persona,
      category: m.category,
      posting_hour: m.posting_hour,
      day_of_week: m.day_of_week,
      spam_score: m.spam_score,
      humanization_score: m.humanization_score
    }));

    const targets = recentData.map(m => m.engagement_score);

    const prompt =`
Treine um modelo simples de predição de engagement:

FEATURES: ${JSON.stringify(features.slice(0, 10))}
TARGETS: ${JSON.stringify(targets.slice(0, 10))}

Analise os padrões e retorne JSON com regras de predição:
{
  "rules": [
    {
      "condition": "content_type = 'review' AND persona = 'tecnico_profissional'",
      "predicted_engagement": 85,
      "confidence": 0-100
    }
  ],
  "feature_importance": {
    "content_type": importance,
    "persona": importance,
    "posting_hour": importance
  }
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error training engagement model:', error);
      return { rules: [], feature_importance: {} };
    }
  }

  /**
   * Treina modelo de predição de CTR
   */
  private async trainCTRModel(): Promise<any> {
    const recentData = this.performanceHistory.slice(-100);
    
    const highCTRPosts = recentData.filter(m => m.ctr > 5);
    const patterns = highCTRPosts.map(m => ({
      content_type: m.content_type,
      persona: m.persona,
      category: m.category,
      posting_hour: m.posting_hour
    }));

    const prompt =`
Analise padrões de posts com alto CTR (>5%):

PADRÕES: ${JSON.stringify(patterns)}

Retorne JSON com características comuns:
{
  "common_patterns": ["padrão1", "padrão2"],
  "best_combinations": [
    {
      "content_type": "tipo",
      "persona": "persona",
      "hour": hora,
      "success_rate": percentual
    }
  ],
  "recommendations": ["rec1", "rec2"]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error training CTR model:', error);
      return { common_patterns: [], best_combinations: [], recommendations: [] };
    }
  }

  /**
   * Treina modelo de predição de spam risk
   */
  private async trainSpamModel(): Promise<any> {
    const recentData = this.performanceHistory.slice(-100);
    
    const highSpamPosts = recentData.filter(m => m.spam_score > 50);
    const spamPatterns = highSpamPosts.map(m => ({
      content_type: m.content_type,
      persona: m.persona,
      posting_hour: m.posting_hour,
      day_of_week: m.day_of_week
    }));

    const prompt =`
Analise padrões de posts com alto spam risk (>50%):

PADRÕES: ${JSON.stringify(spamPatterns)}

Retorne JSON com fatores de risco:
{
  "risk_factors": ["fator1", "fator2"],
  "dangerous_combinations": [
    {
      "content_type": "tipo",
      "persona": "persona",
      "hour": hora,
      "risk_level": "alto|médio"
    }
  ],
  "mitigation_strategies": ["estratégia1", "estratégia2"]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'mistral');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error training spam model:', error);
      return { risk_factors: [], dangerous_combinations: [], mitigation_strategies: [] };
    }
  }

  /**
   * Prediz performance de um post antes de publicar
   */
  async predictPerformance(postData: {
    content_type: string;
    persona: string;
    category: string;
    posting_hour: number;
    day_of_week: number;
    content: string;
  }): Promise<{
    engagement_prediction: number;
    ctr_prediction: number;
    spam_risk_prediction: number;
    confidence: number;
    recommendations: string[];
  }> {
    const engagementModel = this.learningModels.get('engagement');
    const ctrModel = this.learningModels.get('ctr');
    const spamModel = this.learningModels.get('spam');

    let engagementPred = 70; // Base
    let ctrPred = 3; // Base
    let spamRiskPred = 20; // Base
    let confidence = 60; // Base

    // Usar modelos treinados se disponíveis
    if (engagementModel?.rules) {
      const matchingRule = engagementModel.rules.find((rule: any) => 
        this.evaluateCondition(rule.condition, postData)
      );
      if (matchingRule) {
        engagementPred = matchingRule.predicted_engagement;
        confidence = Math.max(confidence, matchingRule.confidence);
      }
    }

    if (ctrModel?.best_combinations) {
      const bestMatch = ctrModel.best_combinations.find((combo: any) =>
        combo.content_type === postData.content_type &&
        combo.persona === postData.persona &&
        Math.abs(combo.hour - postData.posting_hour) <= 2
      );
      if (bestMatch) {
        ctrPred = bestMatch.success_rate;
        confidence = Math.max(confidence, 75);
      }
    }

    if (spamModel?.dangerous_combinations) {
      const dangerousMatch = spamModel.dangerous_combinations.find((combo: any) =>
        combo.content_type === postData.content_type &&
        combo.persona === postData.persona &&
        Math.abs(combo.hour - postData.posting_hour) <= 1
      );
      if (dangerousMatch) {
        spamRiskPred = dangerousMatch.risk_level === 'alto' ? 70 : 
                       dangerousMatch.risk_level === 'médio' ? 50 : 30;
        confidence = Math.max(confidence, 80);
      }
    }

    // Análise adicional do conteúdo
    const contentAnalysis = await this.analyzeContentForPerformance(postData.content);
    
    return {
      engagement_prediction: engagementPred,
      ctr_prediction: ctrPred,
      spam_risk_prediction: spamRiskPred,
      confidence,
      recommendations: contentAnalysis.recommendations
    };
  }

  /**
   * Avalia condição simples para regras
   */
  private evaluateCondition(condition: string, data: any): boolean {
    // Implementação simples de avaliação de condições
    try {
      // Substituir variáveis na condição
      let evalCondition = condition;
      Object.entries(data).forEach(([key, value]) => {
        evalCondition = evalCondition.replace(new RegExp(key, 'g'), `'${value}'`);
      });
      
      // Avaliação segura (simplificada)
      return evalCondition.includes('tecnico_profissional') && data.persona === 'tecnico_profissional';
    } catch (error) {
      return false;
    }
  }

  /**
   * Análise de conteúdo para performance
   */
  private async analyzeContentForPerformance(content: string): Promise<any> {
    const prompt =`
Analise este conteúdo para performance:

CONTEÚDO: "${content}"

Retorne JSON com análise:
{
  "engagement_factors": ["fator1", "fator2"],
  "spam_indicators": ["indicador1", "indicador2"],
  "recommendations": ["rec1", "rec2"],
  "optimization_suggestions": ["sugestão1", "sugestão2"]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'phi');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing content for performance:', error);
      return {
        engagement_factors: [],
        spam_indicators: [],
        recommendations: [],
        optimization_suggestions: []
      };
    }
  }

  /**
   * Obtém insights recentes
   */
  getRecentInsights(limit: number = 20): LearningInsight[] {
    return this.insights
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Obtém regras de otimização ativas
   */
  getOptimizationRules(): OptimizationRule[] {
    return this.optimizationRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Aplica regra de otimização
   */
  async applyOptimizationRule(ruleId: string): Promise<boolean> {
    const rule = this.optimizationRules.find(r => r.id === ruleId);
    if (!rule) return false;

    try {
      // Aqui implementaria a lógica de aplicar a regra
      rule.last_applied = new Date().toISOString();
      return true;
    } catch (error) {
      console.error('Error applying optimization rule:', error);
      return false;
    }
  }

  /**
   * Gera relatório de aprendizado
   */
  async generateLearningReport(): Promise<any> {
    const prompt =`
Baseado em todo o histórico de performance:

HISTÓRICO: ${JSON.stringify(this.performanceHistory.slice(-20), null, 2)}
INSIGHTS: ${JSON.stringify(this.insights.slice(-10), null, 2)}

Gere um relatório completo de aprendizado em JSON:
{
  "key_findings": ["descoberta1", "descoberta2"],
  "performance_trends": {
    "engagement": "tendência",
    "ctr": "tendência",
    "spam_risk": "tendência"
  },
  "top_performers": {
    "personas": ["persona1", "persona2"],
    "content_types": ["tipo1", "tipo2"],
    "timing": ["horário1", "horário2"]
  },
  "optimization_opportunities": ["oportunidade1", "oportunidade2"],
  "recommendations": ["rec1", "rec2"],
  "confidence_score": 0-100
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating learning report:', error);
      return {
        key_findings: [],
        performance_trends: {},
        top_performers: {},
        optimization_opportunities: [],
        recommendations: [],
        confidence_score: 50
      };
    }
  }

  /**
   * Exporta dados de aprendizado
   */
  exportLearningData(): {
    performanceHistory: PerformanceMetrics[];
    insights: LearningInsight[];
    optimizationRules: OptimizationRule[];
  } {
    return {
      performanceHistory: this.performanceHistory,
      insights: this.insights,
      optimizationRules: this.optimizationRules
    };
  }
}
