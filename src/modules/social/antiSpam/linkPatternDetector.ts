import { AntiSpamConfig } from './types';

export class LinkPatternDetector {
  private config: AntiSpamConfig['links'];
  private domainHistory: Map<string, Date[]> = new Map();
  private recentLinks: Array<{
    url: string;
    domain: string;
    timestamp: Date;
    postId?: string;
  }> = [];

  constructor(config: AntiSpamConfig['links']) {
    this.config = config;
    this.loadDomainHistory();
  }

  async checkDomainRepetition(links: string[]): Promise<number> {
    if (links.length === 0) return 0;

    const domains = links.map(link => this.extractDomain(link));
    const domainCounts = new Map<string, number>();

    // Contar ocorrências de cada domínio nas últimas 24 horas
    const last24Hours = new Date(Date.now() - (24 * 60 * 60 * 1000));
    
    for (const domain of domains) {
      const domainPosts = this.domainHistory.get(domain) || [];
      const recentPosts = domainPosts.filter(date => date > last24Hours);
      domainCounts.set(domain, recentPosts.length);
    }

    // Calcular taxa de repetição
    let maxRepetitionRate = 0;
    for (const [domain, count] of domainCounts.entries()) {
      const rate = count / links.length;
      maxRepetitionRate = Math.max(maxRepetitionRate, rate);
    }

    return maxRepetitionRate;
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch {
      // Se não for URL válida, tentar extrair domínio manualmente
      const domainMatch = url.match(/https?:\/\/([^\/]+)/);
      return domainMatch ? domainMatch[1].toLowerCase() : 'unknown';
    }
  }

  recordLinks(links: string[], postId?: string): void {
    const now = new Date();

    for (const link of links) {
      const domain = this.extractDomain(link);
      
      // Registrar no histórico de domínios
      if (!this.domainHistory.has(domain)) {
        this.domainHistory.set(domain, []);
      }
      
      const domainPosts = this.domainHistory.get(domain)!;
      domainPosts.push(now);
      
      // Manter apenas últimos 7 dias
      const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
      this.domainHistory.set(domain, domainPosts.filter(date => date > weekAgo));

      // Registrar link recente
      this.recentLinks.push({
        url: link,
        domain,
        timestamp: now,
        postId
      });
    }

    // Manter apenas últimos 100 links
    if (this.recentLinks.length > 100) {
      this.recentLinks = this.recentLinks.slice(-100);
    }

    this.saveDomainHistory();
  }

