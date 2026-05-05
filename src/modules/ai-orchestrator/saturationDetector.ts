import { OllamaService } from '../social-ai/ollama/ollama.service';

export interface SaturationMetric {
  type: 'content' | 'persona' | 'category' | 'cta' | 'format' | 'timing';
  key: string;
  current_value: number;
  threshold: number;
  saturation_level: 'low' | 'medium' | 'high' | 'critical';
  trend: 'increasing' | 'stable' | 'decreasing';
  last_reset: string;
  recommendations: string[];
}

export interface ContentPattern {
  content_hash: string;
  similarity_score: number;
  timestamp: string;
  type: string;
  persona: string;
  elements: string[];
}

export interface SaturationReport {
  overall_saturation: number;
  critical_areas: string[];
  recommendations: string[];
  safe_alternatives: string[];
  recovery_time: string;
  confidence: number;
}

export class SaturationDetector {
  private ollamaService: OllamaService;
  private saturationMetrics: Map<string, SaturationMetric>;
  private contentHistory: ContentPattern[];
  private recentPatterns: Map<string, number[]>;
  private thresholds: Map<string, number>;
  private detectionWindow: number; // dias

  constructor() {
    this.ollamaService = new OllamaService();
    this.saturationMetrics = new Map();
    this.contentHistory = [];
    this.recentPatterns = new Map();
    this.thresholds = new Map();
    this.detectionWindow = 7; // 7 dias de histórico
    this.initializeThresholds();
  }

  /**
   * Inicializa thresholds de saturação
   */
  private initializeThresholds(): void {
    const defaultThresholds = {
      'content_repetition': 3, // Mesmo conteúdo 3x
      'persona_overuse': 5,    // Mesma persona 5x
      'category_saturation': 4, // Mesma categoria 4x
      'cta_repetition': 6,     // Mesmo CTA 6x
      'timing_cluster': 3,     // Mesmo horário 3x
      'format_similarity': 0.8 // 80% similaridade
    };

    Object.entries(defaultThresholds).forEach(([key, value]) => {
      this.thresholds.set(key, value);
    });
  }

  /**
   * Analisa saturação de conteúdo antes de postar
   */
  async analyzeContentSaturation(contentData: {
    content: string;
    type: string;
    persona: string;
    category: string;
    cta: string;
    posting_hour: number;
    format: string;
  }): Promise<{
    can_post: boolean;
    saturation_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    blocking_factors: string[];
    recommendations: string[];
    alternatives: string[];
  }> {
    // Gerar hash do conteúdo para comparação
    const contentHash = this.generateContentHash(contentData);
    
    // Verificar similaridade com conteúdo recente
    const similarityCheck = await this.checkContentSimilarity(contentHash, contentData);
    
    // Analisar saturação por tipo
    const contentSaturation = this.analyzeTypeSaturation(contentData.type);
    
    // Analisar saturação por persona
    const personaSaturation = this.analyzePersonaSaturation(contentData.persona);
    
    // Analisar saturação por categoria
    const categorySaturation = this.analyzeCategorySaturation(contentData.category);
    
    // Analisar saturação por CTA
    const ctaSaturation = this.analyzeCTASaturation(contentData.cta);
    
    // Analisar saturação por timing
    const timingSaturation = this.analyzeTimingSaturation(contentData.posting_hour);
    
    // Analisar saturação por formato
    const formatSaturation = await this.analyzeFormatSaturation(contentData.format, contentData.content);

    // Calcular score geral
    const saturationScore = this.calculateOverallSaturation([
      similarityCheck,
      contentSaturation,
      personaSaturation,
      categorySaturation,
      ctaSaturation,
      timingSaturation,
      formatSaturation
    ]);

    // Determinar nível de risco
    const riskLevel = this.determineRiskLevel(saturationScore);

    // Identificar fatores bloqueantes
    const blockingFactors = this.identifyBlockingFactors([
      { type: 'similarity', data: similarityCheck },
      { type: 'content', data: contentSaturation },
      { type: 'persona', data: personaSaturation },
      { type: 'category', data: categorySaturation },
      { type: 'cta', data: ctaSaturation },
      { type: 'timing', data: timingSaturation },
      { type: 'format', data: formatSaturation }
    ]);

    // Gerar recomendações
    const recommendations = await this.generateRecommendations(contentData, blockingFactors);

    // Sugerir alternativas
    const alternatives = await this.suggestAlternatives(contentData, blockingFactors);

    const canPost = saturationScore < 70 && blockingFactors.length === 0;

    return {
      can_post,
      saturation_score: saturationScore,
      risk_level: riskLevel,
      blocking_factors: blockingFactors,
      recommendations,
      alternatives
    };
  }

