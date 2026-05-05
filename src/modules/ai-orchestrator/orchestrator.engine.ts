import { OllamaService } from '../social-ai/ollama/ollama.service';
import { Product, SocialPost } from '../../types';

export interface AIDecision {
  type: 'priority' | 'publication' | 'spam_control' | 'persona' | 'timing';
  confidence: number;
  reasoning: string;
  action: any;
  risk_level: 'low' | 'medium' | 'high';
}

export interface AutonomousAction {
  id: string;
  type: string;
  priority: number;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  ai_decision: AIDecision;
  human_review?: {
    approved: boolean;
    reviewer: string;
    timestamp: string;
    notes?: string;
  };
  created_at: string;
}

export class AIOrchestratorEngine {
  private ollamaService: OllamaService;
  private decisionHistory: AIDecision[] = [];
  private performanceMetrics: any = {};

  constructor() {
    this.ollamaService = new OllamaService();
  }

  /**
   * Cérebro operacional principal - Analisa e toma decisões
   */
  async analyzeAndDecide(context: {
    products: Product[];
    currentPosts: SocialPost[];
    systemStatus: any;
    recentPerformance: any;
  }): Promise<{
    decisions: AIDecision[];
    autonomousActions: AutonomousAction[];
    recommendations: string[];
    riskAssessment: any;
  }> {
    const decisions: AIDecision[] = [];
    const autonomousActions: AutonomousAction[] = [];

    // 1. Análise de Prioridade de Produtos
    const priorityDecisions = await this.analyzeProductPriorities(context.products);
    decisions.push(...priorityDecisions);

    // 2. Decisão de Quantidade de Posts
    const publicationDecision = await this.decidePublicationStrategy(context);
    decisions.push(publicationDecision);

    // 3. Controle de Spam
    const spamControl = await this.analyzeSpamRisk(context);
    decisions.push(spamControl);

    // 4. Seleção de Personas
    const personaDecisions = await this.selectOptimalPersonas(context);
    decisions.push(...personaDecisions);

    // 5. Timing e Agendamento
    const timingDecisions = await this.optimizeTiming(context);
    decisions.push(...timingDecisions);

    // Gerar ações autônomas baseadas nas decisões
    for (const decision of decisions) {
      if (decision.confidence > 0.8 && decision.risk_level !== 'high') {
        const action: AutonomousAction = {
          id: this.generateActionId(),
          type: decision.type,
          priority: this.calculatePriority(decision),
          status: 'pending',
          ai_decision: decision,
          created_at: new Date().toISOString()
        };
        autonomousActions.push(action);
      }
    }

    // Salvar histórico para aprendizado
    this.decisionHistory.push(...decisions);

    return {
      decisions,
      autonomousActions,
      recommendations: await this.generateRecommendations(context),
      riskAssessment: await this.assessOverallRisk(context)
    };
  }

  /**
   * Analisa prioridade de produtos baseado em múltiplos fatores
   */
  private async analyzeProductPriorities(products: Product[]): Promise<AIDecision[]> {
    const decisions: AIDecision[] = [];

    for (const product of products) {
      const prompt = `
Analise este produto para mídia social afiliada:

Produto: ${product.title}
Preço: R$${product.price}
Desconto: ${product.discount}%
Marca: ${product.brand}
Categoria: ${product.category}
Score IA: ${product.ai_score}

Considere:
- Desconto atraente (>20% = alta prioridade)
- Marca reconhecida (Bosch, Makita, etc)
- Score IA (>80 = bom potencial)
- Categoria popular (ferramentas, acessórios)
- Histórico de engajamento

Retorne JSON:
{
  "priority_score": 0-100,
  "reasoning": "explicação detalhada",
  "recommended_actions": ["ação1", "ação2"],
  "best_posting_time": "HH:MM",
  "suggested_persona": "tipo",
  "spam_risk": "low|medium|high"
}
      `;

      try {
        const response = await this.ollamaService.generateText(prompt, 'deepseek');
        const analysis = JSON.parse(response);

        decisions.push({
          type: 'priority',
          confidence: analysis.priority_score / 100,
          reasoning: analysis.reasoning,
          action: {
            product_id: product.id,
            priority_score: analysis.priority_score,
            recommended_actions: analysis.recommended_actions,
            best_time: analysis.best_posting_time,
            suggested_persona: analysis.suggested_persona
          },
          risk_level: analysis.spam_risk
        });
      } catch (error) {
        console.error('Error analyzing product priority:', error);
      }
    }

    return decisions;
  }

