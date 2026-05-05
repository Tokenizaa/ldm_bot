import { OllamaService } from '../social-ai/ollama/ollama.service';
import { DailyPost } from './dailyPlanner';
import { Product } from '../../types';

export interface ScheduledPost {
  id: string;
  daily_post_id: string;
  scheduled_time: string;
  optimal_hour: number;
  status: 'scheduled' | 'ready' | 'publishing' | 'published' | 'failed' | 'skipped';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  preparation_status: 'pending' | 'preparing' | 'ready' | 'failed';
  content_ready: boolean;
  media_ready: boolean;
  approval_required: boolean;
  approved_at?: string;
  published_at?: string;
  retry_count: number;
  last_error?: string;
  metadata: {
    processing_time: number;
    queue_position: number;
    estimated_duration: number;
  };
}

export interface PublicationWindow {
  id: string;
  name: string;
  start_hour: number;
  end_hour: number;
  optimal_hours: number[];
  post_types: string[];
  priority_multiplier: number;
  efficiency_score: number;
  current_load: number;
  max_capacity: number;
}

export interface ScheduleConflict {
  type: 'time_conflict' | 'resource_conflict' | 'content_conflict' | 'compliance_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_posts: string[];
  resolution_suggestion: string;
}

export class PublicationScheduler {
  private ollamaService: OllamaService;
  private scheduledPosts: Map<string, ScheduledPost>;
  private publicationWindows: PublicationWindow[];
  private activeQueue: ScheduledPost[];
  private processingQueue: ScheduledPost[];
  private conflictDetector: ConflictDetector;
  private autoPublisher: AutoPublisher;

  constructor() {
    this.ollamaService = new OllamaService();
    this.scheduledPosts = new Map();
    this.publicationWindows = [];
    this.activeQueue = [];
    this.processingQueue = [];
    this.conflictDetector = new ConflictDetector();
    this.autoPublisher = new AutoPublisher();
    this.initializePublicationWindows();
  }

  /**
   * Inicializa janelas de publicação
   */
  private initializePublicationWindows(): void {
    this.publicationWindows = [
      {
        id: 'morning_interaction',
        name: 'Manhã - Interação',
        start_hour: 8,
        end_hour: 10,
        optimal_hours: [9],
        post_types: ['interaction'],
        priority_multiplier: 1.2,
        efficiency_score: 85,
        current_load: 0,
        max_capacity: 2
      },
      {
        id: 'midday_promotion',
        name: 'Meio-dia - Promoção',
        start_hour: 11,
        end_hour: 13,
        optimal_hours: [12],
        post_types: ['promotion'],
        priority_multiplier: 1.3,
        efficiency_score: 90,
        current_load: 0,
        max_capacity: 2
      },
      {
        id: 'afternoon_branding',
        name: 'Tarde - Branding',
        start_hour: 16,
        end_hour: 18,
        optimal_hours: [17],
        post_types: ['video_branding'],
        priority_multiplier: 1.1,
        efficiency_score: 75,
        current_load: 0,
        max_capacity: 1
      },
      {
        id: 'evening_premium',
        name: 'Noite - Premium',
        start_hour: 19,
        end_hour: 21,
        optimal_hours: [20],
        post_types: ['promotion_premium'],
        priority_multiplier: 1.4,
        efficiency_score: 95,
        current_load: 0,
        max_capacity: 2
      }
    ];
  }