  /**
   * Registra conteúdo para análise futura
   */
  registerContent(contentData: {
    content: string;
    type: string;
    persona: string;
    category: string;
    cta: string;
    posting_hour: number;
    format: string;
    timestamp: string;
  }): void {
    const contentHash = this.generateContentHash(contentData);
    const elements = this.extractContentElements(contentData);

    const pattern: ContentPattern = {
      content_hash: contentHash,
      similarity_score: 1.0,
      timestamp: contentData.timestamp,
      type: contentData.type,
      persona: contentData.persona,
      elements
    };

    this.contentHistory.push(pattern);
    
    // Manter apenas os últimos 1000 registros
    if (this.contentHistory.length > 1000) {
      this.contentHistory = this.contentHistory.slice(-1000);
    }

    // Atualizar padrões recentes
    this.updateRecentPatterns(contentData);
    
    // Limpar registros antigos
    this.cleanupOldRecords();
  }

  /**
   * Verifica similaridade com conteúdo recente
   */
  private async checkContentSimilarity(contentHash: string, contentData: any): Promise<any> {
    const recentContent = this.contentHistory.slice(-20);
    let maxSimilarity = 0;
    let similarContent = null;

    for (const pattern of recentContent) {
      const similarity = this.calculateSimilarity(contentHash, pattern.content_hash);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        similarContent = pattern;
      }
    }

    const threshold = this.thresholds.get('format_similarity') || 0.8;
    const isTooSimilar = maxSimilarity > threshold;