  /**
   * Decide estratégia de publicação dinamicamente
   */
  private async decidePublicationStrategy(context: any): Promise<AIDecision> {
    const prompt = `
Analise o contexto atual para decidir estratégia de publicação:

Status Sistema:
- Posts hoje: ${context.currentPosts?.length || 0}
- Score spam médio: ${context.systemStatus?.spamScore || 0}
- Engajamento recente: ${context.recentPerformance?.engagement || 0}
- Warnings Meta: ${context.systemStatus?.metaWarnings || 0}
- Cooldown grupos ativos: ${context.systemStatus?.activeCooldowns || 0}

Regras:
- Safe: 2-4 posts/dia (baixo risco)
- Moderate: 5-6 posts/dia (risco médio)  
- Aggressive: 7-8 posts/dia (alto risco)

Retorne JSON:
{
  "strategy": "safe|moderate|aggressive",
  "recommended_posts": número,
  "reasoning": "explicação",
  "risk_factors": ["fator1", "fator2"],
  "confidence": 0-100,
  "timing_distribution": {
    "manhã": número,
    "tarde": número,
    "noite": número
  }
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      const strategy = JSON.parse(response);

      return {
        type: 'publication',
        confidence: strategy.confidence / 100,
        reasoning: strategy.reasoning,
        action: {
          strategy: strategy.strategy,
          recommended_posts: strategy.recommended_posts,
          timing_distribution: strategy.timing_distribution,
          risk_factors: strategy.risk_factors
        },
        risk_level: strategy.strategy === 'aggressive' ? 'high' : 
                   strategy.strategy === 'moderate' ? 'medium' : 'low'
      };
    } catch (error) {
      console.error('Error deciding publication strategy:', error);
      return {
        type: 'publication',
        confidence: 0.5,
        reasoning: 'Fallback para estratégia segura',
        action: { strategy: 'safe', recommended_posts: 3 },
        risk_level: 'low'
      };
    }
  }

  /**
   * Análise avançada de risco de spam
   */
  private async analyzeSpamRisk(context: any): Promise<AIDecision> {
    const recentPosts = context.currentPosts || [];
    
    const riskFactors = {
      excessive_promotion: recentPosts.filter(p => p.type === 'offer').length > 3,
      repetitive_cta: this.checkRepetitiveCTA(recentPosts),
      link_frequency: this.checkLinkFrequency(recentPosts),
      timing_risk: this.checkTimingRisk(recentPosts),
      content_fatigue: this.checkContentFatigue(recentPosts)
    };

    const totalRisk = Object.values(riskFactors).filter(Boolean).length;
    const riskLevel = totalRisk >= 3 ? 'high' : totalRisk >= 2 ? 'medium' : 'low';

    return {
      type: 'spam_control',
      confidence: 0.9,
      reasoning: `Análise de ${totalRisk} fatores de risco detectados`,
      action: {
        risk_factors: riskFactors,
        should_block: totalRisk >= 3,
        recommended_cooldown: totalRisk >= 2 ? 30 : 15,
        safe_content_types: this.getSafeContentTypes(recentPosts)
      },
      risk_level: riskLevel
    };
  }

  /**
   * Seleção ótima de personas baseada em contexto
   */
  private async selectOptimalPersonas(context: any): Promise<AIDecision[]> {
    const personas = [
      'tecnico_profissional',
      'mecanico_raiz', 
      'especialista_bosch',
      'cacador_promocoes',
      'review_honesto',
      'influenciador_ferramentas'
    ];

    const decisions: AIDecision[] = [];

    for (const persona of personas) {
      const prompt = `
Analise se a persona "${persona}" é ideal para o contexto atual:

Produtos em destaque: ${context.products?.slice(0, 3).map(p => p.title).join(', ')}
Performance recente: ${JSON.stringify(context.recentPerformance)}
Horário atual: ${new Date().getHours()}:00

Retorne JSON:
{
  "suitability_score": 0-100,
  "reasoning": "porquê esta persona funciona",
  "best_content_types": ["tipo1", "tipo2"],
  "optimal_timing": "HH:MM"
}
      `;

      try {
        const response = await this.ollamaService.generateText(prompt, 'mistral');
        const analysis = JSON.parse(response);

        if (analysis.suitability_score > 70) {
          decisions.push({
            type: 'persona',
            confidence: analysis.suitability_score / 100,
            reasoning: analysis.reasoning,
            action: {
              persona: persona,
              suitability_score: analysis.suitability_score,
              best_content_types: analysis.best_content_types,
              optimal_timing: analysis.optimal_timing
            },
            risk_level: 'low'
          });
        }
      } catch (error) {
        console.error(`Error analyzing persona ${persona}:`, error);
      }
    }

    return decisions;
  }

  /**
   * Otimização de timing e agendamento
   */
  private async optimizeTiming(context: any): Promise<AIDecision[]> {
    const decisions: AIDecision[] = [];
    const hours = [8, 10, 12, 14, 16, 18, 20, 22];

    for (const hour of hours) {
      const prompt = `
Analise o horário ${hour}:00 para publicação:

Horário: ${hour}:00
Dia da semana: ${new Date().getDay()}
Posts recentes neste horário: ${context.recentPerformance?.byHour?.[hour] || 0}
Engajamento médio neste horário: ${context.recentPerformance?.engagementByHour?.[hour] || 0}

Retorne JSON:
{
  "optimal_score": 0-100,
  "reasoning": "análise do horário",
  "recommended_content": "tipo ideal",
  "expected_engagement": "baixo|médio|alto",
  "spam_risk": "low|medium|high"
}
      `;

      try {
        const response = await this.ollamaService.generateText(prompt, 'phi');
        const analysis = JSON.parse(response);

        decisions.push({
          type: 'timing',
          confidence: analysis.optimal_score / 100,
          reasoning: analysis.reasoning,
          action: {
            hour: hour,
            optimal_score: analysis.optimal_score,
            recommended_content: analysis.recommended_content,
            expected_engagement: analysis.expected_engagement
          },
          risk_level: analysis.spam_risk
        });
      } catch (error) {
        console.error(`Error analyzing timing for ${hour}:00:`, error);
      }
    }

    return decisions;
  }

  /**
   * Gera recomendações baseadas em análise completa
   */
  private async generateRecommendations(context: any): Promise<string[]> {
    const prompt = `
Baseado na análise completa do sistema, gere 5 recomendações acionáveis:

Contexto:
- ${context.products?.length || 0} produtos analisados
- ${context.currentPosts?.length || 0} posts recentes
- Score spam: ${context.systemStatus?.spamScore || 0}
- Performance: ${JSON.stringify(context.recentPerformance)}

Retorne array JSON com recomendações específicas e acionáveis.
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      return JSON.parse(response);
    } catch (error) {
      return [
        'Manter estratégia segura de publicação',
        'Monitorar score spam nas próximas horas',
        'Diversificar tipos de conteúdo',
        'Analisar melhor horário para publicação',
        'Revisar personas atuais'
      ];
    }
  }

  /**
   * Avaliação geral de risco do sistema
   */
  private async assessOverallRisk(context: any): Promise<any> {
    return {
      overall_score: this.calculateOverallRisk(context),
      critical_factors: this.identifyCriticalFactors(context),
      recommended_actions: this.getRecommendedActions(context),
      monitoring_points: this.getMonitoringPoints(context)
    };
  }

  // Métodos utilitários
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculatePriority(decision: AIDecision): number {
    return Math.round(decision.confidence * 100);
  }

  private checkRepetitiveCTA(posts: any[]): boolean {
    // Implementar lógica de detecção de CTA repetitivo
    return false;
  }

  private checkLinkFrequency(posts: any[]): boolean {
    // Implementar lógica de frequência de links
    return false;
  }

  private checkTimingRisk(posts: any[]): boolean {
    // Implementar lógica de risco de timing
    return false;
  }

  private checkContentFatigue(posts: any[]): boolean {
    // Implementar lógica de fadiga de conteúdo
    return false;
  }

  private getSafeContentTypes(posts: any[]): string[] {
    return ['question', 'review', 'technical_tip'];
  }

  private calculateOverallRisk(context: any): number {
    // Implementar cálculo de risco geral
    return 25;
  }

  private identifyCriticalFactors(context: any): string[] {
    return [];
  }

  private getRecommendedActions(context: any): string[] {
    return [];
  }

  private getMonitoringPoints(context: any): string[] {
    return [];
  }
}
