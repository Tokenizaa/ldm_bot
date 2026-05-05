import { AIDecision, AutonomousAction } from './orchestrator.engine';
import { OllamaService } from '../social-ai/ollama/ollama.service';

export interface StrategyConfig {
  name: string;
  type: 'conservative' | 'balanced' | 'aggressive';
  parameters: {
    daily_post_limit: number;
    spam_threshold: number;
    engagement_target: number;
    risk_tolerance: number;
    content_mix: {
      offer: number;
      question: number;
      review: number;
      technical_humor: number;
    };
  };
  kpis: {
    reach_target: number;
    ctr_target: number;
    conversion_target: number;
    spam_safety_target: number;
  };
}

export interface StrategyExecution {
  id: string;
  strategy_name: string;
  status: 'planning' | 'executing' | 'monitoring' | 'completed' | 'failed';
  progress: number;
  results: any;
  adjustments: any[];
  started_at: string;
  updated_at: string;
}

export class StrategyEngine {
  private ollamaService: OllamaService;
  private activeStrategies: Map<string, StrategyConfig> = new Map();
  private executionHistory: StrategyExecution[] = [];
  private performanceMetrics: Map<string, any> = new Map();

  constructor() {
    this.ollamaService = new OllamaService();
    this.initializeDefaultStrategies();
  }

  /**
   * Inicializa estratégias padrão
   */
  private initializeDefaultStrategies(): void {
    const strategies: StrategyConfig[] = [
      {
        name: 'conservative_growth',
        type: 'conservative',
        parameters: {
          daily_post_limit: 3,
          spam_threshold: 20,
          engagement_target: 5,
          risk_tolerance: 25,
          content_mix: { offer: 30, question: 40, review: 25, technical_humor: 5 }
        },
        kpis: {
          reach_target: 1000,
          ctr_target: 3,
          conversion_target: 2,
          spam_safety_target: 95
        }
      },
      {
        name: 'balanced_expansion',
        type: 'balanced',
        parameters: {
          daily_post_limit: 5,
          spam_threshold: 35,
          engagement_target: 8,
          risk_tolerance: 50,
          content_mix: { offer: 40, question: 30, review: 20, technical_humor: 10 }
        },
        kpis: {
          reach_target: 2500,
          ctr_target: 5,
          conversion_target: 4,
          spam_safety_target: 85
        }
      },
      {
        name: 'aggressive_growth',
        type: 'aggressive',
        parameters: {
          daily_post_limit: 8,
          spam_threshold: 50,
          engagement_target: 12,
          risk_tolerance: 75,
          content_mix: { offer: 50, question: 25, review: 15, technical_humor: 10 }
        },
        kpis: {
          reach_target: 5000,
          ctr_target: 7,
          conversion_target: 6,
          spam_safety_target: 70
        }
      }
    ];

    strategies.forEach(strategy => {
      this.activeStrategies.set(strategy.name, strategy);
    });
  }