  getDomainReport(): {
    totalDomains: number;
    topDomains: Array<{ domain: string; count: number; lastUsed: Date }>;
    highFrequencyDomains: string[];
    allowedDomainsCompliance: number;
  } {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    const domainStats = new Map<string, { count: number; lastUsed: Date }>();

    // Calcular estatísticas dos últimos 24 horas
    for (const [domain, dates] of this.domainHistory.entries()) {
      const recentDates = dates.filter(date => date > last24Hours);
      if (recentDates.length > 0) {
        const lastUsed = recentDates[recentDates.length - 1];
        domainStats.set(domain, {
          count: recentDates.length,
          lastUsed
        });
      }
    }

    // Ordenar por frequência
    const sortedDomains = Array.from(domainStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    const topDomains = sortedDomains.map(([domain, stats]) => ({
      domain,
      count: stats.count,
      lastUsed: stats.lastUsed
    }));

    // Identificar domínios de alta frequência
    const avgFrequency = Array.from(domainStats.values())
      .reduce((sum, stats) => sum + stats.count, 0) / domainStats.size;
    
    const highFrequencyDomains = Array.from(domainStats.entries())
      .filter(([_, stats]) => stats.count > avgFrequency * 2)
      .map(([domain]) => domain);

    // Verificar conformidade com domínios permitidos
    const allowedDomains = this.config.allowedDomains || [];
    const allowedDomainsCompliance = this.calculateAllowedDomainsCompliance(allowedDomains);

    return {
      totalDomains: domainStats.size,
      topDomains,
      highFrequencyDomains,
      allowedDomainsCompliance
    };
  }

  private calculateAllowedDomainsCompliance(allowedDomains: string[]): number {
    if (allowedDomains.length === 0) return 100; // Sem restrição = 100% conformidade

    const last24Hours = new Date(Date.now() - (24 * 60 * 60 * 1000));
    let totalLinks = 0;
    let allowedLinks = 0;

    for (const link of this.recentLinks) {
      if (link.timestamp > last24Hours) {
        totalLinks++;
        if (allowedDomains.includes(link.domain)) {
          allowedLinks++;
        }
      }
    }

    return totalLinks > 0 ? (allowedLinks / totalLinks) * 100 : 100;
  }

  isLinkAllowed(url: string): boolean {
    if (this.config.allowedDomains.length === 0) return true;

    const domain = this.extractDomain(url);
    return this.config.allowedDomains.includes(domain);
  }

  getLinkDiversityScore(): number {
    const last24Hours = new Date(Date.now() - (24 * 60 * 60 * 1000));
    const recentLinks = this.recentLinks.filter(link => link.timestamp > last24Hours);
    
    if (recentLinks.length === 0) return 100;

    const uniqueDomains = new Set(recentLinks.map(link => link.domain));
    const diversityScore = (uniqueDomains.size / recentLinks.length) * 100;

    return diversityScore;
  }

  getSafePostingInterval(domain: string): number {
    const domainPosts = this.domainHistory.get(domain) || [];
    
    if (domainPosts.length === 0) return this.config.minCooldownMinutes;

    // Calcular intervalo médio entre posts do mesmo domínio
    const sortedPosts = domainPosts.sort((a, b) => a.getTime() - b.getTime());
    const intervals: number[] = [];

    for (let i = 1; i < sortedPosts.length; i++) {
      const interval = (sortedPosts[i].getTime() - sortedPosts[i - 1].getTime()) / (1000 * 60);
      intervals.push(interval);
    }

    if (intervals.length === 0) return this.config.minCooldownMinutes;

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    // Adicionar margem de segurança
    return Math.max(this.config.minCooldownMinutes, avgInterval * 1.5);
  }

  detectSuspiciousPatterns(): Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    affectedDomains: string[];
  }> {
    const patterns = [];
    const now = new Date();
    const lastHour = new Date(now.getTime() - (60 * 60 * 1000));

    // Padrão 1: Muitos links do mesmo domínio em pouco tempo
    for (const [domain, dates] of this.domainHistory.entries()) {
      const recentLinks = dates.filter(date => date > lastHour);
      
      if (recentLinks.length >= 3) {
        patterns.push({
          type: 'domain_burst',
          description: `Alta frequência de links do domínio ${domain} na última hora`,
          severity: 'high',
          affectedDomains: [domain]
        });
      }
    }

    // Padrão 2: Domínios não permitidos
    const recentLinks = this.recentLinks.filter(link => link.timestamp > lastHour);
    const disallowedDomains = new Set<string>();

    for (const link of recentLinks) {
      if (!this.isLinkAllowed(link.url)) {
        disallowedDomains.add(link.domain);
      }
    }

    if (disallowedDomains.size > 0) {
      patterns.push({
        type: 'disallowed_domains',
        description: 'Links de domínios não permitidos detectados',
        severity: 'high',
        affectedDomains: Array.from(disallowedDomains)
      });
    }

    // Padrão 3: Baixa diversidade de domínios
    const diversityScore = this.getLinkDiversityScore();
    if (diversityScore < 30) {
      patterns.push({
        type: 'low_diversity',
        description: 'Baixa diversidade de domínios nos links recentes',
        severity: 'medium',
        affectedDomains: []
      });
    }

    return patterns;
  }

  private loadDomainHistory(): void {
    try {
      const stored = localStorage.getItem('forgeDeals_domain_history');
      if (stored) {
        const data = JSON.parse(stored);
        this.domainHistory = new Map(
          Object.entries(data).map(([domain, dates]) => [
            domain,
            (dates as string[]).map(dateStr => new Date(dateStr))
          ])
        );
      }
    } catch (error) {
      console.warn('Erro ao carregar histórico de domínios:', error);
    }
  }

  private saveDomainHistory(): void {
    try {
      const data = Object.fromEntries(
        Array.from(this.domainHistory.entries()).map(([domain, dates]) => [
          domain,
          dates.map(date => date.toISOString())
        ])
      );
      
      localStorage.setItem('forgeDeals_domain_history', JSON.stringify(data));
    } catch (error) {
      console.warn('Erro ao salvar histórico de domínios:', error);
    }
  }

  clearHistory(): void {
    this.domainHistory.clear();
    this.recentLinks = [];
    this.saveDomainHistory();
  }

  getStats(): any {
    return {
      totalDomains: this.domainHistory.size,
      recentLinks: this.recentLinks.length,
      linkDiversityScore: this.getLinkDiversityScore(),
      suspiciousPatterns: this.detectSuspiciousPatterns(),
      domainReport: this.getDomainReport()
    };
  }
}
