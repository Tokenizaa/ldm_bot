import { OllamaService } from '../social-ai/ollama/ollama.service';

export interface InteractionContent {
  id: string;
  type: 'poll' | 'question' | 'comparison' | 'event' | 'discussion' | 'curiosity';
  title: string;
  content: string;
  options?: string[]; // Para enquetes
  hashtags: string[];
  engagement_prediction: number;
  spam_score: number;
  target_audience: string;
  persona: string;
  created_at: string;
}

export interface InteractionTemplate {
  id: string;
  type: 'poll' | 'question' | 'comparison' | 'event' | 'discussion' | 'curiosity';
  template: string;
  variables: string[];
  engagement_prediction: number;
  persona: string;
  category: string;
}

export class InteractionEngine {
  private ollamaService: OllamaService;
  private templates: InteractionTemplate[];
  private recentInteractions: InteractionContent[];
  private engagementHistory: Map<string, number>;

  constructor() {
    this.ollamaService = new OllamaService();
    this.templates = [];
    this.recentInteractions = [];
    this.engagementHistory = new Map();
    this.initializeTemplates();
  }

  /**
   * Inicializa templates de interação
   */
  private initializeTemplates(): void {
    const baseTemplates = [
      // Enquetes
      {
        id: 'poll_favorite_tool',
        type: 'poll' as const,
        template: '🔧 Qual sua ferramenta preferida para {situation}? Vote nos comentários!\n\n🔩 Opção 1: {option1}\n⚡ Opção 2: {option2}\n🛠️ Opção 3: {option3}\n\nCompartilhe sua experiência! 👇 #Enquete #Ferramentas',
        variables: ['situation', 'option1', 'option2', 'option3'],
        engagement_prediction: 85,
        persona: 'mecanico_raiz',
        category: 'ferramentas'
      },
      {
        id: 'poll_brand_preference',
        type: 'poll' as const,
        template: '⚡ Qual marca você confia mais para {category}? \n\n🔋 {brand1}\n🔧 {brand2}\n🛠️ {brand3}\n\nVote e justifique! 🤔 #Marcas #Qualidade',
        variables: ['category', 'brand1', 'brand2', 'brand3'],
        engagement_prediction: 78,
        persona: 'tecnico_profissional',
        category: 'marcas'
      },
      // Perguntas
      {
        id: 'question_daily_challenge',
        type: 'question' as const,
        template: '🤔 Desafio do dia: Qual o maior problema que você enfrentou com {equipment}? Como resolveu? Compartilhe sua experiência para ajudar a comunidade! 💬 #Desafio #Soluções',
        variables: ['equipment'],
        engagement_prediction: 82,
        persona: 'tecnico_profissional',
        category: 'problemas'
      },
      {
        id: 'question_technique_tip',
        type: 'question' as const,
        template: '💡 Qual sua melhor dica para {technique}? Compartilhe seu segredo profissional nos comentários! Vamos criar um guia colaborativo! 👨‍🔧 #Dicas #Profissional',
        variables: ['technique'],
        engagement_prediction: 88,
        persona: 'tecnico_profissional',
        category: 'técnicas'
      },
      // Comparativos
      {
        id: 'comparison_tools',
        type: 'comparison' as const,
        template: '⚖️ VS: {tool1} vs {tool2}\n\nQual você prefere e por quê? \n\n💪 Pontos fortes do {tool1}: {strengths1}\n🔥 Pontos fortes do {tool2}: {strengths2}\n\nDebate construtivo! 👇 #Comparativo #Ferramentas',
        variables: ['tool1', 'tool2', 'strengths1', 'strengths2'],
        engagement_prediction: 90,
        persona: 'review_honesto',
        category: 'comparativos'
      },
      // Eventos
      {
        id: 'event_live_qa',
        type: 'event' as const,
        template: '🎤 AO VIVO HOJE! Sessão de Q&A sobre {topic} às {time}! \n\nDeixe sua pergunta nos comentários! 📝 \n\nParticipe e tire suas dúvidas! 🚀 #AoVivo #QA',
        variables: ['topic', 'time'],
        engagement_prediction: 75,
        persona: 'influenciador_ferramentas',
        category: 'eventos'
      },
      // Discussões
      {
        id: 'discussion_future_trends',
        type: 'discussion' as const,
        template: '🔮 O futuro da {area}: O que você espera para os próximos anos? \n\n📈 Tendências que apostaria:\n• {trend1}\n• {trend2}\n• {trend3}\n\nQual sua opinião? Comente! 👇 #Tendências #Futuro',
        variables: ['area', 'trend1', 'trend2', 'trend3'],
        engagement_prediction: 70,
        persona: 'tecnico_profissional',
        category: 'tendências'
      },
      // Curiosidades
      {
        id: 'curiosity_fun_fact',
        type: 'curiosity' as const,
        template: '🧠 SABIA QUE? {fun_fact}! \n\nEssa curiosidade sobre {topic} mostra como a {area} evoluiu! \n\nQual outra curiosidade você conhece? Compartilhe! 🤓 #Curiosidade #História',
        variables: ['fun_fact', 'topic', 'area'],
        engagement_prediction: 80,
        persona: 'mecanico_raiz',
        category: 'curiosidades'
      }
    ];

    this.templates = baseTemplates.map(template => ({
      ...template,
      id: `${template.type}_${template.id}`
    }));
  }

