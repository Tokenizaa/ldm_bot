import { AntiSpamConfig } from './types';

export class DuplicateDetector {
  private config: AntiSpamConfig['duplicate'];
  private recentPosts: Array<{
    content: string;
    timestamp: Date;
    cta: string;
    similarity: number;
  }> = [];

  constructor(config: AntiSpamConfig['duplicate']) {
    this.config = config;
    this.loadRecentPosts();
  }

  async checkTextRepetition(content: string): Promise<number> {
    const recentPosts = this.getRecentPosts(24); // últimas 24 horas
    
    if (recentPosts.length === 0) return 0;

    let maxSimilarity = 0;
    
    for (const post of recentPosts) {
      const similarity = this.calculateTextSimilarity(content, post.content);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  async checkCTARepetition(content: string): Promise<number> {
    const recentPosts = this.getRecentPosts(24);
    const currentCTA = this.extractCTA(content);
    
    if (!currentCTA || recentPosts.length === 0) return 0;

    let maxSimilarity = 0;
    
    for (const post of recentPosts) {
      const similarity = this.calculateTextSimilarity(currentCTA, post.cta);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Algoritmo de similaridade de texto (Jaccard Index melhorado)
    const words1 = this.normalizeText(text1);
    const words2 = this.normalizeText(text2);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    const jaccardSimilarity = intersection.size / union.size;
    
    // Ajustar para similaridade de subsequência (para textos parcialmente similares)
    const subsequenceSimilarity = this.calculateSubsequenceSimilarity(words1, words2);
    
    // Combinar as duas métricas
    return (jaccardSimilarity * 0.7) + (subsequenceSimilarity * 0.3);
  }

  private normalizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // remover pontuação
      .split(/\s+/)
      .filter(word => word.length > 2) // remover palavras muito curtas
      .filter(word => !this.isStopWord(word)); // remover stop words
  }

  private isStopWord(word: string): boolean {
    const stopWords = [
      'o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
      'por', 'para', 'com', 'sem', 'sobre', 'entre', 'até', 'desde', 'para', 'que', 'um',
      'uma', 'uns', 'umas', 'é', 'são', 'foi', 'foram', 'ser', 'estar', 'está', 'estão'
    ];
    
    return stopWords.includes(word);
  }

  private calculateSubsequenceSimilarity(words1: string[], words2: string[]): number {
    // Algoritmo de maior subsequência comum (LCS)
    const m = words1.length;
    const n = words2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (words1[i - 1] === words2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    const lcsLength = dp[m][n];
    const maxLength = Math.max(m, n);
    
    return maxLength > 0 ? lcsLength / maxLength : 0;
  }

  private extractCTA(content: string): string {
    // Padrões de CTA comuns
    const ctaPatterns = [
      /compre\s+agora/i,
      /clique\s+aqui/i,
      /saiba\s+mais/i,
      /confira\s+agora/i,
      /não\s+perca/i,
      /última\s+chance/i,
      /oferta\s+limitada/i,
      /garanta\s+o\s+seu/i,
      /peça\s+agora/i,
      /adquira\s+já/i
    ];

    for (const pattern of ctaPatterns) {
      const match = content.match(pattern);
      if (match) {
        // Extrair frase completa do CTA
        const start = Math.max(0, match.index! - 20);
        const end = Math.min(content.length, match.index! + match[0].length + 20);
        return content.substring(start, end).trim();
      }
    }

    // Se não encontrar CTA explícito, procurar por links
    const linkPattern = /https?:\/\/[^\s]+/g;
    const links = content.match(linkPattern);
    
    if (links && links.length > 0) {
      // Retornar contexto ao redor do link
      const linkIndex = content.indexOf(links[0]);
      const start = Math.max(0, linkIndex - 30);
      const end = Math.min(content.length, linkIndex + links[0].length + 30);
      return content.substring(start, end).trim();
    }

    return '';
  }

  private getRecentPosts(hours: number): Array<{
    content: string;
    timestamp: Date;
    cta: string;
    similarity: number;
  }> {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    
    return this.recentPosts
      .filter(post => post.timestamp > cutoffTime)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  recordPost(content: string): void {
    const cta = this.extractCTA(content);
    
    // Verificar se é muito similar a posts recentes
    const recentPosts = this.getRecentPosts(1); // última hora
    let maxSimilarity = 0;
    
    for (const post of recentPosts) {
      const similarity = this.calculateTextSimilarity(content, post.content);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    // Se for muito similar, registrar como duplicado
    if (maxSimilarity > this.config.textSimilarityThreshold) {
      console.warn(`Post muito similar (${(maxSimilarity * 100).toFixed(1)}%) a post recente`);
    }

    // Adicionar ao histórico
    this.recentPosts.push({
      content,
      timestamp: new Date(),
      cta,
      similarity: maxSimilarity
    });

    // Manter apenas posts recentes (últimos 7 dias)
    const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    this.recentPosts = this.recentPosts.filter(post => post.timestamp > weekAgo);

    this.saveRecentPosts();
  }

  getSimilarityReport(): {
    totalPosts: number;
    averageSimilarity: number;
    highSimilarityPosts: number;
    duplicateCTAs: number;
  } {
    const recentPosts = this.getRecentPosts(24);
    
    if (recentPosts.length === 0) {
      return {
        totalPosts: 0,
        averageSimilarity: 0,
        highSimilarityPosts: 0,
        duplicateCTAs: 0
      };
    }

    const totalSimilarity = recentPosts.reduce((sum, post) => sum + post.similarity, 0);
    const averageSimilarity = totalSimilarity / recentPosts.length;
    
    const highSimilarityPosts = recentPosts.filter(post => 
      post.similarity > this.config.textSimilarityThreshold
    ).length;
    
    const duplicateCTAs = recentPosts.filter(post => {
      const similarCTAs = recentPosts.filter(other => 
        other !== post && this.calculateTextSimilarity(post.cta, other.cta) > this.config.ctaSimilarityThreshold
      );
      return similarCTAs.length > 0;
    }).length;

    return {
      totalPosts: recentPosts.length,
      averageSimilarity,
      highSimilarityPosts,
      duplicateCTAs
    };
  }

  private loadRecentPosts(): void {
    try {
      const stored = localStorage.getItem('forgeDeals_duplicate_detector');
      if (stored) {
        const data = JSON.parse(stored);
        this.recentPosts = data.map((post: any) => ({
          ...post,
          timestamp: new Date(post.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Erro ao carregar posts recentes:', error);
    }
  }

  private saveRecentPosts(): void {
    try {
      localStorage.setItem('forgeDeals_duplicate_detector', JSON.stringify(this.recentPosts));
    } catch (error) {
      console.warn('Erro ao salvar posts recentes:', error);
    }
  }

  clearHistory(): void {
    this.recentPosts = [];
    this.saveRecentPosts();
  }
}