    return {
      similarity_score: maxSimilarity,
      threshold,
      is_blocked: isTooSimilar,
      similar_content: similarContent,
      confidence: isTooSimilar ? 95 : 100 - (maxSimilarity * 100)
    };
  }

  /**
   * Analisa saturação por tipo de conteúdo
   */
  private analyzeTypeSaturation(contentType: string): any {
    const key = `type_${contentType}`;
    const recentCount = this.getRecentCount(key, 7); // últimos 7 dias
    const threshold = this.thresholds.get('content_repetition') || 3;
    
    const saturationLevel = this.calculateSaturationLevel(recentCount, threshold);
    
    return {
      type: 'content_type',
      key: contentType,
      current_value: recentCount,
      threshold,
      saturation_level: saturationLevel,
      trend: this.calculateTrend(key),
      is_blocked: saturationLevel === 'high' || saturationLevel === 'critical'
    };
  }

  /**
   * Analisa saturação por persona
   */
  private analyzePersonaSaturation(persona: string): any {
    const key = `persona_${persona}`;
    const recentCount = this.getRecentCount(key, 5); // últimos 5 dias
    const threshold = this.thresholds.get('persona_overuse') || 5;
    
    const saturationLevel = this.calculateSaturationLevel(recentCount, threshold);
    
    return {
      type: 'persona',
      key: persona,
      current_value: recentCount,
      threshold,
      saturation_level: saturationLevel,
      trend: this.calculateTrend(key),
      is_blocked: saturationLevel === 'critical'
    };
  }

  /**
   * Analisa saturação por categoria
   */
  private analyzeCategorySaturation(category: string): any {
    const key = `category_${category}`;
    const recentCount = this.getRecentCount(key, 6); // últimos 6 dias
    const threshold = this.thresholds.get('category_saturation') || 4;
    
    const saturationLevel = this.calculateSaturationLevel(recentCount, threshold);
    
    return {
      type: 'category',
      key: category,
      current_value: recentCount,
      threshold,
      saturation_level: saturationLevel,
      trend: this.calculateTrend(key),
      is_blocked: saturationLevel === 'high' || saturationLevel === 'critical'
    };
  }

  /**
   * Analisa saturação por CTA
   */
  private analyzeCTASaturation(cta: string): any {
    const key = `cta_${this.normalizeCTA(cta)}`;
    const recentCount = this.getRecentCount(key, 7); // últimos 7 dias
    const threshold = this.thresholds.get('cta_repetition') || 6;
    
    const saturationLevel = this.calculateSaturationLevel(recentCount, threshold);
    
    return {
      type: 'cta',
      key: cta,
      current_value: recentCount,
      threshold,
      saturation_level: saturationLevel,
      trend: this.calculateTrend(key),
      is_blocked: saturationLevel === 'critical'
    };
  }

  /**
   * Analisa saturação por timing
   */
  private analyzeTimingSaturation(postingHour: number): any {
    const key = `hour_${postingHour}`;
    const recentCount = this.getRecentCount(key, 3); // últimos 3 dias
    const threshold = this.thresholds.get('timing_cluster') || 3;
    
    const saturationLevel = this.calculateSaturationLevel(recentCount, threshold);
    
    return {
      type: 'timing',
      key: postingHour.toString(),
      current_value: recentCount,
      threshold,
      saturation_level: saturationLevel,
      trend: this.calculateTrend(key),
      is_blocked: saturationLevel === 'high' || saturationLevel === 'critical'
    };
  }

  /**
   * Analisa saturação por formato
   */
  private async analyzeFormatSaturation(format: string, content: string): Promise<any> {
    const formatElements = this.extractFormatElements(content, format);
    const key = `format_${format}`;
    
    // Calcular similaridade de formato
    let maxFormatSimilarity = 0;
    const recentContent = this.contentHistory.slice(-15);
    
    for (const pattern of recentContent) {
      const formatSimilarity = this.calculateFormatSimilarity(formatElements, pattern.elements);
      if (formatSimilarity > maxFormatSimilarity) {
        maxFormatSimilarity = formatSimilarity;
      }
    }

    const threshold = this.thresholds.get('format_similarity') || 0.8;
    const saturationLevel = maxFormatSimilarity > threshold ? 'high' : 
                           maxFormatSimilarity > 0.6 ? 'medium' : 'low';

    return {
      type: 'format',
      key: format,
      current_value: maxFormatSimilarity,
      threshold,
      saturation_level,
      is_blocked: saturationLevel === 'high'
    };
  }

  /**
   * Calcula score geral de saturação
   */
  private calculateOverallSaturation(analyses: any[]): number {
    let totalScore = 0;
    let weightSum = 0;

    const weights = {
      similarity: 0.3,
      content: 0.2,
      persona: 0.15,
      category: 0.15,
      cta: 0.1,
      timing: 0.05,
      format: 0.05
    };

    analyses.forEach(analysis => {
      const weight = weights[analysis.type as keyof typeof weights] || 0.1;
      let score = 0;

      if (analysis.type === 'similarity') {
        score = analysis.similarity_score * 100;
      } else if (analysis.saturation_level) {
        const levelScores = { low: 20, medium: 50, high: 75, critical: 100 };
        score = levelScores[analysis.saturation_level as keyof typeof levelScores] || 0;
      }

      totalScore += score * weight;
      weightSum += weight;
    });

    return weightSum > 0 ? Math.round(totalScore / weightSum) : 0;
  }

  /**
   * Determina nível de risco
   */
  private determineRiskLevel(saturationScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (saturationScore >= 80) return 'critical';
    if (saturationScore >= 60) return 'high';
    if (saturationScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Identifica fatores bloqueantes
   */
  private identifyBlockingFactors(analyses: any[]): string[] {
    const blockingFactors = [];

    analyses.forEach(analysis => {
      if (analysis.is_blocked) {
        let factor = '';
        
        if (analysis.type === 'similarity') {
          factor = `Conteúdo muito similar (${(analysis.similarity_score * 100).toFixed(0)}%)`;
        } else if (analysis.type === 'content_type') {
          factor = `Tipo "${analysis.key}" saturado (${analysis.current_value}/${analysis.threshold})`;
        } else if (analysis.type === 'persona') {
          factor = `Persona "${analysis.key}" em excesso (${analysis.current_value}/${analysis.threshold})`;
        } else if (analysis.type === 'category') {
          factor = `Categoria "${analysis.key}" saturada (${analysis.current_value}/${analysis.threshold})`;
        } else if (analysis.type === 'cta') {
          factor = `CTA repetido (${analysis.current_value}/${analysis.threshold})`;
        } else if (analysis.type === 'timing') {
          factor = `Horário ${analysis.key}:00 saturado (${analysis.current_value}/${analysis.threshold})`;
        } else if (analysis.type === 'format') {
          factor = `Formato muito similar (${(analysis.current_value * 100).toFixed(0)}%)`;
        }
        
        if (factor) {
          blockingFactors.push(factor);
        }
      }
    });

    return blockingFactors;
  }

  /**
   * Gera recomendações baseadas na análise
   */
  private async generateRecommendations(contentData: any, blockingFactors: string[]): Promise<string[]> {
    const recommendations = [];

    if (blockingFactors.length > 0) {
      recommendations.push('Aguarde antes de postar para evitar saturação');
      
      if (blockingFactors.some(f => f.includes('similar'))) {
        recommendations.push('Modifique significativamente o conteúdo');
      }
      
      if (blockingFactors.some(f => f.includes('persona'))) {
        recommendations.push('Use uma persona diferente');
      }
      
      if (blockingFactors.some(f => f.includes('categoria'))) {
        recommendations.push('Escolha uma categoria diferente');
      }
      
      if (blockingFactors.some(f => f.includes('CTA'))) {
        recommendations.push('Varie o call-to-action');
      }
      
      if (blockingFactors.some(f => f.includes('Horário'))) {
        recommendations.push('Escolha um horário diferente');
      }
    } else {
      recommendations.push('Conteúdo dentro dos limites de saturação');
    }

    // Adicionar recomendações da IA
    const aiRecommendations = await this.getAIRecommendations(contentData, blockingFactors);
    recommendations.push(...aiRecommendations);

    return recommendations.slice(0, 5); // Limitar a 5 recomendações
  }

  /**
   * Sugere alternativas ao conteúdo bloqueado
   */
  private async suggestAlternatives(contentData: any, blockingFactors: string[]): Promise<string[]> {
    const alternatives = [];

    // Alternativas de persona
    if (blockingFactors.some(f => f.includes('persona'))) {
      const alternativePersonas = ['tecnico_profissional', 'mecanico_raiz', 'especialista_bosch', 'cacador_promocoes', 'review_honesto', 'influenciador_ferramentas'];
      const availablePersonas = alternativePersonas.filter(p => p !== contentData.persona);
      alternatives.push(`Personas alternativas: ${availablePersonas.slice(0, 3).join(', ')}`);
    }

    // Alternativas de tipo
    if (blockingFactors.some(f => f.includes('Tipo'))) {
      const alternativeTypes = ['offer', 'interaction', 'review', 'branding'];
      const availableTypes = alternativeTypes.filter(t => t !== contentData.type);
      alternatives.push(`Tipos alternativos: ${availableTypes.join(', ')}`);
    }

    // Alternativas de horário
    if (blockingFactors.some(f => f.includes('Horário'))) {
      const alternativeHours = [8, 10, 11, 14, 16, 17, 20];
      const availableHours = alternativeHours.filter(h => h !== contentData.posting_hour);
      alternatives.push(`Horários alternativos: ${availableHours.slice(0, 3).join('h, ')}h`);
    }

    // Alternativas de CTA
    if (blockingFactors.some(f => f.includes('CTA'))) {
      alternatives.push('CTAs alternativos: "confira agora", "veja mais", "saiba mais", "clique aqui"');
    }

    return alternatives;
  }

  /**
   * Obtém recomendações da IA
   */
  private async getAIRecommendations(contentData: any, blockingFactors: string[]): Promise<string[]> {
    const prompt =`
Baseado nesta análise de saturação:

CONTEÚDO: ${JSON.stringify(contentData)}
FATORES BLOQUEANTES: ${blockingFactors.join(', ')}

Gere recomendações específicas em JSON array:
{
  "recommendations": [
    "recomendação1 específica",
    "recomendação2 para evitar saturação",
    "recomendação3 para otimizar"
  ]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      const result = JSON.parse(response);
      return result.recommendations || [];
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      return [];
    }
  }

  /**
   * Gera relatório completo de saturação
   */
  async generateSaturationReport(): Promise<SaturationReport> {
    const currentMetrics = this.getCurrentMetrics();
    const criticalAreas = this.identifyCriticalAreas();
    const recommendations = await this.generateGlobalRecommendations();
    const safeAlternatives = this.generateSafeAlternatives();
    const recoveryTime = this.estimateRecoveryTime();

    const prompt =`
Baseado nas métricas atuais de saturação:

MÉTRICAS: ${JSON.stringify(currentMetrics, null, 2)}
ÁREAS CRÍTICAS: ${criticalAreas.join(', ')}

Gere relatório executivo em JSON:
{
  "overall_saturation": ${currentMetrics.overall_score},
  "critical_areas": ${JSON.stringify(criticalAreas)},
  "recommendations": ${JSON.stringify(recommendations)},
  "safe_alternatives": ${JSON.stringify(safeAlternatives)},
  "recovery_time": "${recoveryTime}",
  "confidence": 0-100,
  "key_insights": ["insight1", "insight2"]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating saturation report:', error);
      return {
        overall_saturation: currentMetrics.overall_score,
        critical_areas,
        recommendations,
        safe_alternatives,
        recovery_time,
        confidence: 70
      };
    }
  }

  // Métodos utilitários

  private generateContentHash(contentData: any): string {
    const content = `${contentData.type}_${contentData.persona}_${contentData.category}_${contentData.cta}`;
    return this.simpleHash(content);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private extractContentElements(contentData: any): string[] {
    const elements = [
      contentData.type,
      contentData.persona,
      contentData.category,
      this.normalizeCTA(contentData.cta),
      contentData.posting_hour.toString()
    ];

    // Extrair palavras-chave do conteúdo
    if (contentData.content) {
      const words = contentData.content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);
      elements.push(...words.slice(0, 5)); // Top 5 palavras
    }

    return elements;
  }

  private extractFormatElements(content: string, format: string): string[] {
    // Análise simples de formato
    const elements = [format];
    
    // Detectar elementos de formato
    if (content.includes('?')) elements.push('question');
    if (content.includes('!')) elements.push('exclamation');
    if (content.includes('🔥') || content.includes('⚡')) elements.push('emoji_heavy');
    if (content.includes('R$')) elements.push('price_mention');
    if (content.includes('http')) elements.push('link');
    
    return elements;
  }

  private calculateSimilarity(hash1: string, hash2: string): number {
    // Similaridade simples baseada em hash
    if (hash1 === hash2) return 1.0;
    
    // Calcular similaridade baseada em elementos
    const elements1 = this.contentHistory.find(p => p.content_hash === hash1)?.elements || [];
    const elements2 = this.contentHistory.find(p => p.content_hash === hash2)?.elements || [];
    
    const intersection = elements1.filter(e => elements2.includes(e)).length;
    const union = [...new Set([...elements1, ...elements2])].length;
    
    return union > 0 ? intersection / union : 0;
  }

  private calculateFormatSimilarity(elements1: string[], elements2: string[]): number {
    const intersection = elements1.filter(e => elements2.includes(e)).length;
    const union = [...new Set([...elements1, ...elements2])].length;
    
    return union > 0 ? intersection / union : 0;
  }

  private normalizeCTA(cta: string): string {
    return cta.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  private getRecentCount(key: string, days: number): number {
    const pattern = this.recentPatterns.get(key);
    if (!pattern) return 0;
    
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return pattern.filter(timestamp => timestamp > cutoff).length;
  }

  private updateRecentPatterns(contentData: any): void {
    const now = Date.now();
    
    // Atualizar contadores para cada tipo
    const keys = [
      `type_${contentData.type}`,
      `persona_${contentData.persona}`,
      `category_${contentData.category}`,
      `cta_${this.normalizeCTA(contentData.cta)}`,
      `hour_${contentData.posting_hour}`,
      `format_${contentData.format}`
    ];

    keys.forEach(key => {
      if (!this.recentPatterns.has(key)) {
        this.recentPatterns.set(key, []);
      }
      this.recentPatterns.get(key)!.push(now);
    });
  }

  private calculateSaturationLevel(current: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const percentage = (current / threshold) * 100;
    
    if (percentage >= 100) return 'critical';
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
  }

  private calculateTrend(key: string): 'increasing' | 'stable' | 'decreasing' {
    const pattern = this.recentPatterns.get(key);
    if (!pattern || pattern.length < 2) return 'stable';

    const recent = pattern.slice(-3);
    const older = pattern.slice(-6, -3);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.length / 3; // dias
    const olderAvg = older.length / 3; // dias

    if (recentAvg > olderAvg * 1.2) return 'increasing';
    if (recentAvg < olderAvg * 0.8) return 'decreasing';
    return 'stable';
  }

  private cleanupOldRecords(): void {
    const cutoff = Date.now() - (this.detectionWindow * 24 * 60 * 60 * 1000);
    
    // Limpar contentHistory
    this.contentHistory = this.contentHistory.filter(
      pattern => new Date(pattern.timestamp).getTime() > cutoff
    );
    
    // Limpar recentPatterns
    this.recentPatterns.forEach((pattern, key) => {
      const filtered = pattern.filter(timestamp => timestamp > cutoff);
      this.recentPatterns.set(key, filtered);
    });
  }

  private getCurrentMetrics(): any {
    const metrics = [];
    
    // Coletar métricas atuais
    this.recentPatterns.forEach((pattern, key) => {
      const recentCount = this.getRecentCount(key, 7);
      const threshold = this.thresholds.get(key.split('_')[0] + '_repetition') || 3;
      
      metrics.push({
        key,
        current: recentCount,
        threshold,
        saturation: this.calculateSaturationLevel(recentCount, threshold)
      });
    });

    const overallScore = metrics.reduce((sum, m) => {
      const levelScores = { low: 20, medium: 50, high: 75, critical: 100 };
      return sum + (levelScores[m.saturation as keyof typeof levelScores] || 0);
    }, 0) / (metrics.length || 1);

    return {
      overall_score: Math.round(overallScore),
      total_metrics: metrics.length,
      critical_count: metrics.filter(m => m.saturation === 'critical').length,
      high_count: metrics.filter(m => m.saturation === 'high').length
    };
  }

  private identifyCriticalAreas(): string[] {
    const critical = [];
    
    this.recentPatterns.forEach((pattern, key) => {
      const recentCount = this.getRecentCount(key, 7);
      const threshold = this.thresholds.get(key.split('_')[0] + '_repetition') || 3;
      
      if (recentCount >= threshold) {
        critical.push(key.replace(/_/g, ' '));
      }
    });

    return critical;
  }

  private async generateGlobalRecommendations(): Promise<string[]> {
    const criticalAreas = this.identifyCriticalAreas();
    
    if (criticalAreas.length === 0) {
      return ['Níveis de saturação dentro dos limites seguros', 'Continue com a estratégia atual'];
    }

    const recommendations = [
      'Reduza temporariamente a frequência de posts',
      'Diversifique os tipos de conteúdo',
      'Varie as personas utilizadas'
    ];

    if (criticalAreas.some(area => area.includes('persona'))) {
      recommendations.push('Introduza novas personas ou rotacione as existentes');
    }

    if (criticalAreas.some(area => area.includes('categoria'))) {
      recommendations.push('Explore novas categorias de conteúdo');
    }

    return recommendations;
  }

  private generateSafeAlternatives(): string[] {
    return [
      'Conteúdo educacional (dicas, tutoriais)',
      'Perguntas engajadoras para a comunidade',
      'Reviews honestos de produtos',
      'Conteúdo sobre tendências do mercado',
      'Dicas de segurança e manutenção'
    ];
  }

  private estimateRecoveryTime(): string {
    const criticalAreas = this.identifyCriticalAreas();
    
    if (criticalAreas.length === 0) return 'Imediato';
    if (criticalAreas.length <= 2) return '2-3 dias';
    if (criticalAreas.length <= 4) return '4-5 dias';
    return '1 semana';
  }

  /**
   * Exporta dados de saturação
   */
  exportSaturationData(): {
    metrics: Map<string, SaturationMetric>;
    history: ContentPattern[];
    patterns: Map<string, number[]>;
    thresholds: Map<string, number>;
  } {
    return {
      metrics: this.saturationMetrics,
      history: this.contentHistory,
      patterns: this.recentPatterns,
      thresholds: this.thresholds
    };
  }
}