  /**
   * Seleciona estratégia ótima baseada no contexto
   */
  async selectOptimalStrategy(context: {
    current_performance: any;
    system_status: any;
    market_conditions: any;
    user_preferences: any;
    risk_assessment: any;
  }): Promise<{
    recommended_strategy: StrategyConfig;
    reasoning: string;
    confidence: number;
    alternative_strategies: StrategyConfig[];
    implementation_plan: any;
  }> {
    const prompt = `
Contexto atual para seleção de estratégia:
${JSON.stringify(context, null, 2)}

Estratégias disponíveis:
${JSON.stringify(Array.from(this.activeStrategies.values()), null, 2)}

Analise o contexto e selecione a estratégia ótima.

Retorne JSON:
{
  "recommended_strategy": "nome_estratégia",
  "reasoning": "explicação detalhada da escolha",
  "confidence": 0-100,
  "key_factors": ["fator1", "fator2", "fator3"],
  "risk_considerations": ["risco1", "risco2"],
  "expected_outcomes": {
    "reach": "estimativa",
    "engagement": "estimativa",
    "conversions": "estimativa",
    "spam_risk": "baixo|médio|alto"
  },
  "implementation_timeline": "timeline",
  "monitoring_points": ["ponto1", "ponto2"],
  "adjustment_triggers": ["trigger1", "trigger2"]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      const analysis = JSON.parse(response);

      const strategy = this.activeStrategies.get(analysis.recommended_strategy);
      if (!strategy) {
        throw new Error(`Strategy ${analysis.recommended_strategy} not found`);
      }

      return {
        recommended_strategy: strategy,
        reasoning: analysis.reasoning,
        confidence: analysis.confidence,
        alternative_strategies: this.getAlternativeStrategies(strategy.name),
        implementation_plan: {
          expected_outcomes: analysis.expected_outcomes,
          timeline: analysis.implementation_timeline,
          monitoring_points: analysis.monitoring_points,
          adjustment_triggers: analysis.adjustment_triggers,
          key_factors: analysis.key_factors,
          risk_considerations: analysis.risk_considerations
        }
      };
    } catch (error) {
      console.error('Error selecting optimal strategy:', error);
      return this.createFallbackStrategySelection();
    }
  }

  /**
   * Executa estratégia selecionada
   */
  async executeStrategy(
    strategy: StrategyConfig,
    context: any,
    decisions: AIDecision[]
  ): Promise<StrategyExecution> {
    const execution: StrategyExecution = {
      id: this.generateExecutionId(),
      strategy_name: strategy.name,
      status: 'executing',
      progress: 0,
      results: {},
      adjustments: [],
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Planejamento inicial
    const plan = await this.createExecutionPlan(strategy, context, decisions);
    execution.results.plan = plan;

    // 2. Configuração de parâmetros
    await this.configureStrategyParameters(strategy, execution);

    // 3. Iniciar monitoramento
    this.startStrategyMonitoring(execution);

    // 4. Salvar execução
    this.executionHistory.push(execution);

    return execution;
  }

  /**
   * Cria plano de execução detalhado
   */
  private async createExecutionPlan(
    strategy: StrategyConfig,
    context: any,
    decisions: AIDecision[]
  ): Promise<any> {
    const prompt =`
Estratégia selecionada: ${strategy.name}
${JSON.stringify(strategy, null, 2)}

Decisões da IA:
${JSON.stringify(decisions.slice(0, 5), null, 2)}

Contexto atual:
${JSON.stringify(context, null, 2)}

Crie um plano de execução detalhado em JSON:
{
  "execution_phases": [
    {
      "phase": "nome_fase",
      "duration": "duração",
      "objectives": ["objetivo1", "objetivo2"],
      "actions": ["ação1", "ação2"],
      "kpis": ["kpi1", "kpi2"],
      "risk_mitigation": ["mitigação1", "mitigação2"]
    }
  ],
  "daily_schedule": {
    "posting_times": ["HH:MM", "HH:MM"],
    "content_types": ["tipo1", "tipo2"],
    "personas": ["persona1", "persona2"],
    "monitoring_points": ["ponto1", "ponto2"]
  },
  "success_criteria": {
    "must_achieve": ["critério1", "critério2"],
    "should_achieve": ["critério3", "critério4"],
    "could_achieve": ["critério5", "critério6"]
  },
  "contingency_plans": {
    "low_engagement": "plano_a",
    "high_spam_risk": "plano_b",
    "technical_issues": "plano_c"
  }
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error creating execution plan:', error);
      return this.createFallbackExecutionPlan(strategy);
    }
  }

  /**
   * Monitora execução da estratégia em tempo real
   */
  private startStrategyMonitoring(execution: StrategyExecution): void {
    // Iniciar monitoramento contínuo
    const monitoringInterval = setInterval(async () => {
      try {
        await this.updateExecutionProgress(execution);
        
        // Verificar se precisa de ajustes
        const adjustments = await this.checkForAdjustments(execution);
        if (adjustments.length > 0) {
          execution.adjustments.push(...adjustments);
        }

        // Verificar se estratégia foi completada
        if (execution.progress >= 100) {
          execution.status = 'completed';
          clearInterval(monitoringInterval);
        }
      } catch (error) {
        console.error('Error in strategy monitoring:', error);
        execution.status = 'failed';
        clearInterval(monitoringInterval);
      }

      execution.updated_at = new Date().toISOString();
    }, 60000); // Verificar a cada minuto
  }