  /**
   * Gera conteúdo de interação automático
   */
  async generateInteraction(context: {
    target_audience: string;
    time_of_day: string;
    recent_topics?: string[];
    engagement_goal?: 'high' | 'medium' | 'low';
    persona_preference?: string;
  }): Promise<InteractionContent> {
    // 1. Selecionar tipo de interação ideal
    const interactionType = this.selectInteractionType(context);

    // 2. Filtrar templates disponíveis
    const availableTemplates = this.templates.filter(t => 
      t.type === interactionType && 
      this.isTemplateSuitable(t, context)
    );

    if (availableTemplates.length === 0) {
      return this.generateFallbackInteraction(interactionType);
    }

    // 3. Selecionar template aleatório ou baseado em performance
    const selectedTemplate = this.selectOptimalTemplate(availableTemplates, context);

    // 4. Preencher variáveis com IA
    const filledTemplate = await this.fillTemplateVariables(selectedTemplate, context);

    // 5. Calcular métricas
    const metrics = await this.calculateInteractionMetrics(filledTemplate, context);

    // 6. Salvar no histórico
    const interaction: InteractionContent = {
      id: `interaction_${Date.now()}`,
      type: interactionType,
      title: this.extractTitle(filledTemplate),
      content: filledTemplate,
      hashtags: this.extractHashtags(filledTemplate),
      engagement_prediction: metrics.engagement_prediction,
      spam_score: metrics.spam_score,
      target_audience: context.target_audience,
      persona: selectedTemplate.persona,
      created_at: new Date().toISOString()
    };

    this.recentInteractions.push(interaction);
    this.updateEngagementHistory(interaction);

    return interaction;
  }

  /**
   * Seleciona tipo de interação ideal
   */
  private selectInteractionType(context: any): 'poll' | 'question' | 'comparison' | 'event' | 'discussion' | 'curiosity' {
    const timeOfDay = context.time_of_day;
    const engagementGoal = context.engagement_goal || 'medium';

    // Lógica de seleção baseada em contexto
    if (timeOfDay === 'morning') {
      return 'poll'; // Enquetes funcionam bem pela manhã
    } else if (timeOfDay === 'afternoon') {
      return 'question'; // Perguntas boas à tarde
    } else if (timeOfDay === 'evening') {
      return 'discussion'; // Discussões para engajamento noturno
    }

    // Baseado no objetivo de engajamento
    if (engagementGoal === 'high') {
      return 'comparison'; // Comparativos geram muito debate
    } else if (engagementGoal === 'low') {
      return 'curiosity'; // Curiosidades são mais leves
    }

    return 'poll'; // Default
  }

  /**
   * Verifica se template é adequado ao contexto
   */
  private isTemplateSuitable(template: InteractionTemplate, context: any): boolean {
    // Verificar se a persona é preferida
    if (context.persona_preference && template.persona !== context.persona_preference) {
      return false;
    }

    // Verificar se não foi usado recentemente
    const recentSimilar = this.recentInteractions.filter(interaction => 
      interaction.type === template.type && 
      new Date(interaction.created_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)
    );

    if (recentSimilar.length > 2) {
      return false;
    }

    return true;
  }

  /**
   * Seleciona template ótimo
   */
  private selectOptimalTemplate(
    templates: InteractionTemplate[],
    context: any
  ): InteractionTemplate {
    // Priorizar templates com maior predição de engajamento
    const sortedTemplates = templates.sort((a, b) => b.engagement_prediction - a.engagement_prediction);
    
    // Se houver preferência de persona, filtrar
    if (context.persona_preference) {
      const personaTemplates = sortedTemplates.filter(t => t.persona === context.persona_preference);
      if (personaTemplates.length > 0) {
        return personaTemplates[0];
      }
    }

    return sortedTemplates[0];
  }

