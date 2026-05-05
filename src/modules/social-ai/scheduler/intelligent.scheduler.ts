import { SocialPost } from '../types';

export interface ScheduleConfig {
  postingWindows: Array<{
    start: string; // HH:mm
    end: string;   // HH:mm
    priority: 'high' | 'medium' | 'low';
    maxPosts: number;
  }>;
  cooldownMinutes: {
    minimum: number;
    ideal: number;
    maximum: number;
  };
  dailyLimits: {
    minimum: number;
    maximum: number;
    optimal: number;
  };
  randomization: {
    enabled: boolean;
    varianceMinutes: number;
    avoidPatterns: boolean;
  };
}

export interface ScheduledPost {
  id: string;
  post: SocialPost;
  scheduledTime: Date;
  priority: 'high' | 'medium' | 'low';
  window: string;
  estimatedEngagement: number;
  spamRiskScore: number;
}

export interface ScheduleResult {
  success: boolean;
  scheduledPosts: ScheduledPost[];
  conflicts: Array<{
    postId: string;
    reason: string;
    suggestion: string;
  }>;
  recommendations: string[];
}

export class IntelligentScheduler {
  private config: ScheduleConfig;
  private postingHistory: Array<{
    time: Date;
    groupId: string;
    success: boolean;
    engagement: number;
  }> = [];

  constructor(config?: Partial<ScheduleConfig>) {
    this.config = {
      postingWindows: [
        { start: '08:00', end: '10:00', priority: 'high', maxPosts: 1 },   // Manhã - Vídeo
        { start: '12:00', end: '14:00', priority: 'high', maxPosts: 1 },   // Tarde - Oferta 1
        { start: '16:00', end: '18:00', priority: 'medium', maxPosts: 1 },  // Final tarde - Interação
        { start: '19:00', end: '22:00', priority: 'high', maxPosts: 1 }    // Noite - Oferta 2
      ],
      cooldownMinutes: {
        minimum: 25,
        ideal: 60,
        maximum: 90
      },
      dailyLimits: {
        minimum: 2,
        maximum: 4,
        optimal: 4
      },
      randomization: {
        enabled: true,
        varianceMinutes: 30,
        avoidPatterns: true
      },
      ...config
    };
  }

  async schedulePosts(posts: SocialPost[], targetDate?: Date): Promise<ScheduleResult> {
    const date = targetDate || new Date();
    const scheduledPosts: ScheduledPost[] = [];
    const conflicts: ScheduleResult['conflicts'] = [];
    const recommendations: string[] = [];

    console.log(`📅 Scheduling ${posts.length} posts for ${date.toDateString()}`);

    // Ordenar posts por prioridade e score de oportunidade
    const sortedPosts = posts.sort((a, b) => {
      const scoreA = this.calculatePriorityScore(a);
      const scoreB = this.calculatePriorityScore(b);
      return scoreB - scoreA;
    });

    // Verificar limites diários
    const todayPosts = this.getTodayPosts();
    if (todayPosts.length >= this.config.dailyLimits.maximum) {
      return {
        success: false,
        scheduledPosts: [],
        conflicts: [{
          postId: 'daily_limit',
          reason: `Limite diário atingido (${todayPosts.length}/${this.config.dailyLimits.maximum})`,
          suggestion: 'Aumentar para o próximo dia'
        }],
        recommendations: ['Considerar reduzir frequência ou aumentar limite diário']
      };
    }

    // Para cada janela de postagem
    for (const window of this.config.postingWindows) {
      const windowPosts = this.getPostsForWindow(sortedPosts, window);
      
      if (windowPosts.length === 0) continue;

      // Encontrar melhor horário dentro da janela
      const bestTime = this.findOptimalTime(window, date);
      
      for (const post of windowPosts.slice(0, window.maxPosts)) {
        // Verificar cooldown
        const lastPostTime = this.getLastPostTime();
        if (lastPostTime) {
          const minutesSinceLastPost = (bestTime.getTime() - lastPostTime.getTime()) / (1000 * 60);
          
          if (minutesSinceLastPost < this.config.cooldownMinutes.minimum) {
            conflicts.push({
              postId: post.id,
              reason: `Cooldown muito curto (${minutesSinceLastPost.toFixed(0)} min)`,
              suggestion: `Aguardar ${this.config.cooldownMinutes.minimum - minutesSinceLastPost.toFixed(0)} minutos`
            });
            continue;
          }
        }

        // Verificar cooldown do grupo
        const groupLastPost = this.getLastGroupPost(post.metadata.groupId);
        if (groupLastPost) {
          const hoursSinceLastGroupPost = (bestTime.getTime() - groupLastPost.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastGroupPost < 24) {
            conflicts.push({
              postId: post.id,
              reason: `Grupo em cooldown (${hoursSinceLastGroupPost.toFixed(1)}h)`,
              suggestion: `Aguardar ${(24 - hoursSinceLastGroupPost).toFixed(1)} horas`
            });
            continue;
          }
        }

        // Aplicar randomização se habilitado
        const scheduledTime = this.config.randomization.enabled 
          ? this.applyRandomization(bestTime, window)
          : bestTime;

        // Criar post agendado
        const scheduledPost: ScheduledPost = {
          id: post.id,
          post,
          scheduledTime,
          priority: window.priority,
          window: `${window.start}-${window.end}`,
          estimatedEngagement: this.estimateEngagement(post, scheduledTime),
          spamRiskScore: post.spamRiskScore?.score || 0
        };

        scheduledPosts.push(scheduledPost);

        // Remover post da lista de disponíveis
        const index = sortedPosts.indexOf(post);
        if (index > -1) {
          sortedPosts.splice(index, 1);
        }
      }
    }

    // Gerar recomendações
    recommendations.push(...this.generateRecommendations(scheduledPosts, conflicts));

    const success = scheduledPosts.length > 0;

    console.log(`✅ Scheduled ${scheduledPosts.length} posts, ${conflicts.length} conflicts`);
    
    return {
      success,
      scheduledPosts,
      conflicts,
      recommendations
    };
  }