  /**
   * Agenda posts do plano editorial diário
   */
  async scheduleDailyPosts(dailyPosts: DailyPost[]): Promise<{
    scheduled: ScheduledPost[];
    conflicts: ScheduleConflict[];
    skipped: DailyPost[];
  }> {
    const scheduled: ScheduledPost[] = [];
    const conflicts: ScheduleConflict[] = [];
    const skipped: DailyPost[] = [];

    // 1. Ordenar posts por prioridade e horário ótimo
    const sortedPosts = this.sortPostsByPriority(dailyPosts);

    // 2. Para cada post, encontrar janela ideal
    for (const post of sortedPosts) {
      try {
        const window = this.findOptimalWindow(post);
        
        if (!window) {
          skipped.push(post);
          continue;
        }

        // 3. Verificar conflitos
        const postConflicts = await this.conflictDetector.detectConflicts(
          post,
          window,
          Array.from(this.scheduledPosts.values())
        );

        if (postConflicts.some(c => c.severity === 'critical')) {
          conflicts.push(...postConflicts);
          skipped.push(post);
          continue;
        }

        // 4. Agendar post
        const scheduledPost = await this.createScheduledPost(post, window);
        this.scheduledPosts.set(scheduledPost.id, scheduledPost);
        scheduled.push(scheduledPost);

        // 5. Atualizar carga da janela
        window.current_load++;

        // 6. Adicionar conflitos não críticos à lista
        conflicts.push(...postConflicts.filter(c => c.severity !== 'critical'));

      } catch (error) {
        console.error(`Error scheduling post ${post.id}:`, error);
        skipped.push(post);
      }
    }

    // 7. Otimizar agenda se houver conflitos
    if (conflicts.length > 0) {
      await this.optimizeSchedule(conflicts);
    }

    return { scheduled, conflicts, skipped };
  }

  /**
   * Ordena posts por prioridade
   */
  private sortPostsByPriority(posts: DailyPost[]): DailyPost[] {
    const priorityOrder = {
      'promotion_premium': 4,
      'promotion': 3,
      'video_branding': 2,
      'interaction': 1
    };

    return posts.sort((a, b) => {
      const priorityDiff = priorityOrder[b.type as keyof typeof priorityOrder] - 
                         priorityOrder[a.type as keyof typeof priorityOrder];
      
      if (priorityDiff !== 0) return priorityDiff;

      // Se mesma prioridade, ordenar por horário ótimo
      return a.time_window.optimal_hour - b.time_window.optimal_hour;
    });
  }

  /**
   * Encontra janela ótima para o post
   */
  private findOptimalWindow(post: DailyPost): PublicationWindow | null {
    const postHour = post.time_window.optimal_hour;
    
    // Encontrar janelas que aceitam este tipo de post
    const suitableWindows = this.publicationWindows.filter(window => 
      window.post_types.includes(post.type) &&
      window.start_hour <= postHour &&
      window.end_hour >= postHour &&
      window.current_load < window.max_capacity
    );

    if (suitableWindows.length === 0) return null;

    // Selecionar janela com melhor eficiência
    return suitableWindows.sort((a, b) => b.efficiency_score - a.efficiency_score)[0];
  }

  /**
   * Cria post agendado
   */
  private async createScheduledPost(
    dailyPost: DailyPost,
    window: PublicationWindow
  ): Promise<ScheduledPost> {
    const scheduledTime = this.calculateScheduledTime(dailyPost, window);
    
    const scheduledPost: ScheduledPost = {
      id: `scheduled_${Date.now()}_${dailyPost.id}`,
      daily_post_id: dailyPost.id,
      scheduled_time: scheduledTime,
      optimal_hour: dailyPost.time_window.optimal_hour,
      status: 'scheduled',
      priority: this.calculatePriority(dailyPost, window),
      preparation_status: 'pending',
      content_ready: false,
      media_ready: false,
      approval_required: false,
      retry_count: 0,
      metadata: {
        processing_time: 0,
        queue_position: 0,
        estimated_duration: this.estimateProcessingTime(dailyPost)
      }
    };

    return scheduledPost;
  }

  /**
   * Calcula horário agendado
   */
  private calculateScheduledTime(dailyPost: DailyPost, window: PublicationWindow): string {
    const now = new Date();
    const scheduledDate = new Date(now);
    
    // Definir data para hoje
    scheduledDate.setHours(window.optimal_hours[0], 0, 0, 0);
    
    // Se o horário já passou, agendar para amanhã
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }
    