  /**
   * Preenche variáveis do template com IA
   */
  private async fillTemplateVariables(
    template: InteractionTemplate,
    context: any
  ): Promise<string> {
    const prompt =`
Preencha as variáveis deste template de interação:

TEMPLATE: ${template.template}
TIPO: ${template.type}
PERSONA: ${template.persona}
CATEGORIA: ${template.category}
PÚBLICO: ${context.target_audience}

VARIÁVEIS NECESSÁRIAS: ${template.variables.join(', ')}

REGRAS:
- Máximo 280 caracteres total
- Tom adequado à persona
- Engajador e natural
- Evite repetição de temas recentes
- Se for enquete, opções devem ser distintas

Retorne apenas o template preenchido, sem JSON:
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return response.trim().substring(0, 280);
    } catch (error) {
      console.error('Error filling template variables:', error);
      return this.fillTemplateFallback(template);
    }
  }

  /**
   * Calcula métricas da interação
   */
  private async calculateInteractionMetrics(
    content: string,
    context: any
  ): Promise<{ engagement_prediction: number; spam_score: number }> {
    const prompt =`
Analise este conteúdo de interação para redes sociais:

CONTEÚDO: "${content}"
TIPO: ${context.type || 'interaction'}
PÚBLICO: ${context.target_audience}

Retorne JSON com métricas:
{
  "engagement_prediction": 0-100,
  "spam_score": 0-100,
  "suggestions": ["sugestão1", "sugestão2"]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      const result = JSON.parse(response);
      
      return {
        engagement_prediction: result.engagement_prediction,
        spam_score: result.spam_score
      };
    } catch (error) {
      console.error('Error calculating interaction metrics:', error);
      return {
        engagement_prediction: 75,
        spam_score: 15
      };
    }
  }