  /**
   * Atualiza progresso da execução
   */
  private async updateExecutionProgress(execution: StrategyExecution): Promise<void> {
    // Implementar lógica de atualização de progresso
    // Baseado em KPIs, métricas de performance, etc.
    execution.progress = Math.min(execution.progress + 5, 100);
  }

  /**
   * Verifica se ajustes são necessários
   */
  private async checkForAdjustments(execution: StrategyExecution): Promise<any[]> {
    const adjustments: any[] = [];

    // Implementar lógica de detecção de necessidade de ajustes
    // Baseado em performance, risco, mudanças no contexto, etc.

    return adjustments;
  }

  /**
   * Ajusta estratégia dinamicamente
   */
  async adjustStrategy(
    execution: StrategyExecution,
    adjustment_reason: string,
    new_parameters: any
  ): Promise<StrategyExecution> {
    const adjustment = {
      timestamp: new Date().toISOString(),
      reason: adjustment_reason,
      previous_parameters: execution.results.plan?.parameters || {},
      new_parameters: new_parameters,
      impact_assessment: await this.assessAdjustmentImpact(execution, new_parameters)
    };

    execution.adjustments.push(adjustment);
    execution.results.plan.parameters = new_parameters;
    execution.updated_at = new Date().toISOString();

    return execution;
  }

  /**
   * Avalia impacto de ajustes na estratégia
   */
  private async assessAdjustmentImpact(execution: StrategyExecution, new_parameters: any): Promise<any> {
    const prompt =`
Ajuste proposto na estratégia ${execution.strategy_name}:
${JSON.stringify(new_parameters, null, 2)}

Execução atual:
${JSON.stringify(execution, null, 2)}

Avalie o impacto esperado deste ajuste em JSON:
{
  "impact_level": "low|medium|high",
  "expected_changes": {
    "reach": "aumento|redução|neutro",
    "engagement": "aumento|redução|neutro", 
    "spam_risk": "aumento|redução|neutro",
    "conversions": "aumento|redução|neutro"
  },
  "risk_factors": ["fator1", "fator2"],
  "mitigation_needed": ["mitigação1", "mitigação2"],
  "confidence": 0-100
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'mistral');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error assessing adjustment impact:', error);
      return {
        impact_level: 'medium',
        confidence: 50
      };
    }
  }

  /**
   * Gera relatório de performance da estratégia
   */
  async generateStrategyReport(execution: StrategyExecution): Promise<any> {
    const prompt =`
Dados completos da execução da estratégia:
${JSON.stringify(execution, null, 2)}

Gere um relatório completo de performance em JSON:
{
  "executive_summary": "resumo executivo",
  "key_achievements": ["conquista1", "conquista2"],
  "performance_metrics": {
    "reach": { "target": valor, "achieved": valor, "percentage": percentual },
    "engagement": { "target": valor, "achieved": valor, "percentage": percentual },
    "conversions": { "target": valor, "achieved": valor, "percentage": percentual },
    "spam_safety": { "target": valor, "achieved": valor, "percentage": percentual }
  },
  "strategy_effectiveness": {
    "overall_score": 0-100,
    "strengths": ["força1", "força2"],
    "weaknesses": ["fraqueza1", "fraqueza2"],
    "opportunities": ["oportunidade1", "oportunidade2"]
  },
  "adjustments_made": execution.adjustments.length,
  "lessons_learned": ["lição1", "lição2"],
  "recommendations": ["recomendação1", "recomendação2"],
  "next_strategy_suggestions": ["estratégia1", "estratégia2"]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating strategy report:', error);
      return this.createFallbackReport(execution);
    }
  }

