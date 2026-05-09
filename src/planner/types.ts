export type PostType = 'promotion' | 'educational' | 'engagement' | 'institutional';

export interface PostPlan {
  type: PostType;
  priority: number;
  description: string;
}

/**
 * Planejamento diário simples de conteúdo
 * Evita IA complexa, apenas sequência previsível
 */
export const DAILY_PLAN: PostPlan[] = [
  { type: 'engagement', priority: 1, description: 'Pergunta/Interação com comunidade' },
  { type: 'educational', priority: 2, description: 'Contúdo educativo sobre ferramentas' },
  { type: 'promotion', priority: 3, description: 'Promoção de produto específico' },
  { type: 'promotion', priority: 4, description: 'Segunda promoção do dia' }
];

export class ContentPlanner {
  private currentIndex: number = 0;

  /**
   * Retorna próximo tipo de post baseado no plano diário
   */
  getNextPostType(): PostType {
    const postType = DAILY_PLAN[this.currentIndex].type;
    
    // Avançar para o próximo post (circular)
    this.currentIndex = (this.currentIndex + 1) % DAILY_PLAN.length;
    
    return postType;
  }

  /**
   * Retorna plano completo
   */
  getDailyPlan(): PostPlan[] {
    return [...DAILY_PLAN];
  }

  /**
   * Reseta planejamento (novo dia)
   */
  reset(): void {
    this.currentIndex = 0;
  }

  /**
   * Retorna descrição do tipo de post
   */
  getPostTypeDescription(type: PostType): string {
    const plan = DAILY_PLAN.find(p => p.type === type);
    return plan?.description || 'Tipo de post desconhecido';
  }
}