  private calculatePriorityScore(post: SocialPost): number {
    let score = 0;

    // Score de oportunidade
    if (post.metadata.opportunityScore) {
      score += post.metadata.opportunityScore * 0.4;
    }

    // Score de spam (inverso - menor spam = maior prioridade)
    if (post.spamRiskScore) {
      score += (100 - post.spamRiskScore.score) * 0.3;
    }

    // Tipo de postagem
    const typeScores = {
      'offer': 30,
      'question': 25,
      'review': 20,
      'comparison': 15,
      'opinion': 10,
      'alert': 35,
      'discussion': 20,
      'experience': 25
    };
    
    score += typeScores[post.variationType as keyof typeof typeScores] || 10;

    // Histórico de engajamento
    const avgEngagement = this.getAverageEngagement(post.variationType);
    score += avgEngagement * 0.2;

    return score;
  }

  private getPostsForWindow(posts: SocialPost[], window: ScheduleConfig['postingWindows'][0]): SocialPost[] {
    // Mapear tipos de posts para janelas
    const windowTypes = {
      '08:00-10:00': ['video', 'alert'],        // Manhã - Vídeo
      '12:00-14:00': ['offer', 'comparison'],   // Tarde - Oferta 1
      '16:00-18:00': ['question', 'discussion', 'experience'], // Final tarde - Interação
      '19:00-22:00': ['offer', 'review', 'opinion'] // Noite - Oferta 2
    };

    const windowKey = `${window.start}-${window.end}`;
    const preferredTypes = windowTypes[windowKey as keyof typeof windowTypes] || [];

    return posts.filter(post => 
      preferredTypes.includes(post.variationType) || 
      preferredTypes.length === 0
    );
  }

  private findOptimalTime(window: ScheduleConfig['postingWindows'][0], date: Date): Date {
    const [startHour, startMinute] = window.start.split(':').map(Number);
    const [endHour, endMinute] = window.end.split(':').map(Number);

    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Encontrar horário ótimo baseado em histórico
    const bestHour = this.getBestPostingHour(window);
    
    const optimalTime = new Date(date);
    optimalTime.setHours(bestHour, 0, 0, 0);

    // Garantir que está dentro da janela
    if (optimalTime < startTime) {
      return startTime;
    }
    if (optimalTime > endTime) {
      return new Date(endTime.getTime() - (30 * 60 * 1000)); // 30min antes do fim
    }

    return optimalTime;
  }

  private getBestPostingHour(window: ScheduleConfig['postingWindows'][0]): number {
    // Baseado em histórico de engajamento
    const [startHour] = window.start.split(':').map(Number);
    const [endHour] = window.end.split(':').map(Number);

    // Simulação: horário médio da janela
    return Math.floor((startHour + endHour) / 2);
  }

  private applyRandomization(time: Date, window: ScheduleConfig['postingWindows'][0]): Date {
    const [startHour, startMinute] = window.start.split(':').map(Number);
    const [endHour, endMinute] = window.end.split(':').map(Number);

    const startTime = new Date(time);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(time);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Aplicar variação aleatória
    const variance = this.config.randomization.varianceMinutes * 60 * 1000; // Convert to ms
    const randomOffset = (Math.random() - 0.5) * 2 * variance;
    
    let randomizedTime = new Date(time.getTime() + randomOffset);

    // Garantir que ainda está dentro da janela
    if (randomizedTime < startTime) {
      randomizedTime = startTime;
    }
    if (randomizedTime > endTime) {
      randomizedTime = new Date(endTime.getTime() - (15 * 60 * 1000)); // 15min antes do fim
    }

    return randomizedTime;
  }