    return scheduledDate.toISOString();
  }

  /**
   * Calcula prioridade do post
   */
  private calculatePriority(dailyPost: DailyPost, window: PublicationWindow): 'low' | 'medium' | 'high' | 'urgent' {
    const basePriority = dailyPost.ctr_prediction || dailyPost.engagement_prediction || 50;
    const multiplier = window.priority_multiplier;
    const adjustedPriority = basePriority * multiplier;

    if (adjustedPriority >= 85) return 'urgent';
    if (adjustedPriority >= 70) return 'high';
    if (adjustedPriority >= 50) return 'medium';
    return 'low';
  }

  /**
   * Estima tempo de processamento
   */
  private estimateProcessingTime(dailyPost: DailyPost): number {
    const baseTime = {
      'interaction': 2,
      'promotion': 3,
      'video_branding': 8,
      'promotion_premium': 4
    };

    return baseTime[dailyPost.type as keyof typeof baseTime] || 3;
  }

  /**
   * Otimiza agenda para resolver conflitos
   */
  private async optimizeSchedule(conflicts: ScheduleConflict[]): Promise<void> {
    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'time_conflict':
          await this.resolveTimeConflict(conflict);
          break;
        case 'resource_conflict':
          await this.resolveResourceConflict(conflict);
          break;
        case 'content_conflict':
          await this.resolveContentConflict(conflict);
          break;
        case 'compliance_conflict':
          await this.resolveComplianceConflict(conflict);
          break;
      }
    }
  }

  /**
   * Resolve conflito de tempo
   */
  private async resolveTimeConflict(conflict: ScheduleConflict): Promise<void> {
    const affectedPosts = conflict.affected_posts.map(id => this.scheduledPosts.get(id)).filter(Boolean) as ScheduledPost[];
    
    for (const post of affectedPosts) {
      // Encontrar nova janela disponível
      const newWindow = this.findAlternativeWindow(post);
      
      if (newWindow) {
        const newTime = this.calculateScheduledTime(
          // Obter daily post do scheduled post
          {} as DailyPost,
          newWindow
        );
        
        post.scheduled_time = newTime;
        post.status = 'scheduled';
      } else {
        post.status = 'skipped';
      }
    }
  }

  /**
   * Encontra janela alternativa
   */
  private findAlternativeWindow(post: ScheduledPost): PublicationWindow | null {
    return this.publicationWindows.find(window => 
      window.post_types.includes(post.daily_post_id) &&
      window.current_load < window.max_capacity &&
      window.id !== post.id
    ) || null;
  }

  /**
   * Resolve conflito de recurso
   */
  private async resolveResourceConflict(conflict: ScheduleConflict): Promise<void> {
    // Implementar lógica para resolver conflitos de recursos
    // Por exemplo: limitar posts simultâneos, etc.
  }

  /**
   * Resolve conflito de conteúdo
   */
  private async resolveContentConflict(conflict: ScheduleConflict): Promise<void> {
    // Implementar lógica para resolver conflitos de conteúdo
    // Por exemplo: evitar posts muito similares
  }

  /**
   * Resolve conflito de compliance
   */
  private async resolveComplianceConflict(conflict: ScheduleConflict): Promise<void> {
    // Implementar lógica para resolver conflitos de compliance
    // Por exemplo: ajustar CTA, persona, etc.
  }

  /**
   * Inicia processamento de posts
   */
  async startProcessing(): Promise<void> {
    // 1. Mover posts agendados para fila de processamento
    const readyPosts = Array.from(this.scheduledPosts.values())
      .filter(post => post.status === 'scheduled' && this.isTimeToProcess(post));

    for (const post of readyPosts) {
      post.preparation_status = 'preparing';
      post.status = 'ready';
      this.processingQueue.push(post);
    }

    // 2. Processar posts em paralelo
    const processingPromises = this.processingQueue
      .slice(0, 3) // Limitar a 3 posts simultâneos
      .map(post => this.processPost(post));

    await Promise.allSettled(processingPromises);
  }

  /**
   * Verifica se é hora de processar o post
   */
  private isTimeToProcess(post: ScheduledPost): boolean {
    const now = new Date();
    const scheduledTime = new Date(post.scheduled_time);
    const preparationTime = 5 * 60 * 1000; // 5 minutos antes
    
    return now.getTime() >= (scheduledTime.getTime() - preparationTime);
  }

  /**
   * Processa post individual
   */
  private async processPost(post: ScheduledPost): Promise<void> {
    try {
      post.preparation_status = 'preparing';
      const startTime = Date.now();

      // 1. Preparar conteúdo
      await this.prepareContent(post);

      // 2. Preparar mídia
      await this.prepareMedia(post);

      // 3. Validar compliance
      await this.validateCompliance(post);

      // 4. Marcar como pronto
      post.preparation_status = 'ready';
      post.content_ready = true;
      post.media_ready = true;
      post.metadata.processing_time = Date.now() - startTime;

      // 5. Mover para fila ativa
      this.activeQueue.push(post);

    } catch (error) {
      console.error(`Error processing post ${post.id}:`, error);
      post.preparation_status = 'failed';
      post.last_error = error instanceof Error ? error.message : 'Unknown error';
      post.retry_count++;

      // Tentar novamente se não excedeu limites
      if (post.retry_count < 3) {
        setTimeout(() => this.processPost(post), 5000 * post.retry_count);
      }
    }
  }

  /**
   * Prepara conteúdo do post
   */
  private async prepareContent(post: ScheduledPost): Promise<void> {
    // Implementar lógica de preparação de conteúdo
    // Isso pode incluir geração de variações, otimização, etc.
    
    // Simulação
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Prepara mídia do post
   */
  private async prepareMedia(post: ScheduledPost): Promise<void> {
    // Implementar lógica de preparação de mídia
    // Isso pode incluir geração de imagens, vídeos, etc.
    
    // Simulação
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Valida compliance do post
   */
  private async validateCompliance(post: ScheduledPost): Promise<void> {
    // Implementar lógica de validação de compliance
    // Verificar regras Meta Safe, spam, etc.
    
    // Simulação
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Inicia publicação automática
   */
  async startAutoPublishing(): Promise<void> {
    // Verificar posts prontos para publicação
    const readyToPublish = this.activeQueue.filter(post => 
      post.status === 'ready' &&
      this.isTimeToPublish(post)
    );

    for (const post of readyToPublish) {
      await this.autoPublisher.publish(post);
    }
  }

  /**
   * Verifica se é hora de publicar
   */
  private isTimeToPublish(post: ScheduledPost): boolean {
    const now = new Date();
    const scheduledTime = new Date(post.scheduled_time);
    
    return now >= scheduledTime;
  }

  /**
   * Obtém status da agenda
   */
  getScheduleStatus(): {
    total_scheduled: number;
    ready_to_publish: number;
    processing: number;
    published: number;
    failed: number;
    conflicts: number;
    queue_positions: Array<{ post_id: string; position: number; estimated_time: string }>;
  } {
    const posts = Array.from(this.scheduledPosts.values());
    
    const totalScheduled = posts.filter(p => p.status === 'scheduled').length;
    const readyToPublish = posts.filter(p => p.status === 'ready').length;
    const processing = posts.filter(p => p.preparation_status === 'preparing').length;
    const published = posts.filter(p => p.status === 'published').length;
    const failed = posts.filter(p => p.status === 'failed').length;
    
    const queuePositions = this.processingQueue
      .slice(0, 10)
      .map((post, index) => ({
        post_id: post.id,
        position: index + 1,
        estimated_time: this.estimateTimeToPublish(post)
      }));

    return {
      total_scheduled: totalScheduled,
      ready_to_publish: readyToPublish,
      processing,
      published,
      failed,
      conflicts: 0, // Implementar contagem de conflitos
      queue_positions: queuePositions
    };
  }

  /**
   * Estima tempo até publicação
   */
  private estimateTimeToPublish(post: ScheduledPost): string {
    const now = new Date();
    const scheduledTime = new Date(post.scheduled_time);
    const diff = scheduledTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Agora';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }

  /**
   * Cancela post agendado
   */
  async cancelScheduledPost(postId: string, reason?: string): Promise<boolean> {
    const post = this.scheduledPosts.get(postId);
    
    if (!post) return false;
    
    if (post.status === 'published') {
      return false; // Não pode cancelar post já publicado
    }

    post.status = 'skipped';
    post.last_error = reason || 'Cancelado pelo usuário';
    
    // Remover das filas
    this.processingQueue = this.processingQueue.filter(p => p.id !== postId);
    this.activeQueue = this.activeQueue.filter(p => p.id !== postId);
    
    // Liberar carga da janela
    const window = this.publicationWindows.find(w => w.current_load > 0);
    if (window) {
      window.current_load--;
    }
    
    return true;
  }

  /**
   * Reagenda post
   */
  async reschedulePost(postId: string, newTime: string): Promise<boolean> {
    const post = this.scheduledPosts.get(postId);
    
    if (!post || post.status === 'published') {
      return false;
    }

    const newScheduledTime = new Date(newTime);
    const now = new Date();
    
    if (newScheduledTime <= now) {
      return false; // Não pode agendar para tempo passado
    }

    post.scheduled_time = newScheduledTime.toISOString();
    post.status = 'scheduled';
    post.preparation_status = 'pending';
    
    // Remover das filas ativas
    this.processingQueue = this.processingQueue.filter(p => p.id !== postId);
    this.activeQueue = this.activeQueue.filter(p => p.id !== postId);
    
    return true;
  }

  /**
   * Obtém posts agendados por período
   */
  getScheduledPostsByPeriod(startDate: Date, endDate: Date): ScheduledPost[] {
    return Array.from(this.scheduledPosts.values()).filter(post => {
      const postTime = new Date(post.scheduled_time);
      return postTime >= startDate && postTime <= endDate;
    });
  }

  /**
   * Obtém métricas de performance
   */
  getPerformanceMetrics(): {
    avg_processing_time: number;
    success_rate: number;
    queue_efficiency: number;
    window_utilization: Record<string, number>;
    conflict_resolution_rate: number;
  } {
    const posts = Array.from(this.scheduledPosts.values());
    
    const processingTimes = posts
      .filter(p => p.metadata.processing_time > 0)
      .map(p => p.metadata.processing_time);
    
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;

    const successRate = posts.length > 0 
      ? (posts.filter(p => p.status === 'published').length / posts.length) * 100 
      : 0;

    const windowUtilization: Record<string, number> = {};
    this.publicationWindows.forEach(window => {
      windowUtilization[window.id] = (window.current_load / window.max_capacity) * 100;
    });

    return {
      avg_processing_time: Math.round(avgProcessingTime),
      success_rate: Math.round(successRate),
      queue_efficiency: 85, // Implementar cálculo real
      window_utilization: windowUtilization,
      conflict_resolution_rate: 90 // Implementar cálculo real
    };
  }

  /**
   * Exporta dados do scheduler
   */
  exportSchedulerData(): {
    scheduledPosts: Map<string, ScheduledPost>;
    publicationWindows: PublicationWindow[];
    activeQueue: ScheduledPost[];
    processingQueue: ScheduledPost[];
  } {
    return {
      scheduledPosts: this.scheduledPosts,
      publicationWindows: this.publicationWindows,
      activeQueue: this.activeQueue,
      processingQueue: this.processingQueue
    };
  }
}

// Classes auxiliares

class ConflictDetector {
  async detectConflicts(
    post: DailyPost,
    window: PublicationWindow,
    existingPosts: ScheduledPost[]
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    // Detectar conflitos de tempo
    const timeConflicts = this.detectTimeConflicts(post, window, existingPosts);
    conflicts.push(...timeConflicts);

    // Detectar conflitos de conteúdo
    const contentConflicts = this.detectContentConflicts(post, existingPosts);
    conflicts.push(...contentConflicts);

    // Detectar conflitos de compliance
    const complianceConflicts = this.detectComplianceConflicts(post, existingPosts);
    conflicts.push(...complianceConflicts);

    return conflicts;
  }

  private detectTimeConflicts(
    post: DailyPost,
    window: PublicationWindow,
    existingPosts: ScheduledPost[]
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    
    const sameTimePosts = existingPosts.filter(existing => {
      const existingTime = new Date(existing.scheduled_time);
      const postTime = new Date(post.time_window.optimal_hour);
      
      return Math.abs(existingTime.getTime() - postTime.getTime()) < (30 * 60 * 1000); // 30 minutos
    });

    if (sameTimePosts.length > 0) {
      conflicts.push({
        type: 'time_conflict',
        severity: sameTimePosts.length > 1 ? 'high' : 'medium',
        description: `Múltiplos posts agendados para horários próximos`,
        affected_posts: sameTimePosts.map(p => p.id),
        resolution_suggestion: 'Ajustar horários para evitar sobreposição'
      });
    }

    return conflicts;
  }

  private detectContentConflicts(
    post: DailyPost,
    existingPosts: ScheduledPost[]
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    
    // Verificar posts muito similares
    const similarPosts = existingPosts.filter(existing => {
      // Implementar lógica de similaridade de conteúdo
      return false; // Placeholder
    });

    if (similarPosts.length > 0) {
      conflicts.push({
        type: 'content_conflict',
        severity: 'medium',
        description: 'Posts com conteúdo muito similares',
        affected_posts: similarPosts.map(p => p.id),
        resolution_suggestion: 'Variar conteúdo ou adiar post'
      });
    }

    return conflicts;
  }

  private detectComplianceConflicts(
    post: DailyPost,
    existingPosts: ScheduledPost[]
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    
    // Verificar violações de regras Meta Safe
    const recentPosts = existingPosts.filter(existing => {
      const existingTime = new Date(existing.scheduled_time);
      const now = new Date();
      return (now.getTime() - existingTime.getTime()) < (24 * 60 * 60 * 1000); // Últimas 24h
    });

    // Verificar repetição de CTA
    const ctaCounts = recentPosts.reduce((acc, p) => {
      // Obter CTA do post (implementar)
      const cta = 'cta'; // Placeholder
      acc[cta] = (acc[cta] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(ctaCounts).forEach(([cta, count]) => {
      if (count >= 2) {
        conflicts.push({
          type: 'compliance_conflict',
          severity: 'high',
          description: `CTA "${cta}" repetido múltiplas vezes`,
          affected_posts: recentPosts.map(p => p.id),
          resolution_suggestion: 'Variar CTA ou adiar post'
        });
      }
    });

    return conflicts;
  }
}

class AutoPublisher {
  async publish(post: ScheduledPost): Promise<boolean> {
    try {
      post.status = 'publishing';
      
      // Implementar lógica de publicação real
      // Chamada à API do Facebook, etc.
      
      // Simulação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      post.status = 'published';
      post.published_at = new Date().toISOString();
      
      return true;
    } catch (error) {
      console.error(`Error publishing post ${post.id}:`, error);
      post.status = 'failed';
      post.last_error = error instanceof Error ? error.message : 'Unknown error';
      post.retry_count++;
      
      return false;
    }
  }
}