  /**
   * Gera enquete específica
   */
  async generatePoll(topic: string, options: string[]): Promise<InteractionContent> {
    const pollTemplate = this.templates.find(t => t.type === 'poll');
    
    if (!pollTemplate) {
      return this.generateFallbackInteraction('poll');
    }

    const filledContent = await this.fillPollTemplate(pollTemplate, topic, options);
    const metrics = await this.calculateInteractionMetrics(filledContent, { type: 'poll' });

    return {
      id: `poll_${Date.now()}`,
      type: 'poll',
      title: `Enquete: ${topic}`,
      content: filledContent,
      options,
      hashtags: this.extractHashtags(filledContent),
      engagement_prediction: metrics.engagement_prediction,
      spam_score: metrics.spam_score,
      target_audience: 'Mecânicos Brasil',
      persona: pollTemplate.persona,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Gera pergunta específica
   */
  async generateQuestion(topic: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<InteractionContent> {
    const questionTemplate = this.templates.find(t => t.type === 'question');
    
    if (!questionTemplate) {
      return this.generateFallbackInteraction('question');
    }

    const filledContent = await this.fillQuestionTemplate(questionTemplate, topic, difficulty);
    const metrics = await this.calculateInteractionMetrics(filledContent, { type: 'question' });

    return {
      id: `question_${Date.now()}`,
      type: 'question',
      title: `Pergunta: ${topic}`,
      content: filledContent,
      hashtags: this.extractHashtags(filledContent),
      engagement_prediction: metrics.engagement_prediction,
      spam_score: metrics.spam_score,
      target_audience: 'Mecânicos Brasil',
      persona: questionTemplate.persona,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Gera comparativo específico
   */
  async generateComparison(item1: string, item2: string): Promise<InteractionContent> {
    const comparisonTemplate = this.templates.find(t => t.type === 'comparison');
    
    if (!comparisonTemplate) {
      return this.generateFallbackInteraction('comparison');
    }

    const filledContent = await this.fillComparisonTemplate(comparisonTemplate, item1, item2);
    const metrics = await this.calculateInteractionMetrics(filledContent, { type: 'comparison' });

    return {
      id: `comparison_${Date.now()}`,
      type: 'comparison',
      title: `Comparativo: ${item1} vs ${item2}`,
      content: filledContent,
      hashtags: this.extractHashtags(filledContent),
      engagement_prediction: metrics.engagement_prediction,
      spam_score: metrics.spam_score,
      target_audience: 'Mecânicos Brasil',
      persona: comparisonTemplate.persona,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Gera evento específico
   */
  async generateEvent(topic: string, dateTime: string): Promise<InteractionContent> {
    const eventTemplate = this.templates.find(t => t.type === 'event');
    
    if (!eventTemplate) {
      return this.generateFallbackInteraction('event');
    }

    const filledContent = await this.fillEventTemplate(eventTemplate, topic, dateTime);
    const metrics = await this.calculateInteractionMetrics(filledContent, { type: 'event' });

    return {
      id: `event_${Date.now()}`,
      type: 'event',
      title: `Evento: ${topic}`,
      content: filledContent,
      hashtags: this.extractHashtags(filledContent),
      engagement_prediction: metrics.engagement_prediction,
      spam_score: metrics.spam_score,
      target_audience: 'Mecânicos Brasil',
      persona: eventTemplate.persona,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Preenche template de enquete
   */
  private async fillPollTemplate(template: InteractionTemplate, topic: string, options: string[]): Promise<string> {
    const prompt =`
Preencha este template de enquete:

TEMPLATE: ${template.template}
TÓPICO: ${topic}
OPÇÕES: ${options.join(', ')}

Retorne apenas a enquete preenchida, mantendo o formato de opções numeradas ou com emojis.
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return response.trim().substring(0, 280);
    } catch (error) {
      console.error('Error filling poll template:', error);
      return `🔧 Enquete sobre ${topic}!\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nVote nos comentários! 👇 #Enquete`;
    }
  }

  /**
   * Preenche template de pergunta
   */
  private async fillQuestionTemplate(template: InteractionTemplate, topic: string, difficulty: string): Promise<string> {
    const prompt =`
Preencha este template de pergunta:

TEMPLATE: ${template.template}
TÓPICO: ${topic}
DIFICULDADE: ${difficulty}

Retorne apenas a pergunta preenchida, adequada para a dificuldade especificada.
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return response.trim().substring(0, 280);
    } catch (error) {
      console.error('Error filling question template:', error);
      return `🤔 Pergunta sobre ${topic}: ${difficulty === 'easy' ? 'Fácil' : difficulty === 'hard' ? 'Difícil' : 'Médio'}. Compartilhe sua resposta! 💬 #Pergunta`;
    }
  }

  /**
   * Preenche template de comparativo
   */
  private async fillComparisonTemplate(template: InteractionTemplate, item1: string, item2: string): Promise<string> {
    const prompt =`
Preencha este template de comparativo:

TEMPLATE: ${template.template}
ITEM 1: ${item1}
ITEM 2: ${item2}

Retorne apenas o comparativo preenchido, destacando pontos fortes de cada item.
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return response.trim().substring(0, 280);
    } catch (error) {
      console.error('Error filling comparison template:', error);
      return `⚖️ VS: ${item1} vs ${item2}\n\nQual você prefere? Comente sua escolha! 👇 #Comparativo`;
    }
  }

  /**
   * Preenche template de evento
   */
  private async fillEventTemplate(template: InteractionTemplate, topic: string, dateTime: string): Promise<string> {
    const prompt =`
Preencha este template de evento:

TEMPLATE: ${template.template}
TÓPICO: ${topic}
DATA/HORA: ${dateTime}

Retorne apenas o evento preenchido, com chamada clara para participação.
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return response.trim().substring(0, 280);
    } catch (error) {
      console.error('Error filling event template:', error);
      return `🎤 EVENTO: ${topic}\n\n📅 ${dateTime}\n\nParticipe! Deixe sua pergunta nos comentários! 🚀 #Evento`;
    }
  }

  /**
   * Extrai título do conteúdo
   */
  private extractTitle(content: string): string {
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    
    // Remover emojis e caracteres especiais do título
    const cleanTitle = firstLine.replace(/[^\w\s]/g, '').trim();
    
    return cleanTitle.length > 50 ? cleanTitle.substring(0, 50) + '...' : cleanTitle;
  }

  /**
   * Extrai hashtags do conteúdo
   */
  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#\w+/g;
    const matches = content.match(hashtagRegex);
    return matches || [];
  }

  /**
   * Atualiza histórico de engajamento
   */
  private updateEngagementHistory(interaction: InteractionContent): void {
    const key = `${interaction.type}_${interaction.persona}`;
    const current = this.engagementHistory.get(key) || 0;
    this.engagementHistory.set(key, current + interaction.engagement_prediction);
  }

  /**
   * Gera interação fallback
   */
  private generateFallbackInteraction(type: string): InteractionContent {
    const fallbacks = {
      poll: {
        title: 'Enquete Rápida',
        content: '🔧 Qual ferramenta você mais usa? Vote nos comentários!\n\n1. Chave de fenda\n2. Alicate\n3. Martelo\n\nCompartilhe! 👇 #Enquete #Ferramentas',
        hashtags: ['#Enquete', '#Ferramentas']
      },
      question: {
        title: 'Pergunta do Dia',
        content: '🤔 Qual o maior desafio que você enfrenta na oficina? Compartilhe sua experiência! 💬 #Pergunta #Mecânica',
        hashtags: ['#Pergunta', '#Mecânica']
      },
      comparison: {
        title: 'Comparativo Rápido',
        content: '⚖️ VS: Ferramentas manuais vs elétricas\n\nQual você prefere? Comente! 👇 #Comparativo #Ferramentas',
        hashtags: ['#Comparativo', '#Ferramentas']
      },
      event: {
        title: 'Evento Comunitário',
        content: '🎤 Participe da nossa discussão! Deixe sua dúvida nos comentários! 📝 #Comunidade #Discussão',
        hashtags: ['#Comunidade', '#Discussão']
      },
      discussion: {
        title: 'Discussão Aberta',
        content: '💭 Qual sua opinião sobre o futuro das ferramentas? Comente! 👇 #Discussão #Futuro',
        hashtags: ['#Discussão', '#Futuro']
      },
      curiosity: {
        title: 'Curiosidade',
        content: '🧠 Você sabia que a primeira ferramenta foi criada há milhares de anos? Compartilhe outra curiosidade! 🤓 #Curiosidade #História',
        hashtags: ['#Curiosidade', '#História']
      }
    };

    const fallback = fallbacks[type as keyof typeof fallbacks] || fallbacks.poll;

    return {
      id: `fallback_${type}_${Date.now()}`,
      type: type as any,
      title: fallback.title,
      content: fallback.content,
      hashtags: fallback.hashtags,
      engagement_prediction: 70,
      spam_score: 15,
      target_audience: 'Mecânicos Brasil',
      persona: 'mecanico_raiz',
      created_at: new Date().toISOString()
    };
  }

  /**
   * Preenche template fallback
   */
  private fillTemplateFallback(template: InteractionTemplate): string {
    const fallbacks = {
      poll: '🔧 Qual sua ferramenta preferida? Vote nos comentários! 👇 #Enquete',
      question: '🤔 Qual seu maior desafio? Compartilhe! 💬 #Pergunta',
      comparison: '⚖️ Qual você prefere? Comente! 👇 #Comparativo',
      event: '🎤 Participe! Deixe seu comentário! 📝 #Evento',
      discussion: '💭 Qual sua opinião? Comente! 👇 #Discussão',
      curiosity: '🧠 Você sabia? Compartilhe! 🤓 #Curiosidade'
    };

    return fallbacks[template.type as keyof typeof fallbacks] || fallbacks.poll;
  }

  /**
   * Obtém interações recentes
   */
  getRecentInteractions(limit: number = 10): InteractionContent[] {
    return this.recentInteractions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Obtém melhor performando por tipo
   */
  getBestPerformingByType(type: string): InteractionContent | null {
    const typeInteractions = this.recentInteractions.filter(i => i.type === type);
    
    if (typeInteractions.length === 0) return null;

    return typeInteractions.sort((a, b) => b.engagement_prediction - a.engagement_prediction)[0];
  }

  /**
   * Obtém estatísticas de engajamento
   */
  getEngagementStats(): {
    total_interactions: number;
    avg_engagement: number;
    best_type: string;
    best_persona: string;
    type_distribution: Record<string, number>;
  } {
    const total = this.recentInteractions.length;
    const avgEngagement = total > 0 ? 
      this.recentInteractions.reduce((sum, i) => sum + i.engagement_prediction, 0) / total : 0;

    // Melhor tipo
    const typeStats = this.recentInteractions.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const bestType = Object.entries(typeStats)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'poll';

    // Melhor persona
    const personaStats = this.recentInteractions.reduce((acc, i) => {
      acc[i.persona] = (acc[i.persona] || 0) + i.engagement_prediction;
      return acc;
    }, {} as Record<string, number>);
    
    const bestPersona = Object.entries(personaStats)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'mecanico_raiz';

    return {
      total_interactions: total,
      avg_engagement: Math.round(avgEngagement),
      best_type: bestType,
      best_persona: bestPersona,
      type_distribution: typeStats
    };
  }

  /**
   * Exporta dados do engine
   */
  exportEngineData(): {
    templates: InteractionTemplate[];
    recentInteractions: InteractionContent[];
    engagementHistory: Map<string, number>;
  } {
    return {
      templates: this.templates,
      recentInteractions: this.recentInteractions,
      engagementHistory: this.engagementHistory
    };
  }
}