  private estimateEngagement(post: SocialPost, scheduledTime: Date): number {
    let baseEngagement = 100;

    // Fator horário
    const hour = scheduledTime.getHours();
    if (hour >= 19 && hour <= 21) baseEngagement *= 1.3; // Pico noturno
    else if (hour >= 12 && hour <= 14) baseEngagement *= 1.2; // Pico tarde
    else if (hour >= 8 && hour <= 10) baseEngagement *= 1.1; // Pico manhã

    // Fator tipo de post
    const typeMultipliers = {
      'video': 1.5,
      'question': 1.3,
      'offer': 1.2,
      'review': 1.1,
      'comparison': 1.0,
      'opinion': 0.9,
      'alert': 1.4,
      'discussion': 1.2,
      'experience': 1.1
    };

    baseEngagement *= typeMultipliers[post.variationType as keyof typeof typeMultipliers] || 1.0;

    // Fator histórico
    const historicalAverage = this.getAverageEngagement(post.variationType);
    baseEngagement = (baseEngagement + historicalAverage) / 2;

    return Math.round(baseEngagement);
  }

  private getLastPostTime(): Date | null {
    if (this.postingHistory.length === 0) return null;
    
    const sortedHistory = [...this.postingHistory].sort((a, b) => b.time.getTime() - a.time.getTime());
    return sortedHistory[0].time;
  }

  private getLastGroupPost(groupId: string): Date | null {
    const groupPosts = this.postingHistory.filter(post => post.groupId === groupId);
    if (groupPosts.length === 0) return null;
    
    const sortedGroupPosts = groupPosts.sort((a, b) => b.time.getTime() - a.time.getTime());
    return sortedGroupPosts[0].time;
  }

  private getTodayPosts(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.postingHistory.filter(post => post.time >= today).length;
  }

  private getAverageEngagement(postType: string): number {
    const typePosts = this.postingHistory.filter(post => 
      // Simulação - deveria vir dos dados reais
      true
    );
    
    if (typePosts.length === 0) return 100;
    
    const totalEngagement = typePosts.reduce((sum, post) => sum + post.engagement, 0);
    return totalEngagement / typePosts.length;
  }

  private generateRecommendations(scheduledPosts: ScheduledPost[], conflicts: ScheduleResult['conflicts']): string[] {
    const recommendations: string[] = [];

    if (scheduledPosts.length < this.config.dailyLimits.optimal) {
      recommendations.push(`Considere adicionar mais ${this.config.dailyLimits.optimal - scheduledPosts.length} posts para atingir o ótimo diário`);
    }

    if (conflicts.length > 0) {
      const cooldownConflicts = conflicts.filter(c => c.reason.includes('cooldown'));
      if (cooldownConflicts.length > 0) {
        recommendations.push('Ajustar intervalos entre posts para evitar conflitos de cooldown');
      }

      const groupConflicts = conflicts.filter(c => c.reason.includes('grupo'));
      if (groupConflicts.length > 0) {
        recommendations.push('Diversificar grupos ou aumentar intervalo entre posts do mesmo grupo');
      }
    }

    const highRiskPosts = scheduledPosts.filter(sp => sp.spamRiskScore > 60);
    if (highRiskPosts.length > 0) {
      recommendations.push('Revisar posts com alto risco de spam antes da publicação');
    }

    const lowEngagementPosts = scheduledPosts.filter(sp => sp.estimatedEngagement < 80);
    if (lowEngagementPosts.length > 0) {
      recommendations.push('Considerar otimizar posts com baixa estimativa de engajamento');
    }

    return recommendations;
  }

  async reschedulePost(postId: string, newTime: Date, reason?: string): Promise<ScheduleResult> {
    console.log(`🔄 Rescheduling post ${postId} to ${newTime.toISOString()}`);
    
    // Implementar lógica de reagendamento
    // Esta é uma implementação simplificada
    
    return {
      success: true,
      scheduledPosts: [],
      conflicts: [],
      recommendations: [`Post ${postId} reagendado com sucesso: ${reason || 'Solicitação do usuário'}`]
    };
  }

  getScheduleSummary(date?: Date): {
    totalPosts: number;
    scheduledPosts: number;
    conflicts: number;
    optimalCoverage: number;
    recommendations: string[];
  } {
    const targetDate = date || new Date();
    
    return {
      totalPosts: this.getTodayPosts(),
      scheduledPosts: 0, // Viria do banco de dados
      conflicts: 0,       // Viria do banco de dados
      optimalCoverage: 0, // Calculado baseado nas janelas preenchidas
      recommendations: []
    };
  }

  updateConfig(newConfig: Partial<ScheduleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Scheduler configuration updated');
  }

  getConfig(): ScheduleConfig {
    return { ...this.config };
  }
}

export const intelligentScheduler = new IntelligentScheduler();
