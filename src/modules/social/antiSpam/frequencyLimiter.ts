import { AntiSpamConfig, FrequencyCheck, GroupCooldown } from './types';

export class FrequencyLimiter {
  private config: AntiSpamConfig['frequency'];
  private postsToday: Map<string, Date> = new Map();
  private groupLastPosts: Map<string, Date> = new Map();
  private consecutivePromos: number = 0;
  private lastNonPromoTime?: Date;

  constructor(config: AntiSpamConfig['frequency']) {
    this.config = config;
    this.loadDailyStats();
  }

  async checkPostingFrequency(): Promise<FrequencyCheck> {
    const today = new Date().toDateString();
    const todayPosts = this.postsToday.get(today) || new Date(0);
    const postsCount = this.getTodayPostCount();

    if (postsCount >= this.config.maxPostsPerDay) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const timeUntil = Math.floor((tomorrow.getTime() - Date.now()) / (1000 * 60));
      
      return {
        canPost: false,
        timeUntil,
        postsToday: postsCount,
        maxPostsPerDay: this.config.maxPostsPerDay
      };
    }

    const lastPostTime = this.getLastPostTime();
    if (lastPostTime) {
      const minutesSinceLastPost = (Date.now() - lastPostTime.getTime()) / (1000 * 60);
      
      if (minutesSinceLastPost < this.config.minCooldownMinutes) {
        const timeUntil = Math.ceil(this.config.minCooldownMinutes - minutesSinceLastPost);
        
        return {
          canPost: false,
          timeUntil,
          postsToday: postsCount,
          maxPostsPerDay: this.config.maxPostsPerDay
        };
      }
    }

    return {
      canPost: true,
      postsToday: postsCount,
      maxPostsPerDay: this.config.maxPostsPerDay
    };
  }

  async checkGroupCooldown(groupId: string): Promise<GroupCooldown> {
    const lastPostTime = this.groupLastPosts.get(groupId);
    
    if (!lastPostTime) {
      return { cooldownActive: false };
    }

    const hoursSinceLastPost = (Date.now() - lastPostTime.getTime()) / (1000 * 60 * 60);
    const cooldownHours = this.config.safeGroupCooldownHours;

    if (hoursSinceLastPost < cooldownHours) {
      const timeUntil = Math.ceil(cooldownHours - hoursSinceLastPost);
      const nextAvailableTime = new Date(lastPostTime.getTime() + (cooldownHours * 60 * 60 * 1000));

      return {
        cooldownActive: true,
        timeUntil,
        lastPostTime,
        nextAvailableTime
      };
    }

    return { cooldownActive: false };
  }

  recordPost(groupId: string, isPromotional: boolean = true): void {
    const now = new Date();
    const today = now.toDateString();

    // Registrar post do dia
    this.postsToday.set(today, now);

    // Registrar post do grupo
    this.groupLastPosts.set(groupId, now);

    // Atualizar posts promocionais consecutivos
    if (isPromotional) {
      this.consecutivePromos++;
    } else {
      this.consecutivePromos = 0;
      this.lastNonPromoTime = now;
    }

    this.saveDailyStats();
  }

  getTodayPostCount(): number {
    const today = new Date().toDateString();
    const todayPosts = this.postsToday.get(today);
    
    if (!todayPosts) return 0;

    // Contar posts desde o início do dia
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    return this.postsToday.size;
  }

  getLastPostTime(): Date | null {
    let lastTime: Date | null = null;
    
    for (const postTime of this.postsToday.values()) {
      if (!lastTime || postTime.getTime() > lastTime.getTime()) {
        lastTime = postTime;
      }
    }
    
    return lastTime;
  }

  async checkTimePattern(): Promise<number> {
    // Verificar se posts estão seguindo padrões muito regulares
    const todayPosts = Array.from(this.postsToday.values())
      .filter(date => date.toDateString() === new Date().toDateString())
      .sort((a, b) => a.getTime() - b.getTime());

    if (todayPosts.length < 3) return 0;

    // Calcular intervalos entre posts
    const intervals: number[] = [];
    for (let i = 1; i < todayPosts.length; i++) {
      const interval = (todayPosts[i].getTime() - todayPosts[i - 1].getTime()) / (1000 * 60);
      intervals.push(interval);
    }

    // Calcular variação dos intervalos
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);

    // Baixo desvio padrão indica padrão regular (ruim)
    const regularityScore = Math.max(0, 1 - (standardDeviation / avgInterval));
    
    return regularityScore;
  }

  async getAccountFrequency(): Promise<number> {
    return this.getTodayPostCount();
  }

  async getConsecutivePromos(): Promise<number> {
    return this.consecutivePromos;
  }

  getOptimalPostingTime(): Date {
    const now = new Date();
    const optimalTimes = [
      { hour: 9, minute: 0 },   // 09:00
      { hour: 12, minute: 30 }, // 12:30
      { hour: 19, minute: 0 },  // 19:00
      { hour: 21, minute: 0 }   // 21:00
    ];

    // Encontrar próximo horário ótimo
    for (const optimal of optimalTimes) {
      const optimalTime = new Date();
      optimalTime.setHours(optimal.hour, optimal.minute, 0, 0);
      
      if (optimalTime > now) {
        // Adicionar variação aleatória de +/- 30 minutos
        const variation = (Math.random() - 0.5) * 60 * 30; // +/- 30 minutos
        optimalTime.setMinutes(optimalTime.getMinutes() + variation);
        
        return optimalTime;
      }
    }

    // Se não houver mais horários hoje, agendar para amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    return tomorrow;
  }

  private loadDailyStats(): void {
    // Carregar estatísticas do storage local
    try {
      const stored = localStorage.getItem('forgeDeals_social_frequency');
      if (stored) {
        const data = JSON.parse(stored);
        this.postsToday = new Map(data.postsToday);
        this.groupLastPosts = new Map(data.groupLastPosts);
        this.consecutivePromos = data.consecutivePromos || 0;
      }
    } catch (error) {
      console.warn('Erro ao carregar estatísticas de frequência:', error);
    }
  }

  private saveDailyStats(): void {
    try {
      const data = {
        postsToday: Array.from(this.postsToday.entries()),
        groupLastPosts: Array.from(this.groupLastPosts.entries()),
        consecutivePromos: this.consecutivePromos
      };
      
      localStorage.setItem('forgeDeals_social_frequency', JSON.stringify(data));
    } catch (error) {
      console.warn('Erro ao salvar estatísticas de frequência:', error);
    }
  }

  resetDaily(): void {
    const today = new Date().toDateString();
    
    // Limpar posts de dias anteriores
    for (const [dateString] of this.postsToday.entries()) {
      if (dateString !== today) {
        this.postsToday.delete(dateString);
      }
    }
    
    this.saveDailyStats();
  }

  getStats(): any {
    return {
      postsToday: this.getTodayPostCount(),
      maxPostsPerDay: this.config.maxPostsPerDay,
      consecutivePromos: this.consecutivePromos,
      groupsWithCooldown: Array.from(this.groupLastPosts.entries()).length,
      averageDailyPosts: this.calculateAverageDailyPosts()
    };
  }

  private calculateAverageDailyPosts(): number {
    const days = Array.from(this.postsToday.keys()).length;
    const totalPosts = this.postsToday.size;
    
    return days > 0 ? Math.round((totalPosts / days) * 10) / 10 : 0;
  }
}