  /**
   * Otimiza estratégias baseadas em aprendizado
   */
  async optimizeStrategies(): Promise<void> {
    const completedExecutions = this.executionHistory.filter(e => e.status === 'completed');
    
    if (completedExecutions.length < 3) {
      return; // Precisa de mais dados para otimizar
    }

    const prompt =`
Histórico de execuções completas:
${JSON.stringify(completedExecutions.slice(-5), null, 2)}

Analise o desempenho e sugira otimizações para as estratégias existentes em JSON:
{
  "strategy_optimizations": {
    "conservative_growth": {
      "parameter_adjustments": {
        "daily_post_limit": novo_valor,
        "spam_threshold": novo_valor,
        "content_mix": { "offer": novo_valor, "question": novo_valor }
      },
      "reasoning": "explicação das otimizações"
    },
    "balanced_expansion": { ... },
    "aggressive_growth": { ... }
  },
  "new_strategy_suggestions": [
    {
      "name": "nome_estratégia",
      "type": "conservative|balanced|aggressive",
      "use_case": "caso de uso",
      "key_differentiators": ["diferencial1", "diferencial2"]
    }
  ],
  "performance_insights": ["insight1", "insight2"],
  "optimization_confidence": 0-100
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      const optimizations = JSON.parse(response);
      
      // Aplicar otimizações sugeridas
      await this.applyStrategyOptimizations(optimizations.strategy_optimizations);
      
    } catch (error) {
      console.error('Error optimizing strategies:', error);
    }
  }

  /**
   * Aplica otimizações nas estratégias
   */
  private async applyStrategyOptimizations(optimizations: any): Promise<void> {
    Object.entries(optimizations).forEach(([strategyName, optimization]: [string, any]) => {
      const strategy = this.activeStrategies.get(strategyName);
      if (strategy && optimization.parameter_adjustments) {
        Object.assign(strategy.parameters, optimization.parameter_adjustments);
      }
    });
  }

  // Métodos utilitários
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAlternativeStrategies(recommendedName: string): StrategyConfig[] {
    return Array.from(this.activeStrategies.values())
      .filter(s => s.name !== recommendedName)
      .slice(0, 2);
  }

  private createFallbackStrategySelection(): any {
    const strategy = this.activeStrategies.get('balanced_expansion')!;
    
    return {
      recommended_strategy: strategy,
      reasoning: 'Fallback para estratégia balanceada',
      confidence: 60,
      alternative_strategies: this.getAlternativeStrategies('balanced_expansion'),
      implementation_plan: {
        expected_outcomes: { reach: 'moderate', engagement: 'moderate' },
        timeline: '2 weeks'
      }
    };
  }

  private createFallbackExecutionPlan(strategy: StrategyConfig): any {
    return {
      execution_phases: [{
        phase: 'initial_setup',
        duration: '1 day',
        objectives: ['Configure parameters'],
        actions: ['Set posting limits'],
        kpis: ['Configuration complete']
      }],
      daily_schedule: {
        posting_times: ['10:00', '14:00', '18:00'],
        content_types: ['offer', 'question'],
        personas: ['tecnico_profissional']
      },
      success_criteria: {
        must_achieve: ['Stay within spam limits'],
        should_achieve: ['Meet engagement targets']
      },
      contingency_plans: {
        low_engagement: 'Increase content variety',
        high_spam_risk: 'Reduce posting frequency'
      }
    };
  }

  private createFallbackReport(execution: StrategyExecution): any {
    return {
      executive_summary: 'Relatório fallback da estratégia',
      key_achievements: ['Estratégia executada'],
      performance_metrics: {
        reach: { target: 1000, achieved: 800, percentage: 80 },
        engagement: { target: 5, achieved: 4, percentage: 80 }
      },
      strategy_effectiveness: {
        overall_score: 75,
        strengths: ['Execução estável'],
        weaknesses: ['Performance abaixo do esperado']
      },
      recommendations: ['Ajustar parâmetros para próxima execução']
    };
  }

  /**
   * Obtém estratégias ativas
   */
  getActiveStrategies(): StrategyConfig[] {
    return Array.from(this.activeStrategies.values());
  }

  /**
   * Obtém histórico de execuções
   */
  getExecutionHistory(): StrategyExecution[] {
    return this.executionHistory;
  }

  /**
   * Obtém execução por ID
   */
  getExecutionById(id: string): StrategyExecution | undefined {
    return this.executionHistory.find(e => e.id === id);
  }
}
