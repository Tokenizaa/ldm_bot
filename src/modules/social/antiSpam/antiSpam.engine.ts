import { SpamRiskFactors, SpamRiskScore, AntiSpamConfig } from './types';
import { FrequencyLimiter } from './frequencyLimiter';
import { DuplicateDetector } from './duplicateDetector';
import { ContentVariation } from './contentVariation';
import { LinkPatternDetector } from './linkPatternDetector';
import { HumanBehavior } from './humanBehavior';

export class AntiSpamEngine {
  private config: AntiSpamConfig;
  private frequencyLimiter: FrequencyLimiter;
  private duplicateDetector: DuplicateDetector;
  private contentVariation: ContentVariation;
  private linkPatternDetector: LinkPatternDetector;
  private humanBehavior: HumanBehavior;

  constructor(config: AntiSpamConfig) {
    this.config = config;
    this.frequencyLimiter = new FrequencyLimiter(config.frequency);
    this.duplicateDetector = new DuplicateDetector(config.duplicate);
    this.contentVariation = new ContentVariation(config.variation);
    this.linkPatternDetector = new LinkPatternDetector(config.links);
    this.humanBehavior = new HumanBehavior(config.human);
  }

  async evaluateSpamRisk(content: string, metadata: any): Promise<SpamRiskScore> {
    const factors: SpamRiskFactors = {
      textRepetition: await this.duplicateDetector.checkTextRepetition(content),
      ctaRepetition: await this.duplicateDetector.checkCTARepetition(content),
      emojiOveruse: this.countEmojis(content),
      domainRepetition: await this.linkPatternDetector.checkDomainRepetition(metadata.links),
      timePattern: await this.frequencyLimiter.checkTimePattern(),
      hashtagRepetition: this.countHashtags(content),
      accountFrequency: await this.frequencyLimiter.getAccountFrequency(),
      linkCount: metadata.links?.length || 0,
      consecutivePromos: await this.frequencyLimiter.getConsecutivePromos(),
      humanBehaviorScore: await this.humanBehavior.analyzeBehavior(metadata)
    };

    const score = this.calculateRiskScore(factors);
    const classification = this.classifyRisk(score);

    return {
      score,
      classification,
      factors,
      recommendations: this.generateRecommendations(factors, classification)
    };
  }

  private countEmojis(content: string): number {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const matches = content.match(emojiRegex);
    return matches ? matches.length : 0;
  }

  private countHashtags(content: string): number {
    const hashtagRegex = /#\w+/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.length : 0;
  }

  private calculateRiskScore(factors: SpamRiskFactors): number {
    const weights = {
      textRepetition: 15,
      ctaRepetition: 20,
      emojiOveruse: 10,
      domainRepetition: 25,
      timePattern: 15,
      hashtagRepetition: 5,
      accountFrequency: 20,
      linkCount: 10,
      consecutivePromos: 30,
      humanBehaviorScore: -20 // Negative weight for good human behavior
    };

    let score = 0;
    for (const [factor, value] of Object.entries(factors)) {
      const weight = weights[factor as keyof typeof weights] || 0;
      score += (value as number) * weight;
    }

    return Math.max(0, Math.min(100, score));
  }

  private classifyRisk(score: number): 'safe' | 'moderate' | 'high' {
    if (score <= 30) return 'safe';
    if (score <= 60) return 'moderate';
    return 'high';
  }

  private generateRecommendations(factors: SpamRiskFactors, classification: string): string[] {
    const recommendations: string[] = [];

    if (factors.textRepetition > 0.7) {
      recommendations.push('Variar mais o texto do post');
    }

    if (factors.ctaRepetition > 0.6) {
      recommendations.push('Usar diferentes CTAs');
    }

    if (factors.emojiOveruse > 5) {
      recommendations.push('Reduzir número de emojis');
    }

    if (factors.domainRepetition > 0.8) {
      recommendations.push('Alternar domínios de links');
    }

    if (factors.consecutivePromos > 3) {
      recommendations.push('Adicionar posts não promocionais');
    }

    if (classification === 'high') {
      recommendations.push('Revisar completamente o post');
      recommendations.push('Considerar agendar para outro horário');
    }

    return recommendations;
  }

  async canPost(groupId: string, content: string): Promise<{ canPost: boolean; reason?: string; cooldown?: number }> {
    // Verificar cooldown do grupo
    const groupCooldown = await this.frequencyLimiter.checkGroupCooldown(groupId);
    if (groupCooldown.cooldownActive) {
      return {
        canPost: false,
        reason: `Grupo em cooldown. Próximo post em ${groupCooldown.timeUntil} minutos`,
        cooldown: groupCooldown.timeUntil
      };
    }

    // Verificar frequência geral
    const frequencyCheck = await this.frequencyLimiter.checkPostingFrequency();
    if (!frequencyCheck.canPost) {
      return {
        canPost: false,
        reason: `Limite de posts diário atingido. Próximo post em ${frequencyCheck.timeUntil} minutos`,
        cooldown: frequencyCheck.timeUntil
      };
    }

    // Verificar risco de spam
    const spamRisk = await this.evaluateSpamRisk(content, { groupId });
    if (spamRisk.classification === 'high') {
      return {
        canPost: false,
        reason: 'Alto risco de spam detectado. ' + spamRisk.recommendations.join(', ')
      };
    }

    return { canPost: true };
  }

  async generateSafeVariation(originalContent: string, variationType: 'offer' | 'question' | 'review' | 'comparison'): Promise<string> {
    return await this.contentVariation.generateVariation(originalContent, variationType);
  }

  async addHumanBehavior(page: any): Promise<void> {
    await this.humanBehavior.simulateHumanBehavior(page);
  }
}
